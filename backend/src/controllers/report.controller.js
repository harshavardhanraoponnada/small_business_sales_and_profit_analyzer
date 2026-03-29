const prisma = require("../services/prisma.service");

/* ================= DATE RANGE CALCULATOR ================= */
const getDateRange = (range, customStart, customEnd) => {
  const now = new Date();
  let startDate = new Date();

  switch (range) {
    case "daily":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      const dayOfWeek = now.getDay();
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      startDate = new Date(customStart);
      break;
    case "max":
      startDate = new Date(0);
      break;
    default:
      startDate.setHours(0, 0, 0, 0);
  }

  const endDate = range === "custom" ? new Date(customEnd) : now;
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

/* ================= SUMMARY ================= */
exports.getSummary = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const { startDate, endDate } = getDateRange(range, req.query.startDate, req.query.endDate);

    // Get total sales
    const salesData = await prisma.sale.aggregate({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false
      },
      _sum: { total: true },
      _count: true
    });

    // Get total expenses
    const expenseData = await prisma.expense.aggregate({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false
      },
      _sum: { amount: true },
      _count: true
    });

    const totalSales = salesData._sum.total ? Number(salesData._sum.total) : 0;
    const totalExpenses = expenseData._sum.amount ? Number(expenseData._sum.amount) : 0;
    const profit = totalSales - totalExpenses;

    res.json({
      range,
      totalSales,
      totalExpenses,
      profit,
      salesCount: salesData._count,
      expenseCount: expenseData._count,
      profitMargin: totalSales > 0 ? ((profit / totalSales) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error("❌ Summary error:", error.message);
    res.status(500).json({ message: "Summary failed" });
  }
};

/* ================= QUICK STATS ================= */
exports.getQuickStats = async (req, res) => {
  try {
    const type = req.query.type || "daily";
    const { startDate, endDate } = getDateRange(type);

    // Get sales for period
    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false
      },
      include: { variant: true }
    });

    // Get expenses for period
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false
      }
    });

    let totalSales = 0;
    let totalUnits = 0;
    let totalExpenses = 0;

    sales.forEach(sale => {
      totalSales += Number(sale.total || 0);
      totalUnits += sale.quantity;
    });

    expenses.forEach(exp => {
      totalExpenses += Number(exp.amount || 0);
    });

    const profit = totalSales - totalExpenses;

    res.json({
      type,
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalUnits,
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      profitMargin: totalSales > 0 ? parseFloat(((profit / totalSales) * 100).toFixed(2)) : 0
    });
  } catch (error) {
    console.error("❌ Quick stats error:", error.message);
    res.status(500).json({ message: "Quick stats failed" });
  }
};

/* ================= LOW STOCK ALERT ================= */
exports.getLowStock = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10;

    const variants = await prisma.variant.findMany({
      where: {
        stock: { lte: threshold },
        is_deleted: false
      },
      include: {
        model: {
          include: { brand: true }
        }
      }
    });

    res.json(variants.map(v => ({
      id: v.id,
      name: `${v.model.brand.name} ${v.model.name} ${v.variant_name}`,
      stock: v.stock,
      threshold: threshold
    })));
  } catch (error) {
    console.error("❌ Low stock error:", error.message);
    res.status(500).json({ message: "Low stock failed" });
  }
};

/* ================= SALES TREND ================= */
exports.getSalesTrend = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const { startDate, endDate } = getDateRange(range, req.query.startDate, req.query.endDate);

    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false
      },
      orderBy: { date: 'asc' }
    });

    const grouped = {};

    sales.forEach(sale => {
      let key;
      const date = new Date(sale.date);

      switch (range) {
        case "daily":
          key = date.toISOString().split('T')[0];
          break;
        case "weekly":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `Week of ${weekStart.toISOString().split('T')[0]}`;
          break;
        case "monthly":
          key = date.toISOString().slice(0, 7);
          break;
        case "yearly":
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      grouped[key] = (grouped[key] || 0) + Number(sale.total || 0);
    });

    const result = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sales]) => ({
        date,
        sales: parseFloat(sales.toFixed(2))
      }));

    res.json(result);
  } catch (error) {
    console.error("❌ Sales trend error:", error.message);
    res.status(500).json({ message: "Sales trend failed" });
  }
};

/* ================= PROFIT TREND ================= */
exports.getProfitTrend = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const { startDate, endDate } = getDateRange(range, req.query.startDate, req.query.endDate);

    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false
      },
      orderBy: { date: 'asc' }
    });

    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false
      },
      orderBy: { date: 'asc' }
    });

    const grouped = {};

    sales.forEach(sale => {
      let key;
      const date = new Date(sale.date);

      switch (range) {
        case "daily":
          key = date.toISOString().split('T')[0];
          break;
        case "monthly":
          key = date.toISOString().slice(0, 7);
          break;
        case "yearly":
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) grouped[key] = { sales: 0, expenses: 0 };
      grouped[key].sales += Number(sale.total || 0);
    });

    expenses.forEach(expense => {
      let key;
      const date = new Date(expense.date);

      switch (range) {
        case "daily":
          key = date.toISOString().split('T')[0];
          break;
        case "monthly":
          key = date.toISOString().slice(0, 7);
          break;
        case "yearly":
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) grouped[key] = { sales: 0, expenses: 0 };
      grouped[key].expenses += Number(expense.amount || 0);
    });

    const result = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        sales: parseFloat(data.sales.toFixed(2)),
        expenses: parseFloat(data.expenses.toFixed(2)),
        profit: parseFloat((data.sales - data.expenses).toFixed(2))
      }));

    res.json(result);
  } catch (error) {
    console.error("❌ Profit trend error:", error.message);
    res.status(500).json({ message: "Profit trend failed" });
  }
};

/* ================= EXPENSE DISTRIBUTION ================= */
exports.getExpenseDistribution = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const { startDate, endDate } = getDateRange(range);

    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false
      }
    });

    const grouped = {};

    expenses.forEach(exp => {
      const category = exp.category || "Other";
      grouped[category] = (grouped[category] || 0) + Number(exp.amount || 0);
    });

    const result = Object.entries(grouped)
      .map(([category, amount]) => ({
        category,
        amount: parseFloat(amount.toFixed(2))
      }))
      .sort((a, b) => b.amount - a.amount);

    res.json(result);
  } catch (error) {
    console.error("❌ Expense distribution error:", error.message);
    res.status(500).json({ message: "Expense distribution failed" });
  }
};

/* ================= EXPENSE ANALYTICS ================= */
exports.getExpenseAnalytics = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const { startDate, endDate } = getDateRange(range, req.query.startDate, req.query.endDate);

    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false
      },
      orderBy: { date: 'asc' }
    });

    const grouped = {};

    expenses.forEach(exp => {
      let key;
      const date = new Date(exp.date);

      switch (range) {
        case "daily":
          key = date.toISOString().split('T')[0];
          break;
        case "weekly":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `Week of ${weekStart.toISOString().split('T')[0]}`;
          break;
        case "monthly":
          key = date.toISOString().slice(0, 7);
          break;
        case "yearly":
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      grouped[key] = (grouped[key] || 0) + Number(exp.amount || 0);
    });

    const result = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date,
        amount: parseFloat(amount.toFixed(2))
      }));

    res.json(result);
  } catch (error) {
    console.error("❌ Expense analytics error:", error.message);
    res.status(500).json({ message: "Expense analytics failed" });
  }
};

/* ================= EXPORT REPORT ================= */
exports.exportReport = async (req, res) => {
  try {
    const { type, range } = req.body;

    res.json({
      message: "Export feature coming soon",
      type,
      range
    });
  } catch (error) {
    console.error("❌ Export error:", error.message);
    res.status(500).json({ message: "Export failed" });
  }
};

/* ================= SCHEDULED REPORTS ================= */
exports.createScheduledReport = async (req, res) => {
  res.json({ message: "Scheduled reports coming soon" });
};

exports.listSchedules = async (req, res) => {
  res.json([]);
};

exports.getSchedule = async (req, res) => {
  res.json({ message: "Schedule not found" });
};

exports.updateSchedule = async (req, res) => {
  res.json({ message: "Schedule updated" });
};

exports.deleteSchedule = async (req, res) => {
  res.json({ message: "Schedule deleted" });
};
