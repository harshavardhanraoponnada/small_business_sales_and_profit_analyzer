// Mock Prisma with factory function before requiring controller
const mockPrisma = {
  sale: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  expense: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  variant: {
    findMany: jest.fn(),
  },
};

jest.mock("../../services/prisma.service", () => mockPrisma);

const reportController = require("../../controllers/report.controller");

const REPORT_ENV_KEYS = [
  "REPORT_METRIC_MODE",
  "REPORT_RECONCILIATION_TOLERANCE",
  "REPORT_V2_CUTOVER_ENABLED",
  "REPORT_V2_CUTOVER_WINDOW",
  "REPORT_V2_CUTOVER_MIN_SAMPLES",
  "REPORT_V2_CUTOVER_MIN_PASS_RATE",
];

const resetReportEnv = () => {
  for (const key of REPORT_ENV_KEYS) {
    delete process.env[key];
  }
};

describe("Report Controller", () => {
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    resetReportEnv();

    mockPrisma.sale.aggregate.mockResolvedValue({
      _sum: { total: 0 },
      _count: 0,
    });
    mockPrisma.sale.findMany.mockResolvedValue([]);
    mockPrisma.expense.aggregate.mockResolvedValue({
      _sum: { amount: 0 },
      _count: 0,
    });
    mockPrisma.expense.findMany.mockResolvedValue([]);
    mockPrisma.variant.findMany.mockResolvedValue([]);

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    resetReportEnv();
  });

  describe("getSummary", () => {
    it("should return summary with default monthly range", async () => {
      const req = { query: {} };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 10000 },
        _count: 5,
      });
      mockPrisma.expense.findMany.mockResolvedValue([
        { amount: 500, category: "Other" },
        { amount: 1500, category: "Shop rent" },
      ]);

      await reportController.getSummary(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          range: "monthly",
          totalSales: 10000,
          totalExpenses: 2000,
          cogsFromExpenses: 0,
          operatingExpenses: 2000,
          profit: 8000,
          profitV2: 8000,
          netProfit: 8000,
          defaultProfitMetric: "profit",
          reconciliation: expect.objectContaining({ isReconciled: true }),
          profitMargin: "80.00",
        })
      );
    });

    it("should return summary with custom date range", async () => {
      const req = {
        query: {
          range: "custom",
          startDate: "2026-01-01",
          endDate: "2026-12-31",
        },
      };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 50000 },
        _count: 20,
      });
      mockPrisma.expense.findMany.mockResolvedValue([
        { amount: 6000, category: "Buying stocks" },
        { amount: 4000, category: "Shop rent" },
      ]);

      await reportController.getSummary(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          range: "custom",
          totalSales: 50000,
          totalExpenses: 10000,
          cogsFromExpenses: 6000,
          operatingExpenses: 4000,
          profit: 40000,
          profitV2: 40000,
        })
      );
    });

    it("promotes profitV2 in dual mode when cutover window is accepted", async () => {
      process.env.REPORT_METRIC_MODE = "dual";
      process.env.REPORT_V2_CUTOVER_ENABLED = "true";
      process.env.REPORT_V2_CUTOVER_WINDOW = "daily";
      process.env.REPORT_V2_CUTOVER_MIN_SAMPLES = "2";
      process.env.REPORT_V2_CUTOVER_MIN_PASS_RATE = "1";

      const req = { query: { range: "custom", startDate: "2026-03-01", endDate: "2026-03-02" } };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 2000 },
        _count: 2,
      });
      mockPrisma.sale.findMany.mockResolvedValue([
        { date: new Date("2026-03-01T08:00:00.000Z"), total: 1200 },
        { date: new Date("2026-03-02T08:00:00.000Z"), total: 800 },
      ]);
      mockPrisma.expense.findMany.mockResolvedValue([
        { date: new Date("2026-03-01T10:00:00.000Z"), amount: 300, category: "Shop rent" },
        { date: new Date("2026-03-02T10:00:00.000Z"), amount: 100, category: "Other" },
      ]);

      await reportController.getSummary(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          metricsMode: "dual",
          defaultProfitMetric: "profitV2",
          profit: 1600,
          profitV2: 1600,
          netProfit: 1600,
          cutover: expect.objectContaining({
            enabled: true,
            window: "daily",
            evaluatedSamples: 2,
            reconciledSamples: 2,
            failedSamples: 0,
            passRate: 1,
            accepted: true,
            promoted: true,
          }),
        })
      );
    });

    it("keeps legacy default metric in dual mode when cutover minimum samples is unmet", async () => {
      process.env.REPORT_METRIC_MODE = "dual";
      process.env.REPORT_V2_CUTOVER_ENABLED = "true";
      process.env.REPORT_V2_CUTOVER_WINDOW = "daily";
      process.env.REPORT_V2_CUTOVER_MIN_SAMPLES = "5";
      process.env.REPORT_V2_CUTOVER_MIN_PASS_RATE = "1";

      const req = { query: { range: "custom", startDate: "2026-03-01", endDate: "2026-03-02" } };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 1500 },
        _count: 2,
      });
      mockPrisma.sale.findMany.mockResolvedValue([
        { date: new Date("2026-03-01T08:00:00.000Z"), total: 900 },
        { date: new Date("2026-03-02T08:00:00.000Z"), total: 600 },
      ]);
      mockPrisma.expense.findMany.mockResolvedValue([
        { date: new Date("2026-03-01T10:00:00.000Z"), amount: 200, category: "Buying stocks" },
        { date: new Date("2026-03-02T10:00:00.000Z"), amount: 100, category: "Shop rent" },
      ]);

      await reportController.getSummary(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          metricsMode: "dual",
          defaultProfitMetric: "profit",
          cutover: expect.objectContaining({
            enabled: true,
            evaluatedSamples: 2,
            accepted: false,
            promoted: false,
          }),
        })
      );
    });

    it("should handle zero sales (profit margin 0)", async () => {
      const req = { query: {} };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: null },
        _count: 0,
      });
      mockPrisma.expense.findMany.mockResolvedValue([]);

      await reportController.getSummary(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSales: 0,
          totalExpenses: 0,
          profitMargin: 0,
        })
      );
    });

    it("should handle Prisma error in getSummary", async () => {
      const req = { query: {} };

      mockPrisma.sale.aggregate.mockRejectedValue(
        new Error("DB error")
      );

      await reportController.getSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Summary failed",
      });
    });

    it("should handle yearly range", async () => {
      const req = { query: { range: "yearly" } };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 100000 },
        _count: 50,
      });
      mockPrisma.expense.findMany.mockResolvedValue([
        { amount: 30000, category: "Shop rent" },
      ]);

      await reportController.getSummary(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          range: "yearly",
          totalSales: 100000,
          profit: 70000,
        })
      );
    });

    it("should handle daily range", async () => {
      const req = { query: { range: "daily" } };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 5000 },
        _count: 2,
      });
      mockPrisma.expense.findMany.mockResolvedValue([{ amount: 1000, category: "Other" }]);

      await reportController.getSummary(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          range: "daily",
          totalSales: 5000,
        })
      );
    });

    it("should handle weekly range", async () => {
      const req = { query: { range: "weekly" } };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 15000 },
        _count: 8,
      });
      mockPrisma.expense.findMany.mockResolvedValue([{ amount: 3000, category: "Other" }]);

      await reportController.getSummary(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it("should handle max date range (all-time)", async () => {
      const req = { query: { range: "max" } };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 1000000 },
        _count: 500,
      });
      mockPrisma.expense.findMany.mockResolvedValue([{ amount: 200000, category: "Other" }]);

      await reportController.getSummary(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          range: "max",
          totalSales: 1000000,
        })
      );
    });
  });

  describe("getQuickStats", () => {
    it("should return daily stats with units and margin", async () => {
      const req = { query: { type: "daily" } };

      mockPrisma.sale.findMany.mockResolvedValue([
        { total: 5000, quantity: 10, variant: {} },
        { total: 3000, quantity: 5, variant: {} },
      ]);
      mockPrisma.expense.findMany.mockResolvedValue([
        { amount: 1000, category: "Buying stocks" },
        { amount: 500, category: "Shop rent" },
      ]);

      await reportController.getQuickStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "daily",
          totalSales: 8000,
          totalUnits: 15,
          totalExpenses: 1500,
          cogsFromExpenses: 1000,
          operatingExpenses: 500,
          profit: 6500,
          profitV2: 6500,
          netProfit: 6500,
          defaultProfitMetric: "profit",
          reconciliation: expect.objectContaining({ isReconciled: true }),
          profitMargin: 81.25,
        })
      );
    });

    it("should return empty stats when no sales/expenses", async () => {
      const req = { query: { type: "daily" } };

      mockPrisma.sale.findMany.mockResolvedValue([]);
      mockPrisma.expense.findMany.mockResolvedValue([]);

      await reportController.getQuickStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSales: 0,
          totalUnits: 0,
          profitMargin: 0,
        })
      );
    });

    it("should handle Prisma error in getQuickStats", async () => {
      const req = { query: { type: "daily" } };

      mockPrisma.sale.findMany.mockRejectedValue(
        new Error("DB error")
      );

      await reportController.getQuickStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Quick stats failed",
      });
    });

    it("should use default type if not provided", async () => {
      const req = { query: {} };

      mockPrisma.sale.findMany.mockResolvedValue([]);
      mockPrisma.expense.findMany.mockResolvedValue([]);

      await reportController.getQuickStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "daily",
        })
      );
    });
  });

  describe("getLowStock", () => {
    it("should return variants below threshold", async () => {
      const req = { query: { threshold: "10" } };

      mockPrisma.variant.findMany.mockResolvedValue([
        {
          id: 1,
          stock: 5,
          variant_name: "Red-XL",
          model: { brand: { name: "Brand1" }, name: "Model1" },
        },
      ]);

      await reportController.getLowStock(req, res);

      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 1,
          stock: 5,
        }),
      ]);
    });

    it("should use default threshold if not provided", async () => {
      const req = { query: {} };

      mockPrisma.variant.findMany.mockResolvedValue([]);

      await reportController.getLowStock(req, res);

      expect(mockPrisma.variant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ stock: { lte: 10 } }),
        })
      );
    });

    it("should handle Prisma error in getLowStock", async () => {
      const req = { query: { threshold: "5" } };

      mockPrisma.variant.findMany.mockRejectedValue(
        new Error("DB error")
      );

      await reportController.getLowStock(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Low stock failed",
      });
    });
  });

  describe("getSalesTrend", () => {
    it("should group sales by month", async () => {
      const req = { query: { range: "monthly" } };

      mockPrisma.sale.findMany.mockResolvedValue([
        { date: new Date("2026-03-01"), total: 5000 },
        { date: new Date("2026-03-15"), total: 3000 },
        { date: new Date("2026-02-01"), total: 4000 },
      ]);

      await reportController.getSalesTrend(req, res);

      const calls = res.json.mock.calls[0][0];
      expect(Array.isArray(calls)).toBe(true);
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0]).toHaveProperty("date");
      expect(calls[0]).toHaveProperty("sales");
    });

    it("should handle daily grouping", async () => {
      const req = { query: { range: "daily" } };

      mockPrisma.sale.findMany.mockResolvedValue([
        { date: new Date("2026-03-01"), total: 5000 },
      ]);

      await reportController.getSalesTrend(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it("should handle yearly grouping", async () => {
      const req = { query: { range: "yearly" } };

      mockPrisma.sale.findMany.mockResolvedValue([
        { date: new Date("2026-03-01"), total: 5000 },
        { date: new Date("2025-03-01"), total: 4000 },
      ]);

      await reportController.getSalesTrend(req, res);

      const calls = res.json.mock.calls[0][0];
      expect(Array.isArray(calls)).toBe(true);
    });

    it("should handle empty sales array", async () => {
      const req = { query: { range: "monthly" } };

      mockPrisma.sale.findMany.mockResolvedValue([]);

      await reportController.getSalesTrend(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle Prisma error in getSalesTrend", async () => {
      const req = { query: { range: "monthly" } };

      mockPrisma.sale.findMany.mockRejectedValue(
        new Error("DB error")
      );

      await reportController.getSalesTrend(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getProfitTrend", () => {
    it("should calculate profit = sales - expenses per period", async () => {
      const req = { query: { range: "monthly" } };

      mockPrisma.sale.findMany.mockResolvedValue([
        { date: new Date("2026-03-01"), total: 10000 },
      ]);
      mockPrisma.expense.findMany.mockResolvedValue([
        { date: new Date("2026-03-01"), amount: 1200, category: "Buying stocks" },
        { date: new Date("2026-03-02"), amount: 800, category: "Shop rent" },
      ]);

      await reportController.getProfitTrend(req, res);

      const calls = res.json.mock.calls[0][0];
      expect(Array.isArray(calls)).toBe(true);
      expect(calls[0]).toEqual(
        expect.objectContaining({
          sales: 10000,
          expenses: 2000,
          cogsFromExpenses: 1200,
          operatingExpenses: 800,
          profit: 8000,
          profitV2: 8000,
          defaultProfitMetric: "profit",
          metricsMode: "legacy",
        })
      );
    });

    it("returns promoted cutover metadata in dual mode profit trend", async () => {
      process.env.REPORT_METRIC_MODE = "dual";
      process.env.REPORT_V2_CUTOVER_ENABLED = "true";
      process.env.REPORT_V2_CUTOVER_WINDOW = "monthly";
      process.env.REPORT_V2_CUTOVER_MIN_SAMPLES = "1";
      process.env.REPORT_V2_CUTOVER_MIN_PASS_RATE = "1";

      const req = { query: { range: "monthly" } };

      mockPrisma.sale.findMany.mockResolvedValue([
        { date: new Date("2026-03-03"), total: 3000 },
      ]);
      mockPrisma.expense.findMany.mockResolvedValue([
        { date: new Date("2026-03-03"), amount: 700, category: "Shop rent" },
      ]);

      await reportController.getProfitTrend(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response).toHaveLength(1);
      expect(response[0]).toEqual(
        expect.objectContaining({
          profit: 2300,
          profitV2: 2300,
          netProfit: 2300,
          defaultProfitMetric: "profitV2",
          metricsMode: "dual",
          cutover: expect.objectContaining({
            enabled: true,
            window: "monthly",
            evaluatedSamples: 1,
            passRate: 1,
            accepted: true,
            promoted: true,
          }),
        })
      );
    });

    it("should handle Prisma error in getProfitTrend", async () => {
      const req = { query: { range: "monthly" } };

      mockPrisma.sale.findMany.mockRejectedValue(
        new Error("DB error")
      );

      await reportController.getProfitTrend(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getExpenseDistribution", () => {
    it("should group expenses by category", async () => {
      const req = { query: { range: "monthly" } };

      mockPrisma.expense.findMany.mockResolvedValue([
        { category: "Salary", amount: 5000 },
        { category: "Salary", amount: 3000 },
        { category: "Office", amount: 1000 },
      ]);

      await reportController.getExpenseDistribution(req, res);

      const calls = res.json.mock.calls[0][0];
      expect(Array.isArray(calls)).toBe(true);
      expect(calls.length).toBe(2);
    });

    it("should handle null category as Other", async () => {
      const req = { query: { range: "monthly" } };

      mockPrisma.expense.findMany.mockResolvedValue([
        { category: null, amount: 500 },
      ]);

      await reportController.getExpenseDistribution(req, res);

      const calls = res.json.mock.calls[0][0];
      expect(calls[0]).toHaveProperty("category", "Other");
    });

    it("should handle Prisma error in getExpenseDistribution", async () => {
      const req = { query: {} };

      mockPrisma.expense.findMany.mockRejectedValue(
        new Error("DB error")
      );

      await reportController.getExpenseDistribution(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getExpenseAnalytics", () => {
    it("should return expenses grouped by period", async () => {
      const req = { query: { range: "monthly" } };

      mockPrisma.expense.findMany.mockResolvedValue([
        { date: new Date("2026-03-01"), category: "Salary", amount: 5000 },
      ]);

      await reportController.getExpenseAnalytics(req, res);

      const calls = res.json.mock.calls[0][0];
      expect(calls).toHaveProperty("trend");
      expect(calls).toHaveProperty("distribution");
      expect(Array.isArray(calls.trend)).toBe(true);
      expect(Array.isArray(calls.distribution)).toBe(true);
    });

    it("should handle Prisma error in getExpenseAnalytics", async () => {
      const req = { query: { range: "monthly" } };

      mockPrisma.expense.findMany.mockRejectedValue(
        new Error("DB error")
      );

      await reportController.getExpenseAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("exportReport", () => {
    it("should handle export request with pdf", async () => {
      const req = { body: { type: "pdf", range: "monthly" } };

      await reportController.exportReport(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Export feature coming soon",
          type: "pdf",
          range: "monthly",
        })
      );
    });

    it("should handle export request with xlsx", async () => {
      const req = { body: { type: "xlsx", range: "yearly" } };

      await reportController.exportReport(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Export feature coming soon",
          type: "xlsx",
          range: "yearly",
        })
      );
    });
  });

  describe("Scheduled Reports Stubs", () => {
    it("should create scheduled report", async () => {
      const req = { body: {} };

      await reportController.createScheduledReport(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Scheduled reports coming soon",
      });
    });

    it("should list schedules", async () => {
      const req = {};

      await reportController.listSchedules(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should get schedule", async () => {
      const req = {};

      await reportController.getSchedule(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Schedule not found",
      });
    });

    it("should update schedule", async () => {
      const req = {};

      await reportController.updateSchedule(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Schedule updated",
      });
    });

    it("should delete schedule", async () => {
      const req = {};

      await reportController.deleteSchedule(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Schedule deleted",
      });
    });
  });
});
