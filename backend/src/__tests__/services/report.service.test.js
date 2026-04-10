/**
 * Unit Tests: Report Service / Controller Business Logic
 * Tests report.controller.js calculation and aggregation logic
 */

let mockPrisma;

jest.mock('../../services/prisma.service', () => {
  mockPrisma = {
    sale: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    expense: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
    },
  };
  return mockPrisma;
});

describe('Report Controller - Business Logic', () => {
  let reportController;

  const createMockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.REPORT_METRIC_MODE;
    delete process.env.REPORT_V2_CUTOVER_ENABLED;
    delete process.env.REPORT_V2_CUTOVER_WINDOW;
    delete process.env.REPORT_V2_CUTOVER_MIN_SAMPLES;
    delete process.env.REPORT_V2_CUTOVER_MIN_PASS_RATE;

    delete require.cache[require.resolve('../../controllers/report.controller')];
    reportController = require('../../controllers/report.controller');

    mockPrisma.sale.aggregate.mockResolvedValue({
      _sum: { total: 0 },
      _count: 0,
    });
    mockPrisma.sale.findMany.mockResolvedValue([]);
    mockPrisma.expense.findMany.mockResolvedValue([]);
  });

  describe('Date Range Calculation (getDateRange)', () => {
    it('should call Prisma sale.aggregate for sales data', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 5000 },
        _count: 5,
      });

      mockPrisma.expense.findMany.mockResolvedValue([
        { amount: 500, category: 'Other' },
      ]);

      const mockReq = { query: { range: 'daily' } };
      const mockRes = createMockRes();

      await reportController.getSummary(mockReq, mockRes);

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
      expect(mockPrisma.expense.findMany).toHaveBeenCalled();
    });

    it('should handle weekly range queries', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 10000 },
        _count: 10,
      });

      mockPrisma.expense.findMany.mockResolvedValue([
        { amount: 1000, category: 'Shop rent' },
      ]);

      const mockReq = { query: { range: 'weekly' } };
      const mockRes = createMockRes();

      await reportController.getSummary(mockReq, mockRes);

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
    });

    it('should handle monthly range queries', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 50000 },
        _count: 30,
      });

      mockPrisma.expense.findMany.mockResolvedValue([
        { amount: 5000, category: 'Buying stocks' },
      ]);

      const mockReq = { query: { range: 'monthly' } };
      const mockRes = createMockRes();

      await reportController.getSummary(mockReq, mockRes);

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
    });

    it('should handle yearly range queries', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 500000 },
        _count: 300,
      });

      mockPrisma.expense.findMany.mockResolvedValue([
        { amount: 50000, category: 'Shop rent' },
      ]);

      const mockReq = { query: { range: 'yearly' } };
      const mockRes = createMockRes();

      await reportController.getSummary(mockReq, mockRes);

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
    });
  });

  describe('getSummary - Core Functionality', () => {
    it('should call Prisma aggregate for sales metrics', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 10000 },
        _count: 10,
      });

      mockPrisma.expense.findMany.mockResolvedValue([
        { amount: 1200, category: 'Buying stocks' },
        { amount: 800, category: 'Shop rent' },
      ]);

      const mockReq = { query: { range: 'monthly' } };
      const mockRes = createMockRes();

      await reportController.getSummary(mockReq, mockRes);

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSales: 10000,
          totalExpenses: 2000,
          cogsFromExpenses: 1200,
          operatingExpenses: 800,
          profit: 8000,
          profitV2: 8000,
        })
      );
    });

    it('should handle zero sales', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: null },
        _count: 0,
      });

      mockPrisma.expense.findMany.mockResolvedValue([]);

      const mockReq = { query: { range: 'daily' } };
      const mockRes = createMockRes();

      await reportController.getSummary(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSales: 0,
          totalExpenses: 0,
          profitMargin: 0,
        })
      );
    });

    it('should exclude deleted records from calculations', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 5000 },
        _count: 5,
      });

      mockPrisma.expense.findMany.mockResolvedValue([
        { amount: 500, category: 'Other' },
      ]);

      const mockReq = { query: { range: 'monthly' } };
      const mockRes = createMockRes();

      await reportController.getSummary(mockReq, mockRes);

      // Verify is_deleted filter was applied
      expect(mockPrisma.sale.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_deleted: false,
          }),
        })
      );

      expect(mockPrisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_deleted: false,
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.sale.aggregate.mockRejectedValue(
        new Error('Database connection failed')
      );

      const mockReq = { query: { range: 'monthly' } };
      const mockRes = createMockRes();

      await reportController.getSummary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
