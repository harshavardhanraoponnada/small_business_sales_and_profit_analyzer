const prisma = require("../services/prisma.service");
const expenseCategoryService = require("../services/expenseCategory.service");
const { getReportSchedulerStatus } = require("../services/reportScheduler.service");

/* ================= DATE RANGE CALCULATOR ================= */
const getDateRange = (range, customStart, customEnd) => {
  const now = new Date();
  let startDate = new Date();

  switch (range) {
    case "daily":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "weekly": {
      const dayOfWeek = now.getDay();
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
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

const round2 = (value) => parseFloat(Number(value || 0).toFixed(2));

const parseBooleanEnv = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

const getReportMetricMode = () => {
  const configuredMode = String(process.env.REPORT_METRIC_MODE || "legacy")
    .trim()
    .toLowerCase();

  if (["legacy", "v2", "dual"].includes(configuredMode)) {
    return configuredMode;
  }

  return "legacy";
};

const getReconciliationTolerance = () => {
  const parsed = Number.parseFloat(process.env.REPORT_RECONCILIATION_TOLERANCE || "0.01");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0.01;
};

const getCutoverConfig = () => {
  const minSamples = Number.parseInt(process.env.REPORT_V2_CUTOVER_MIN_SAMPLES || "7", 10);
  const minPassRate = Number.parseFloat(process.env.REPORT_V2_CUTOVER_MIN_PASS_RATE || "1");
  const configuredWindow = String(process.env.REPORT_V2_CUTOVER_WINDOW || "daily")
    .trim()
    .toLowerCase();

  return {
    enabled: parseBooleanEnv(process.env.REPORT_V2_CUTOVER_ENABLED, false),
    minSamples: Number.isInteger(minSamples) && minSamples > 0 ? minSamples : 7,
    minPassRate:
      Number.isFinite(minPassRate) && minPassRate >= 0
        ? Math.min(1, minPassRate)
        : 1,
    window: ["daily", "weekly", "monthly"].includes(configuredWindow)
      ? configuredWindow
      : "daily",
  };
};

const getDefaultCutoverMetadata = () => ({
  enabled: false,
  window: null,
  minSamples: null,
  minPassRate: null,
  evaluatedSamples: 0,
  reconciledSamples: 0,
  failedSamples: 0,
  passRate: 0,
  accepted: false,
  promoted: false,
});

const buildCutoverDiagnostics = ({ salesRows = [], expenseRows = [], window }) => {
  const bucketMap = new Map();

  const getBucket = (key) => {
    if (!bucketMap.has(key)) {
      bucketMap.set(key, {
        totalSales: 0,
        expenses: [],
      });
    }

    return bucketMap.get(key);
  };

  for (const sale of salesRows) {
    const key = getPeriodKey(sale.date, window);
    const bucket = getBucket(key);
    bucket.totalSales += Number(sale.total || 0);
  }

  for (const expense of expenseRows) {
    const key = getPeriodKey(expense.date, window);
    const bucket = getBucket(key);
    bucket.expenses.push(expense);
  }

  let reconciledSamples = 0;
  const bucketPreview = [];

  for (const [date, bucket] of bucketMap.entries()) {
    const {
      totalExpenses,
      cogsFromExpenses,
      operatingExpenses,
    } = getExpenseBreakdown(bucket.expenses);

    const bucketMetrics = getProfitMetrics({
      totalSales: bucket.totalSales,
      totalExpenses,
      operatingExpenses,
      cogsFromExpenses,
      metricsMode: "legacy",
    });

    if (bucketMetrics.reconciliation.isReconciled) {
      reconciledSamples += 1;
    }

    bucketPreview.push({
      date,
      delta: bucketMetrics.reconciliation.delta,
      isReconciled: bucketMetrics.reconciliation.isReconciled,
    });
  }

  const evaluatedSamples = bucketMap.size;
  const failedSamples = evaluatedSamples - reconciledSamples;
  const passRate = evaluatedSamples > 0 ? round2(reconciledSamples / evaluatedSamples) : 0;

  return {
    evaluatedSamples,
    reconciledSamples,
    failedSamples,
    passRate,
    bucketPreview: bucketPreview
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 25),
  };
};

const evaluateCutover = ({ metricsMode, cutoverConfig, diagnostics }) => {
  const accepted =
    diagnostics.evaluatedSamples >= cutoverConfig.minSamples &&
    diagnostics.passRate >= cutoverConfig.minPassRate;

  const promoted = metricsMode === "dual" && cutoverConfig.enabled && accepted;

  return {
    enabled: cutoverConfig.enabled,
    window: cutoverConfig.window,
    minSamples: cutoverConfig.minSamples,
    minPassRate: cutoverConfig.minPassRate,
    evaluatedSamples: diagnostics.evaluatedSamples,
    reconciledSamples: diagnostics.reconciledSamples,
    failedSamples: diagnostics.failedSamples,
    passRate: diagnostics.passRate,
    accepted,
    promoted,
    bucketPreview: diagnostics.bucketPreview,
  };
};

const getProfitMetrics = ({
  totalSales,
  totalExpenses,
  operatingExpenses,
  cogsFromExpenses,
  metricsMode = getReportMetricMode(),
  cutoverDecision,
}) => {
  const legacyProfit = round2(totalSales - totalExpenses);
  const v2Profit = round2(totalSales - operatingExpenses - cogsFromExpenses);
  const delta = round2(v2Profit - legacyProfit);
  const tolerance = getReconciliationTolerance();
  const defaultProfitMetric =
    metricsMode === "v2" || (metricsMode === "dual" && cutoverDecision && cutoverDecision.promoted)
      ? "profitV2"
      : "profit";

  return {
    profit: legacyProfit,
    profitV2: v2Profit,
    netProfit: defaultProfitMetric === "profitV2" ? v2Profit : legacyProfit,
    defaultProfitMetric,
    metricsMode,
    reconciliation: {
      delta,
      tolerance,
      isReconciled: Math.abs(delta) <= tolerance,
    },
  };
};

const getPeriodKey = (dateValue, range) => {
  const date = new Date(dateValue);

  switch (range) {
    case "daily":
      return date.toISOString().split("T")[0];
    case "weekly": {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `Week of ${weekStart.toISOString().split("T")[0]}`;
    }
    case "monthly":
      return date.toISOString().slice(0, 7);
    case "yearly":
      return date.getFullYear().toString();
    default:
      return date.toISOString().split("T")[0];
  }
};

const fetchExpensesForReporting = async ({ where, orderBy }) => {
  const relationSelect = {
    date: true,
    category: true,
    amount: true,
    affects_cogs_override: true,
    expense_category: {
      select: {
        name: true,
        affects_cogs_default: true,
      },
    },
  };

  const fallbackSelect = {
    date: true,
    category: true,
    amount: true,
    affects_cogs_override: true,
  };

  try {
    return await prisma.expense.findMany({
      where,
      orderBy,
      select: relationSelect,
    });
  } catch (error) {
    return prisma.expense.findMany({
      where,
      orderBy,
      select: fallbackSelect,
    });
  }
};

const getExpenseBreakdown = (expenses) => {
  let totalExpenses = 0;
  let cogsFromExpenses = 0;

  for (const expense of expenses) {
    const amount = Number(expense.amount || 0);
    totalExpenses += amount;

    if (expenseCategoryService.getEffectiveAffectsCogs(expense)) {
      cogsFromExpenses += amount;
    }
  }

  const operatingExpenses = totalExpenses - cogsFromExpenses;

  return {
    totalExpenses: round2(totalExpenses),
    cogsFromExpenses: round2(cogsFromExpenses),
    operatingExpenses: round2(operatingExpenses),
  };
};

/* ================= SUMMARY ================= */
exports.getSummary = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const { startDate, endDate } = getDateRange(range, req.query.startDate, req.query.endDate);
    const metricsMode = getReportMetricMode();

    const salesData = await prisma.sale.aggregate({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false,
      },
      _sum: { total: true },
      _count: true,
    });

    const expenseRows = await fetchExpensesForReporting({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false,
      },
      orderBy: { date: "asc" },
    });

    let cutoverMetadata = getDefaultCutoverMetadata();
    if (metricsMode === "dual") {
      const cutoverConfig = getCutoverConfig();
      const salesRows = await prisma.sale.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          is_deleted: false,
        },
        orderBy: { date: "asc" },
        select: { date: true, total: true },
      });

      const diagnostics = buildCutoverDiagnostics({
        salesRows,
        expenseRows,
        window: cutoverConfig.window,
      });
      cutoverMetadata = evaluateCutover({
        metricsMode,
        cutoverConfig,
        diagnostics,
      });
    }

    const totalSales = Number(salesData._sum.total || 0);
    const {
      totalExpenses,
      cogsFromExpenses,
      operatingExpenses,
    } = getExpenseBreakdown(expenseRows);

    const profitMetrics = getProfitMetrics({
      totalSales,
      totalExpenses,
      operatingExpenses,
      cogsFromExpenses,
      metricsMode,
      cutoverDecision: cutoverMetadata,
    });

    return res.json({
      range,
      totalSales: round2(totalSales),
      totalExpenses,
      cogsFromExpenses,
      cogs: cogsFromExpenses,
      operatingExpenses,
      profit: profitMetrics.profit,
      profitV2: profitMetrics.profitV2,
      netProfit: profitMetrics.netProfit,
      defaultProfitMetric: profitMetrics.defaultProfitMetric,
      metricsMode: profitMetrics.metricsMode,
      reconciliation: profitMetrics.reconciliation,
      cutover: cutoverMetadata,
      salesCount: salesData._count,
      expenseCount: expenseRows.length,
      profitMargin: totalSales > 0 ? ((profitMetrics.netProfit / totalSales) * 100).toFixed(2) : 0,
    });
  } catch (error) {
    console.error("Summary error:", error.message);
    return res.status(500).json({ message: "Summary failed" });
  }
};

/* ================= QUICK STATS ================= */
exports.getQuickStats = async (req, res) => {
  try {
    const type = req.query.type || "daily";
    const { startDate, endDate } = getDateRange(type);
    const metricsMode = getReportMetricMode();

    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false,
      },
      include: { variant: true },
    });

    const expenses = await fetchExpensesForReporting({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false,
      },
      orderBy: { date: "asc" },
    });

    let totalSales = 0;
    let totalUnits = 0;

    for (const sale of sales) {
      totalSales += Number(sale.total || 0);
      totalUnits += Number(sale.quantity || 0);
    }

    const {
      totalExpenses,
      cogsFromExpenses,
      operatingExpenses,
    } = getExpenseBreakdown(expenses);

    let cutoverMetadata = getDefaultCutoverMetadata();
    if (metricsMode === "dual") {
      const cutoverConfig = getCutoverConfig();
      const diagnostics = buildCutoverDiagnostics({
        salesRows: sales,
        expenseRows: expenses,
        window: cutoverConfig.window,
      });
      cutoverMetadata = evaluateCutover({
        metricsMode,
        cutoverConfig,
        diagnostics,
      });
    }

    const profitMetrics = getProfitMetrics({
      totalSales,
      totalExpenses,
      operatingExpenses,
      cogsFromExpenses,
      metricsMode,
      cutoverDecision: cutoverMetadata,
    });

    return res.json({
      type,
      totalSales: round2(totalSales),
      totalUnits,
      totalExpenses,
      cogsFromExpenses,
      cogs: cogsFromExpenses,
      operatingExpenses,
      profit: profitMetrics.profit,
      profitV2: profitMetrics.profitV2,
      netProfit: profitMetrics.netProfit,
      defaultProfitMetric: profitMetrics.defaultProfitMetric,
      metricsMode: profitMetrics.metricsMode,
      reconciliation: profitMetrics.reconciliation,
      cutover: cutoverMetadata,
      profitMargin: totalSales > 0 ? round2((profitMetrics.netProfit / totalSales) * 100) : 0,
    });
  } catch (error) {
    console.error("Quick stats error:", error.message);
    return res.status(500).json({ message: "Quick stats failed" });
  }
};

/* ================= LOW STOCK ALERT ================= */
exports.getLowStock = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10;

    const variants = await prisma.variant.findMany({
      where: {
        stock: { lte: threshold },
        is_deleted: false,
      },
      include: {
        model: {
          include: { brand: true },
        },
      },
    });

    return res.json(
      variants.map((variant) => ({
        id: variant.id,
        name: `${variant.model.brand.name} ${variant.model.name} ${variant.variant_name}`,
        stock: variant.stock,
        threshold,
      }))
    );
  } catch (error) {
    console.error("Low stock error:", error.message);
    return res.status(500).json({ message: "Low stock failed" });
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
        is_deleted: false,
      },
      orderBy: { date: "asc" },
    });

    const grouped = {};

    for (const sale of sales) {
      const key = getPeriodKey(sale.date, range);
      grouped[key] = (grouped[key] || 0) + Number(sale.total || 0);
    }

    const result = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, totalSales]) => ({
        date,
        sales: round2(totalSales),
      }));

    return res.json(result);
  } catch (error) {
    console.error("Sales trend error:", error.message);
    return res.status(500).json({ message: "Sales trend failed" });
  }
};

/* ================= PROFIT TREND ================= */
exports.getProfitTrend = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const { startDate, endDate } = getDateRange(range, req.query.startDate, req.query.endDate);
    const metricsMode = getReportMetricMode();

    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false,
      },
      orderBy: { date: "asc" },
    });

    const expenses = await fetchExpensesForReporting({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false,
      },
      orderBy: { date: "asc" },
    });

    const grouped = {};

    for (const sale of sales) {
      const key = getPeriodKey(sale.date, range);
      if (!grouped[key]) {
        grouped[key] = {
          sales: 0,
          expenses: 0,
          cogsFromExpenses: 0,
        };
      }
      grouped[key].sales += Number(sale.total || 0);
    }

    for (const expense of expenses) {
      const key = getPeriodKey(expense.date, range);
      const amount = Number(expense.amount || 0);
      const contributesToCogs = expenseCategoryService.getEffectiveAffectsCogs(expense);

      if (!grouped[key]) {
        grouped[key] = {
          sales: 0,
          expenses: 0,
          cogsFromExpenses: 0,
        };
      }

      grouped[key].expenses += amount;
      if (contributesToCogs) {
        grouped[key].cogsFromExpenses += amount;
      }
    }

    let cutoverMetadata = getDefaultCutoverMetadata();
    if (metricsMode === "dual") {
      const cutoverConfig = getCutoverConfig();
      const diagnostics = buildCutoverDiagnostics({
        salesRows: sales,
        expenseRows: expenses,
        window: cutoverConfig.window,
      });
      cutoverMetadata = evaluateCutover({
        metricsMode,
        cutoverConfig,
        diagnostics,
      });
    }

    const result = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => {
        const operatingExpenses = values.expenses - values.cogsFromExpenses;
        const profitMetrics = getProfitMetrics({
          totalSales: values.sales,
          totalExpenses: values.expenses,
          operatingExpenses,
          cogsFromExpenses: values.cogsFromExpenses,
          metricsMode,
          cutoverDecision: cutoverMetadata,
        });

        return {
          date,
          sales: round2(values.sales),
          expenses: round2(values.expenses),
          cogsFromExpenses: round2(values.cogsFromExpenses),
          operatingExpenses: round2(operatingExpenses),
          profit: profitMetrics.profit,
          profitV2: profitMetrics.profitV2,
          netProfit: profitMetrics.netProfit,
          defaultProfitMetric: profitMetrics.defaultProfitMetric,
          metricsMode: profitMetrics.metricsMode,
          reconciliation: profitMetrics.reconciliation,
          cutover: cutoverMetadata,
        };
      });

    return res.json(result);
  } catch (error) {
    console.error("Profit trend error:", error.message);
    return res.status(500).json({ message: "Profit trend failed" });
  }
};

/* ================= EXPENSE DISTRIBUTION ================= */
exports.getExpenseDistribution = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const { startDate, endDate } = getDateRange(range, req.query.startDate, req.query.endDate);

    const expenses = await fetchExpensesForReporting({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false,
      },
      orderBy: { date: "asc" },
    });

    const grouped = {};

    for (const expense of expenses) {
      const category =
        (expense.expense_category && expense.expense_category.name) || expense.category || "Other";
      grouped[category] = (grouped[category] || 0) + Number(expense.amount || 0);
    }

    const result = Object.entries(grouped)
      .map(([category, amount]) => ({
        category,
        amount: round2(amount),
      }))
      .sort((a, b) => b.amount - a.amount);

    return res.json(result);
  } catch (error) {
    console.error("Expense distribution error:", error.message);
    return res.status(500).json({ message: "Expense distribution failed" });
  }
};

/* ================= EXPENSE ANALYTICS ================= */
exports.getExpenseAnalytics = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const { startDate, endDate } = getDateRange(range, req.query.startDate, req.query.endDate);

    const expenses = await fetchExpensesForReporting({
      where: {
        date: { gte: startDate, lte: endDate },
        is_deleted: false,
      },
      orderBy: { date: "asc" },
    });

    const trendBuckets = {};
    const distributionBuckets = {};

    for (const expense of expenses) {
      const amount = Number(expense.amount || 0);
      const trendKey = getPeriodKey(expense.date, range);
      const category =
        (expense.expense_category && expense.expense_category.name) || expense.category || "Other";

      trendBuckets[trendKey] = (trendBuckets[trendKey] || 0) + amount;
      distributionBuckets[category] = (distributionBuckets[category] || 0) + amount;
    }

    const trend = Object.entries(trendBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date,
        amount: round2(amount),
      }));

    const distribution = Object.entries(distributionBuckets)
      .map(([category, amount]) => ({
        category,
        amount: round2(amount),
      }))
      .sort((a, b) => b.amount - a.amount);

    const {
      totalExpenses,
      cogsFromExpenses,
      operatingExpenses,
    } = getExpenseBreakdown(expenses);

    return res.json({
      trend,
      distribution,
      totalExpenses,
      cogsFromExpenses,
      operatingExpenses,
    });
  } catch (error) {
    console.error("Expense analytics error:", error.message);
    return res.status(500).json({ message: "Expense analytics failed" });
  }
};

/* ================= EXPORT REPORT ================= */
exports.exportReport = async (req, res) => {
  try {
    const { type, range } = req.body;

    return res.json({
      message: "Export feature coming soon",
      type,
      range,
    });
  } catch (error) {
    console.error("Export error:", error.message);
    return res.status(500).json({ message: "Export failed" });
  }
};

/* ================= SCHEDULER STATUS ================= */
exports.getSchedulerStatus = async (req, res) => {
  try {
    const previewLimit = Number(req.query.previewLimit || req.query.limit || 25);
    const status = await getReportSchedulerStatus({ previewLimit });
    return res.json(status);
  } catch (error) {
    console.error("Scheduler status error:", error.message);
    return res.status(500).json({ message: "Failed to read scheduler status" });
  }
};

/* ================= SCHEDULED REPORTS ================= */
exports.createScheduledReport = async (req, res) => {
  return res.json({ message: "Scheduled reports coming soon" });
};

exports.listSchedules = async (req, res) => {
  return res.json([]);
};

exports.getSchedule = async (req, res) => {
  return res.json({ message: "Schedule not found" });
};

exports.updateSchedule = async (req, res) => {
  return res.json({ message: "Schedule updated" });
};

exports.deleteSchedule = async (req, res) => {
  return res.json({ message: "Schedule deleted" });
};
