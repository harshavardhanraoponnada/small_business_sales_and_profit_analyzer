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

  beforeEach(() => {
    jest.clearAllMocks();
    delete require.cache[require.resolve('../../controllers/report.controller')];
    reportController = require('../../controllers/report.controller');
  });

  describe('Date Range Calculation (getDateRange)', () => {
    it('should call Prisma sale.aggregate for sales data', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 5000 },
        _count: 5,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
        _count: 2,
      });

      const mockReq = { query: { range: 'daily' } };
      const mockRes = { json: jest.fn() };

      await reportController.getSummary(mockReq, mockRes);

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
    });

    it('should handle weekly range queries', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 10000 },
        _count: 10,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 1000 },
        _count: 5,
      });

      const mockReq = { query: { range: 'weekly' } };
      const mockRes = { json: jest.fn() };

      await reportController.getSummary(mockReq, mockRes);

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
    });

    it('should handle monthly range queries', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 50000 },
        _count: 30,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 5000 },
        _count: 20,
      });

      const mockReq = { query: { range: 'monthly' } };
      const mockRes = { json: jest.fn() };

      await reportController.getSummary(mockReq, mockRes);

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
    });

    it('should handle yearly range queries', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 500000 },
        _count: 300,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 50000 },
        _count: 200,
      });

      const mockReq = { query: { range: 'yearly' } };
      const mockRes = { json: jest.fn() };

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

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 2000 },
        _count: 5,
      });

      const mockReq = { query: { range: 'monthly' } };
      const mockRes = { json: jest.fn() };

      await reportController.getSummary(mockReq, mockRes);

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle zero sales', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: null },
        _count: 0,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: null },
        _count: 0,
      });

      const mockReq = { query: { range: 'daily' } };
      const mockRes = { json: jest.fn() };

      await reportController.getSummary(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should exclude deleted records from calculations', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 5000 },
        _count: 5,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
        _count: 2,
      });

      const mockReq = { query: { range: 'monthly' } };
      const mockRes = { json: jest.fn() };

      await reportController.getSummary(mockReq, mockRes);

      // Verify is_deleted filter was applied
      expect(mockPrisma.sale.aggregate).toHaveBeenCalledWith(
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
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await reportController.getSummary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
