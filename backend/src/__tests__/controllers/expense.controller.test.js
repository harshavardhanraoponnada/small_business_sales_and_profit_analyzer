/**
 * Unit Tests: Expense Controller
 */

const mockPrisma = {
  expense: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('../../services/prisma.service', () => mockPrisma);

const controller = require('../../controllers/expense.controller');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('Expense Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getExpenses', () => {
    it('returns non-deleted expenses', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([{ id: 'e1', amount: 100 }]);
      const req = {};
      const res = createMockRes();

      await controller.getExpenses(req, res);

      expect(mockPrisma.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { is_deleted: false } }));
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('addExpense', () => {
    it('returns 400 for invalid category', async () => {
      const req = { body: { category: 'InvalidCategory', amount: 100 }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.addExpense(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid expense category' });
    });

    it('returns 400 for invalid amount', async () => {
      const req = { body: { category: 'Rent', amount: -10 }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.addExpense(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid expense data' });
    });

    it('returns 400 for too long description', async () => {
      const req = {
        body: { category: 'Rent', amount: 100, description: 'a'.repeat(501) },
        user: { id: 'u1' },
      };
      const res = createMockRes();

      await controller.addExpense(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Description is too long' });
    });

    it('creates expense with valid data', async () => {
      mockPrisma.expense.create.mockResolvedValue({ id: 'e1', category: 'Rent', amount: 100 });

      const req = { body: { category: 'Rent', amount: 100, description: 'Monthly rent' }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.addExpense(req, res);

      expect(mockPrisma.expense.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Expense added',
        expense: { id: 'e1', category: 'Rent', amount: 100 },
      });
    });
  });

  describe('getCategorySummary', () => {
    it('groups expenses by category', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([
        { category: 'Rent', amount: 100 },
        { category: 'Rent', amount: 50 },
        { category: 'Utilities', amount: 25.5 },
      ]);

      const req = {};
      const res = createMockRes();

      await controller.getCategorySummary(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          { category: 'Rent', amount: 150 },
          { category: 'Utilities', amount: 25.5 },
        ])
      );
    });
  });

  describe('getMonthlyCategorySummary', () => {
    it('groups expenses by month and category', async () => {
      mockPrisma.expense.findMany.mockResolvedValue([
        { date: '2026-01-10', category: 'Rent', amount: 100 },
        { date: '2026-01-15', category: 'Utilities', amount: 20 },
        { date: '2026-02-01', category: 'Rent', amount: 80 },
      ]);

      const req = {};
      const res = createMockRes();

      await controller.getMonthlyCategorySummary(req, res);

      expect(res.json).toHaveBeenCalledWith([
        { month: '2026-01', total: 120, categories: { Rent: 100, Utilities: 20 } },
        { month: '2026-02', total: 80, categories: { Rent: 80 } },
      ]);
    });
  });
});
