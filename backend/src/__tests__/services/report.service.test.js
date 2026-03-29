/**
 * Unit Tests: Report Service / Controller Business Logic
 * Tests report.controller.js calculation and aggregation logic
 */

jest.mock('../../services/prisma.service');

describe('Report Controller - Business Logic', () => {
  let reportController;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      sale: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
      expense: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
    };

    jest.doMock('../../services/prisma.service', () => mockPrisma);

    delete require.cache[require.resolve('../../controllers/report.controller')];
    reportController = require('../../controllers/report.controller');
  });

  describe('Date Range Calculation (getDateRange)', () => {
    it('should calculate daily range correctly', () => {
      // Note: Testing internal date logic through getSummary
      const mockRes = {
        json: jest.fn(),
      };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 5000 },
        _count: 5,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
        _count: 2,
      });

      reportController.getSummary(
        { query: { range: 'daily' } },
        mockRes
      );

      // Verify aggregation was called with date filters
      expect(mockPrisma.sale.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should handle weekly range', async () => {
      const mockRes = {
        json: jest.fn(),
      };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 10000 },
        _count: 10,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 1000 },
        _count: 5,
      });

      await reportController.getSummary(
        { query: { range: 'weekly' } },
        mockRes
      );

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
    });

    it('should handle monthly range', async () => {
      const mockRes = {
        json: jest.fn(),
      };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 50000 },
        _count: 30,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 5000 },
        _count: 20,
      });

      await reportController.getSummary(
        { query: { range: 'monthly' } },
        mockRes
      );

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
    });

    it('should handle yearly range', async () => {
      const mockRes = {
        json: jest.fn(),
      };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 500000 },
        _count: 300,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 50000 },
        _count: 200,
      });

      await reportController.getSummary(
        { query: { range: 'yearly' } },
        mockRes
      );

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
    });

    it('should handle custom date range', async () => {
      const mockRes = {
        json: jest.fn(),
      };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 15000 },
        _count: 15,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 1500 },
        _count: 10,
      });

      await reportController.getSummary(
        {
          query: {
            range: 'custom',
            startDate: '2026-03-01',
            endDate: '2026-03-15',
          },
        },
        mockRes
      );

      expect(mockPrisma.sale.aggregate).toHaveBeenCalled();
    });
  });

  describe('getSummary - Calculations', () => {
    it('should calculate profit correctly', async () => {
      const mockRes = {
        json: jest.fn(),
      };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 10000 },
        _count: 10,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 2000 },
        _count: 5,
      });

      await reportController.getSummary(
        { query: { range: 'monthly' } },
        mockRes
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSales: 10000,
          totalExpenses: 2000,
          profit: 8000,
        })
      );
    });

    it('should calculate profit margin correctly', async () => {
      const mockRes = {
        json: jest.fn(),
      };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 10000 },
        _count: 10,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 2000 },
        _count: 5,
      });

      await reportController.getSummary(
        { query: { range: 'monthly' } },
        mockRes
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          profitMargin: '80.00', // (8000 / 10000) * 100
        })
      );
    });

    it('should handle zero sales correctly', async () => {
      const mockRes = {
        json: jest.fn(),
      };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: null },
        _count: 0,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: null },
        _count: 0,
      });

      await reportController.getSummary(
        { query: { range: 'daily' } },
        mockRes
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSales: 0,
          totalExpenses: 0,
          profit: 0,
          profitMargin: 0,
        })
      );
    });

    it('should exclude deleted records', async () => {
      const mockRes = {
        json: jest.fn(),
      };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 5000 },
        _count: 5,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 500 },
        _count: 2,
      });

      await reportController.getSummary(
        { query: { range: 'monthly' } },
        mockRes
      );

      // Verify is_deleted filter was applied
      expect(mockPrisma.sale.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_deleted: false,
          }),
        })
      );

      expect(mockPrisma.expense.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_deleted: false,
          }),
        })
      );
    });

    it('should return correct response structure', async () => {
      const mockRes = {
        json: jest.fn(),
      };

      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { total: 10000 },
        _count: 10,
      });

      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 1000 },
        _count: 5,
      });

      await reportController.getSummary(
        { query: { range: 'monthly' } },
        mockRes
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          range: 'monthly',
          totalSales: expect.any(Number),
          totalExpenses: expect.any(Number),
          profit: expect.any(Number),
          salesCount: expect.any(Number),
          expenseCount: expect.any(Number),
          profitMargin: expect.any(String),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      mockPrisma.sale.aggregate.mockRejectedValue(
        new Error('Database connection failed')
      );

      await reportController.getSummary(
        { query: { range: 'monthly' } },
        mockRes
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Summary failed',
        })
      );
    });
  });
});
