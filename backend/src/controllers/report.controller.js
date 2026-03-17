const path = require("path");
const { readCSV } = require("../services/csv.service");
const axios = require("axios");

const getDate = d => d.split("T")[0];
const toNum = v => Number(v || 0);

const salesFile = path.join(__dirname, "../data/sales.csv");
const expensesFile = path.join(__dirname, "../data/expenses.csv");
const variantsFile = path.join(__dirname, "../data/variants.csv");

const loadData = async () => {
  const [sales, expenses, products] = await Promise.all([
    readCSV(path.join(__dirname, "../data/sales.csv")),
    readCSV(path.join(__dirname, "../data/expenses.csv")),
    readCSV(path.join(__dirname, "../data/products.csv"))
  ]);

  // index products by id (O(1) lookup)
  const productMap = {};
  for (const p of products) productMap[p.id] = p;

  return { sales, expenses, productMap };
};

/* ================= SALES TREND ================= */
exports.getSalesTrend = async (req, res) => {
  try {
    const range = req.query.range || "daily";
    const { startDate, endDate } = req.query;
    const sales = await readCSV(
      path.join(__dirname, "../data/sales.csv")
    );
    const now = new Date();

    const inRange = (dateStr) => {
      const d = new Date(dateStr);

      switch (range) {
        case "daily":
          return d.toDateString() === now.toDateString();
        case "weekly":
          return (now - d) / 86400000 < 7;
        case "monthly":
          return d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
        case "yearly":
          // Return all data grouped by month (useful for multi-year trends)
          return true;
        case "custom":
          if (!startDate || !endDate) return false;
          const s = new Date(startDate);
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          return d >= s && d <= e;
        case "max":
          return true;
        default:
          return false;
      }
    };

    if (range === "max") {
      // For max, return total sales across all time
      let totalSales = 0;
      for (const s of sales) {
        if (s.total) {
          totalSales += Number(s.total);
        }
      }
      res.json([{ date: "All Time", sales: totalSales }]);
      return;
    }

    const filteredSales = sales.filter(s => inRange(s.date));
    const grouped = {};

    for (const s of filteredSales) {
      if (!s.date || !s.total) continue;

      const d = new Date(s.date);
      let key;

      switch (range) {
        case "daily":
          key = s.date.split("T")[0];
          break;
        case "weekly":
          key = s.date.split("T")[0]; // daily totals for week
          break;
        case "monthly":
          key = s.date.split("T")[0]; // daily totals for month
          break;
        case "yearly":
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          break;
        case "yearly":
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          break;
        case "custom":
          key = s.date.split("T")[0];
          break;
        default:
          key = s.date.split("T")[0];
      }

      grouped[key] = (grouped[key] || 0) + Number(s.total);
    }

    const result = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sales]) => ({ date, sales }));

    res.json(result);
  } catch (err) {
    console.error("Sales trend error:", err);
    res.status(500).json({ message: "Sales trend failed" });
  }
};

/* ================= QUICK STATS ================= */
exports.getQuickStats = async (req, res) => {
  try {
    const type = req.query.type || "daily";

    const sales = await readCSV(salesFile);
    const expenses = await readCSV(expensesFile);
    const variants = await readCSV(variantsFile);
    const products = await readCSV(path.join(__dirname, "../data/products.csv"));

    const now = new Date();

    const isInRange = (dateStr) => {
      const d = new Date(dateStr);
      if (type === "daily") {
        return d.toDateString() === now.toDateString();
      }
      if (type === "weekly") {
        const diff = (now - d) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 7;
      }
      return false;
    };

    let salesTotal = 0;
    let unitsTotal = 0;
    let cogsTotal = 0;
    let expenseTotal = 0;

    sales.forEach(s => {
      if (!isInRange(s.date)) return;

      const qty = Number(s.quantity) || 0;
      const price = Number(s.unit_price) || 0;
      salesTotal += qty * price;
      unitsTotal += qty;

      // ✅ Try variant first (V1, V2, V3 format)
      let found = false;
      if (s.variant_id && s.variant_id.startsWith("V")) {
        const variant = variants.find(
          v => String(v.variant_id) === String(s.variant_id)
        );
        if (variant) {
          cogsTotal += qty * Number(variant.purchase_price || 0);
          found = true;
        }
      }

      // ✅ Try product (P001, P002 format or s.product_id)
      if (!found && (s.variant_id?.startsWith("P") || s.product_id)) {
        const prodId = s.product_id || s.variant_id;
        const product = products.find(
          p => String(p.product_id || p.id) === String(prodId)
        );
        if (product) {
          cogsTotal += qty * Number(product.purchase_price || 0);
        }
      }
    });

    expenses.forEach(e => {
      if (!isInRange(e.date)) return;
      expenseTotal += Number(e.amount) || 0;
    });

    const profit = salesTotal - cogsTotal - expenseTotal;

    res.json({
      sales: salesTotal,
      units: unitsTotal,
      expenses: expenseTotal,
      profit
    });
  } catch (err) {
    console.error("Quick stats error:", err);
    res.status(500).json({ message: "Quick stats failed" });
  }
};

/* ================= LOW STOCK ALERT ================= */
exports.getLowStock = async (req, res) => {
  try {
    const [variants, models, brands] = await Promise.all([
      readCSV(variantsFile),
      readCSV(path.join(__dirname, "../data/models.csv")),
      readCSV(path.join(__dirname, "../data/brands.csv"))
    ]);

    // Create maps for quick lookup
    const modelMap = {};
    models.forEach(m => modelMap[m.model_id] = m);

    const brandMap = {};
    brands.forEach(b => brandMap[b.brand_id] = b);

    const lowStock = variants.filter(v =>
      Number(v.stock) <= Number(v.reorder_level)
    );

    res.json(
      lowStock.map(v => {
        const model = modelMap[v.model_id];
        const brand = model ? brandMap[model.brand_id] : null;
        const fullName = brand && model ? `${brand.name} ${model.name} ${v.variant_name}` : v.variant_name;

        return {
          variant_id: v.variant_id,
          model_id: v.model_id,
          variant_name: v.variant_name,
          full_name: fullName,
          stock: Number(v.stock),
          reorder_level: Number(v.reorder_level)
        };
      })
    );
  } catch (err) {
    console.error("Low stock error:", err);
    res.status(500).json({ message: "Low stock failed" });
  }
};

/* ================= PROFIT TREND ================= */
exports.getProfitTrend = async (req, res) => {
  try {
    const sales = await readCSV(path.join(__dirname, "../data/sales.csv"));
    const expenses = await readCSV(path.join(__dirname, "../data/expenses.csv"));
    const variants = await readCSV(path.join(__dirname, "../data/variants.csv"));
    const products = await readCSV(path.join(__dirname, "../data/products.csv"));

    const dailySales = {};
    const dailyCOGS = {};
    const dailyExpenses = {};

    for (const s of sales) {
      if (!s.date) continue;

      const date = getDate(s.date);
      dailySales[date] = (dailySales[date] || 0) + toNum(s.total);

      // ✅ Try variant first (V1, V2, V3 format)
      let found = false;
      if (s.variant_id && s.variant_id.startsWith("V")) {
        const variant = variants.find(
          v => String(v.variant_id) === String(s.variant_id)
        );
        if (variant) {
          dailyCOGS[date] =
            (dailyCOGS[date] || 0) + toNum(variant.purchase_price) * toNum(s.quantity);
          found = true;
        }
      }

      // ✅ Try product (P001, P002 format or s.product_id)
      if (!found && (s.variant_id?.startsWith("P") || s.product_id)) {
        const prodId = s.product_id || s.variant_id;
        const product = products.find(
          p => String(p.product_id || p.id) === String(prodId)
        );
        if (product) {
          dailyCOGS[date] =
            (dailyCOGS[date] || 0) + toNum(product.purchase_price) * toNum(s.quantity);
        }
      }
    }

    for (const e of expenses) {
      if (!e.date || !e.amount) continue;

      const date = getDate(e.date);
      dailyExpenses[date] =
        (dailyExpenses[date] || 0) + toNum(e.amount);
    }

    const dates = new Set([
      ...Object.keys(dailySales),
      ...Object.keys(dailyExpenses)
    ]);

    res.json(
      [...dates]
        .sort()
        .map(date => ({
          date,
          profit:
            (dailySales[date] || 0) -
            (dailyCOGS[date] || 0) -
            (dailyExpenses[date] || 0)
        }))
    );
  } catch (err) {
    console.error("Profit trend error:", err);
    res.status(500).json({ message: "Profit trend failed" });
  }
};

/* ================= EXPENSE DISTRIBUTION ================= */
exports.getExpenseDistribution = async (req, res) => {
  try {
    const expenses = await readCSV(
      path.join(__dirname, "../data/expenses.csv")
    );

    const grouped = {};

    for (const e of expenses) {
      if (!e.category || !e.amount) continue;

      grouped[e.category] =
        (grouped[e.category] || 0) + Number(e.amount);
    }

    const result = Object.entries(grouped).map(
      ([category, amount]) => ({ category, amount })
    );

    res.json(result);
  } catch (err) {
    console.error("Expense distribution error:", err);
    res.status(500).json({ message: "Expense distribution failed" });
  }
};

/* ================= SUMMARY ================= */
exports.getSummary = async (req, res) => {
  try {
    const sales = await readCSV(salesFile);
    const expenses = await readCSV(expensesFile);
    const variants = await readCSV(path.join(__dirname, "../data/variants.csv"));
    const products = await readCSV(path.join(__dirname, "../data/products.csv"));

    console.log("Sales data:", sales.length, "records");
    console.log("Expenses data:", expenses.length, "records");
    console.log("Variants data:", variants.length, "records");

    let totalSales = 0;
    let totalCOGS = 0;

    sales.forEach(sale => {
      const qty = Number(sale.quantity) || 0;
      const unitPrice = Number(sale.unit_price) || 0;

      // ✅ Always compute sales
      const saleTotal = qty * unitPrice;
      totalSales += saleTotal;

      // ✅ Try variant first (V1, V2, V3 format)
      let found = false;
      if (sale.variant_id && sale.variant_id.startsWith("V")) {
        const variant = variants.find(
          v => String(v.variant_id) === String(sale.variant_id)
        );
        if (variant) {
          const purchase = Number(variant.purchase_price) || 0;
          totalCOGS += purchase * qty;
          found = true;
        }
      }

      // ✅ Try product (P001, P002 format or sale.product_id)
      if (!found && (sale.variant_id?.startsWith("P") || sale.product_id)) {
        const prodId = sale.product_id || sale.variant_id;
        const product = products.find(
          p => String(p.product_id || p.id) === String(prodId)
        );
        if (product) {
          const purchase = Number(product.purchase_price) || 0;
          totalCOGS += purchase * qty;
        }
      }
    });

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );

    console.log("Calculated totals:", { totalSales, totalCOGS, totalExpenses });

    const netProfit = totalSales - totalCOGS - totalExpenses;

    res.json({
      totalSales,
      cogs: totalCOGS,
      totalExpenses,
      netProfit
    });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: "Summary failed" });
  }
};


/* ================= LOW STOCK PRODUCTS ================= */
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await readCSV(
      path.join(__dirname, "../data/products.csv")
    );

    const lowStock = products.filter(
      p => Number(p.stock) <= Number(p.reorder_level)
    );

    res.json(lowStock);
  } catch (err) {
    console.error("Low stock products error:", err);
    res.status(500).json({ message: "Low stock products failed" });
  }
};

/* ================= EXPENSE ANALYTICS ================= */
exports.getExpenseAnalytics = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const { startDate, endDate } = req.query;
    const expenses = await readCSV(expensesFile);
    const now = new Date();

    const inRange = (dateStr) => {
      const d = new Date(dateStr);

      switch (range) {
        case "daily":
          return d.toDateString() === now.toDateString();
        case "weekly":
          return (now - d) / 86400000 < 7;
        case "monthly":
          return d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
        case "yearly":
          // Return data for current year
          return d.getFullYear() === now.getFullYear();
        case "custom":
          if (!startDate || !endDate) return false;
          const s = new Date(startDate);
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          return d >= s && d <= e;
        case "max":
          return true;
        default:
          return false;
      }
    };

    // For max, return total expenses and distribution from all data
    if (range === "max") {
      let totalExpenses = 0;
      const byCategory = {};
      for (const e of expenses) {
        if (e.amount) {
          totalExpenses += Number(e.amount);
        }
        if (e.category) {
          const cat = e.category.toLowerCase();
          byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount);
        }
      }
      const distribution = Object.entries(byCategory).map(
        ([category, amount]) => ({ category, amount })
      );
      res.json({ trend: [{ date: "All Time", amount: totalExpenses }], distribution });
      return;
    }

    // Filter expenses based on range
    const filteredExpenses = expenses.filter(e => e.date && inRange(e.date));

    // Trend data: aggregate filtered data
    const grouped = {};
    for (const e of filteredExpenses) {
      if (!e.amount) continue;

      const d = new Date(e.date);
      let key;

      switch (range) {
        case "daily":
        case "weekly":
        case "monthly":
          key = e.date.split("T")[0]; // daily totals
          break;
        case "yearly":
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // monthly totals
          break;
        case "yearly":
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // monthly totals
          break;
        case "custom":
          key = e.date.split("T")[0];
          break;
        default:
          key = e.date.split("T")[0];
      }

      grouped[key] = (grouped[key] || 0) + Number(e.amount);
    }

    // Fill gaps with 0
    let filledData = [];
    const year = now.getFullYear();
    const month = now.getMonth();

    if (range === "daily") {
      // Just today
      const today = now.toISOString().split("T")[0];
      filledData = [{ date: today, amount: grouped[today] || 0 }];
    } else if (range === "yearly") {
      // All months of current year
      for (let m = 0; m < 12; m++) {
        const k = `${year}-${String(m + 1).padStart(2, "0")}`;
        filledData.push({ date: k, amount: grouped[k] || 0 });
      }
    } else if (range === "monthly") {
      // All days of current month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        filledData.push({ date: dateStr, amount: grouped[dateStr] || 0 });
      }
    } else if (range === "weekly") {
      // Last 7 days including today? Or starts from today? 
      // Logic in inRange for weekly was: (now - d) / 86400000 < 7. Which means Last 7 days.
      // Let's iterate back 6 days + today
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const k = d.toISOString().split("T")[0];
        filledData.push({ date: k, amount: grouped[k] || 0 });
      }
    } else {
      // Fallback for default/other
      filledData = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({ date, amount }));
    }

    const trend = filledData;

    // Pie chart data (category-wise, using FILTERED data)
    const byCategory = {};
    filteredExpenses.forEach(e => {
      if (e.category) {
        const cat = e.category.toLowerCase();
        byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount);
      }
    });

    const distribution = Object.entries(byCategory).map(
      ([category, amount]) => ({ category, amount })
    );

    res.json({ trend, distribution });
  } catch (err) {
    console.error("Expense analytics error:", err);
    res.status(500).json({ message: "Expense analytics failed" });
  }
};

/* ================= EXPORT REPORT ================= */
exports.exportReport = async (req, res) => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:5001";
    const token = req.headers.authorization;

    const { type, format, range, startDate, endDate } = req.body;

    // Validate inputs
    if (!type) {
      return res.status(400).json({ error: "type is required" });
    }
    if (!format) {
      return res.status(400).json({ error: "format is required" });
    }

    try {
      // Call ML service export endpoint
      const response = await axios.post(
        `${mlServiceUrl}/api/reports/export`,
        { type, format, range, startDate, endDate },
        {
          headers: { Authorization: token },
          responseType: format === "pdf" ? "arraybuffer" : "arraybuffer",
        }
      );

      // Set appropriate content type
      const contentType =
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="report_${new Date().getTime()}.${format === "pdf" ? "pdf" : "xlsx"}"`
      );
      res.send(response.data);
    } catch (mlError) {
      console.error("ML service error:", mlError.message);
      res.status(500).json({
        error: "Failed to generate report",
        details: mlError.message,
      });
    }
  } catch (err) {
    console.error("Export report error:", err);
    res.status(500).json({ message: "Export report failed" });
  }
};

/* ================= CREATE SCHEDULED REPORT ================= */
exports.createScheduledReport = async (req, res) => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:5001";
    const token = req.headers.authorization;

    const { reportType, format, frequency, recipients, enabled } = req.body;

    // Validate inputs
    if (!reportType) {
      return res.status(400).json({ error: "reportType is required" });
    }

    try {
      // Call ML service schedule endpoint
      const response = await axios.post(
        `${mlServiceUrl}/api/reports/schedule`,
        { reportType, format, frequency, recipients, enabled },
        { headers: { Authorization: token } }
      );

      res.status(201).json(response.data);
    } catch (mlError) {
      console.error("ML service error:", mlError.message);
      res.status(500).json({
        error: "Failed to create schedule",
        details: mlError.message,
      });
    }
  } catch (err) {
    console.error("Create schedule error:", err);
    res.status(500).json({ message: "Create schedule failed" });
  }
};

/* ================= LIST SCHEDULES ================= */
exports.listSchedules = async (req, res) => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:5001";
    const token = req.headers.authorization;

    try {
      const response = await axios.get(`${mlServiceUrl}/api/reports/schedules`, {
        headers: { Authorization: token },
      });

      res.json(response.data);
    } catch (mlError) {
      console.error("ML service error:", mlError.message);
      res.status(500).json({
        error: "Failed to list schedules",
        details: mlError.message,
      });
    }
  } catch (err) {
    console.error("List schedules error:", err);
    res.status(500).json({ message: "List schedules failed" });
  }
};

/* ================= GET SCHEDULE ================= */
exports.getSchedule = async (req, res) => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:5001";
    const token = req.headers.authorization;
    const { scheduleId } = req.params;

    try {
      const response = await axios.get(
        `${mlServiceUrl}/api/reports/schedules/${scheduleId}`,
        { headers: { Authorization: token } }
      );

      res.json(response.data);
    } catch (mlError) {
      console.error("ML service error:", mlError.message);
      if (mlError.response?.status === 404) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.status(500).json({
        error: "Failed to get schedule",
        details: mlError.message,
      });
    }
  } catch (err) {
    console.error("Get schedule error:", err);
    res.status(500).json({ message: "Get schedule failed" });
  }
};

/* ================= UPDATE SCHEDULE ================= */
exports.updateSchedule = async (req, res) => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:5001";
    const token = req.headers.authorization;
    const { scheduleId } = req.params;

    try {
      const response = await axios.put(
        `${mlServiceUrl}/api/reports/schedules/${scheduleId}`,
        req.body,
        { headers: { Authorization: token } }
      );

      res.json(response.data);
    } catch (mlError) {
      console.error("ML service error:", mlError.message);
      if (mlError.response?.status === 404) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.status(500).json({
        error: "Failed to update schedule",
        details: mlError.message,
      });
    }
  } catch (err) {
    console.error("Update schedule error:", err);
    res.status(500).json({ message: "Update schedule failed" });
  }
};

/* ================= DELETE SCHEDULE ================= */
exports.deleteSchedule = async (req, res) => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:5001";
    const token = req.headers.authorization;
    const { scheduleId } = req.params;

    try {
      const response = await axios.delete(
        `${mlServiceUrl}/api/reports/schedules/${scheduleId}`,
        { headers: { Authorization: token } }
      );

      res.json(response.data);
    } catch (mlError) {
      console.error("ML service error:", mlError.message);
      if (mlError.response?.status === 404) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.status(500).json({
        error: "Failed to delete schedule",
        details: mlError.message,
      });
    }
  } catch (err) {
    console.error("Delete schedule error:", err);
    res.status(500).json({ message: "Delete schedule failed" });
  }
};

