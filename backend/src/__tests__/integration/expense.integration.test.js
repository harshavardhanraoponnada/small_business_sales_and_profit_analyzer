/**
 * Integration Tests: Expense Routes
 * Uses real route + controller stack with mocked infra dependencies.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { createTestClient, assertions } = require('../helpers');

const mockPrisma = {
  expense: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  expenseCategory: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockExpenseCategoryService = {
  resolveExpenseCategory: jest.fn(),
  ensureDefaultExpenseCategories: jest.fn(),
  listExpenseCategories: jest.fn(),
  getPaymentMethods: jest.fn(() => ['Cash', 'UPI', 'Card']),
  buildCategoryKey: jest.fn((value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_')),
};

jest.mock('../../services/prisma.service', () => mockPrisma);
jest.mock('../../services/expenseCategory.service', () => mockExpenseCategoryService);

jest.mock('../../middleware/expenseUpload.middleware', () => ({
  single: () => (req, res, next) => next(),
}));

jest.mock('../../middleware/auditLogger', () => () => (req, res, next) => next());

const expenseRoutes = require('../../routes/expense.routes');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/expenses', expenseRoutes);
  return app;
};

describe('Expense Routes Integration Tests', () => {
  let app;
  let client;
  let expenseRows;
  let categoryRows;
  let token;

  const validExpensePayload = {
    category: 'Shop rent',
    amount: 1500,
    description: 'Monthly rental payment',
    date: '2026-04-01',
    vendor_name: 'ABC Properties',
    invoice_reference: 'INV-APR-001',
    tax_amount: 180,
    payment_method: 'UPI',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'expense-integration-secret';

    token = jwt.sign({ id: 'user-1', role: 'OWNER', username: 'owner' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    expenseRows = [];
    categoryRows = [
      {
        id: 'cat-rent',
        key: 'SHOP_RENT',
        name: 'Shop rent',
        expense_group: 'OPERATING_EXPENSE',
        affects_cogs_default: false,
        is_system: true,
        is_active: true,
        is_deleted: false,
        display_order: 20,
      },
      {
        id: 'cat-stock',
        key: 'BUYING_STOCKS',
        name: 'Buying stocks',
        expense_group: 'COGS',
        affects_cogs_default: true,
        is_system: true,
        is_active: true,
        is_deleted: false,
        display_order: 10,
      },
    ];

    mockPrisma.expense.findMany.mockImplementation(async ({ where = {} } = {}) => {
      const rows = expenseRows.filter((row) => {
        if (where.is_deleted === undefined) return true;
        return row.is_deleted === where.is_deleted;
      });
      return rows.map((row) => ({ ...row }));
    });

    mockPrisma.expense.findFirst.mockImplementation(async ({ where = {} } = {}) => {
      return (
        expenseRows.find((row) => {
          if (where.id && row.id !== where.id) return false;
          if (where.is_deleted !== undefined && row.is_deleted !== where.is_deleted) return false;
          return true;
        }) || null
      );
    });

    mockPrisma.expense.create.mockImplementation(async ({ data }) => {
      const created = {
        id: `exp-${expenseRows.length + 1}`,
        is_deleted: false,
        created_at: new Date().toISOString(),
        ...data,
      };
      expenseRows.push(created);
      return { ...created };
    });

    mockPrisma.expense.update.mockImplementation(async ({ where, data }) => {
      const index = expenseRows.findIndex((row) => row.id === where.id);
      if (index === -1) {
        throw new Error('Expense not found');
      }
      expenseRows[index] = { ...expenseRows[index], ...data };
      return { ...expenseRows[index] };
    });

    mockPrisma.expense.updateMany.mockImplementation(async ({ where, data }) => {
      let count = 0;
      expenseRows = expenseRows.map((row) => {
        if (row.id === where.id && row.is_deleted === where.is_deleted) {
          count += 1;
          return { ...row, ...data };
        }
        return row;
      });
      return { count };
    });

    mockPrisma.expenseCategory.findMany.mockImplementation(async ({ where = {} } = {}) => {
      return categoryRows.filter((row) => {
        if (where.is_deleted !== undefined && row.is_deleted !== where.is_deleted) return false;
        if (where.is_active !== undefined && row.is_active !== where.is_active) return false;
        return true;
      });
    });

    mockPrisma.expenseCategory.findFirst.mockImplementation(async ({ where = {} } = {}) => {
      return (
        categoryRows.find((row) => {
          if (where.id && row.id !== where.id) return false;
          if (where.is_deleted !== undefined && row.is_deleted !== where.is_deleted) return false;
          return true;
        }) || null
      );
    });

    mockPrisma.expenseCategory.create.mockImplementation(async ({ data }) => {
      const created = {
        id: `cat-${categoryRows.length + 1}`,
        is_system: false,
        is_active: true,
        is_deleted: false,
        ...data,
      };
      categoryRows.push(created);
      return { ...created };
    });

    mockPrisma.expenseCategory.update.mockImplementation(async ({ where, data }) => {
      const index = categoryRows.findIndex((row) => row.id === where.id);
      if (index === -1) {
        throw new Error('Category not found');
      }
      categoryRows[index] = { ...categoryRows[index], ...data };
      return { ...categoryRows[index] };
    });

    mockExpenseCategoryService.resolveExpenseCategory.mockImplementation(async ({ inputCategory }) => {
      return categoryRows.find((row) => row.name === inputCategory && !row.is_deleted) || null;
    });
    mockExpenseCategoryService.ensureDefaultExpenseCategories.mockResolvedValue();
    mockExpenseCategoryService.listExpenseCategories.mockImplementation(async () => {
      return categoryRows.filter((row) => !row.is_deleted && row.is_active);
    });

    app = createApp();
    client = createTestClient(app);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('GET /expenses', () => {
    it('returns unauthorized without token', async () => {
      const response = await client.get('/api/expenses');
      assertions.expectAuthError(response);
    });

    it('lists non-deleted expenses through real route stack', async () => {
      expenseRows.push({ id: 'exp-1', category: 'Shop rent', amount: 1200, description: 'Rent', is_deleted: false });
      expenseRows.push({ id: 'exp-2', category: 'Shop rent', amount: 1000, description: 'Old', is_deleted: true });

      const response = await client.get('/api/expenses', token);
      assertions.expectApiResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('exp-1');
    });
  });

  describe('POST /expenses', () => {
    it('enforces required accounting fields', async () => {
      const response = await client.post(
        '/api/expenses',
        { category: 'Shop rent', amount: 100, description: 'Missing required fields' },
        token
      );

      assertions.expectValidationError(response);
      expect(response.body.message).toBe('Validation failed');
    });

    it('creates expense with structured payload', async () => {
      const response = await client.post('/api/expenses', validExpensePayload, token);

      assertions.expectApiResponse(response, 201);
      expect(response.body).toHaveProperty('expense');
      expect(response.body.expense.category).toBe('Shop rent');
      expect(response.body.expense.expense_category_id).toBe('cat-rent');
      expect(response.body.expense.vendor_name).toBe('ABC Properties');
    });
  });

  describe('PUT /expenses/:id', () => {
    it('updates expense when full required payload is supplied', async () => {
      const created = await client.post('/api/expenses', validExpensePayload, token);
      const expenseId = created.body.expense.id;

      const response = await client.put(
        `/api/expenses/${expenseId}`,
        {
          ...validExpensePayload,
          amount: 1700,
          invoice_reference: 'INV-APR-002',
        },
        token
      );

      assertions.expectApiResponse(response, 200);
      expect(response.body.expense.amount).toBe(1700);
      expect(response.body.expense.invoice_reference).toBe('INV-APR-002');
    });
  });

  describe('Category lifecycle endpoints', () => {
    it('updates category metadata', async () => {
      const response = await client.put(
        '/api/expenses/categories/cat-rent',
        {
          name: 'Shop rent',
          expense_group: 'OPERATING_EXPENSE',
          affects_cogs_default: false,
          is_active: true,
          display_order: 25,
        },
        token
      );

      assertions.expectApiResponse(response, 200);
      expect(response.body.message).toBe('Expense category updated');
      expect(response.body.category.display_order).toBe(25);
    });

    it('soft deletes and restores non-system categories', async () => {
      const categoryCreate = await client.post(
        '/api/expenses/categories',
        { name: 'Courier charges', expense_group: 'OPERATING_EXPENSE' },
        token
      );
      const categoryId = categoryCreate.body.category.id;

      const deleteResponse = await client.delete(`/api/expenses/categories/${categoryId}`, token);
      assertions.expectApiResponse(deleteResponse, 200);
      expect(deleteResponse.body.message).toBe('Expense category deleted');

      const restoreResponse = await client.post(`/api/expenses/categories/${categoryId}/restore`, {}, token);
      assertions.expectApiResponse(restoreResponse, 200);
      expect(restoreResponse.body.message).toBe('Expense category restored');
    });
  });
});
