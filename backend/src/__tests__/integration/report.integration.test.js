/**
 * Integration Tests: Report Routes
 * Uses real report route + controller stack with mocked infra dependencies.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { createTestClient, assertions } = require('../helpers');

const mockPrisma = {
  sale: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  expense: {
    findMany: jest.fn(),
  },
  variant: {
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  auditLog: {
    findFirst: jest.fn(),
  },
};

const mockExpenseCategoryService = {
  getEffectiveAffectsCogs: jest.fn(),
};

jest.mock('../../services/prisma.service', () => mockPrisma);
jest.mock('../../services/expenseCategory.service', () => mockExpenseCategoryService);

const reportRoutes = require('../../routes/report.routes');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/reports', reportRoutes);
  return app;
};

describe('Report Routes Integration Tests', () => {
  let app;
  let client;
  let ownerToken;
  let accountantToken;
  let staffToken;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'report-integration-secret';
    process.env.REPORT_METRIC_MODE = 'v2';
    process.env.REPORT_RECONCILIATION_TOLERANCE = '0.01';

    ownerToken = jwt.sign({ id: 'user-1', role: 'OWNER' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    accountantToken = jwt.sign(
      { id: 'user-2', role: 'ACCOUNTANT' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    staffToken = jwt.sign({ id: 'user-3', role: 'STAFF' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { total: 12000 }, _count: 4 });
    mockPrisma.sale.findMany.mockResolvedValue([
      { date: new Date('2026-04-01'), total: 5000, quantity: 2 },
      { date: new Date('2026-04-02'), total: 7000, quantity: 3 },
    ]);

    mockPrisma.expense.findMany.mockResolvedValue([
      {
        date: new Date('2026-04-01'),
        category: 'Buying stocks',
        amount: 3000,
        affects_cogs_override: true,
        expense_category: { name: 'Buying stocks', affects_cogs_default: true },
      },
      {
        date: new Date('2026-04-02'),
        category: 'Shop rent',
        amount: 1000,
        affects_cogs_override: false,
        expense_category: { name: 'Shop rent', affects_cogs_default: false },
      },
    ]);

    mockPrisma.variant.findMany.mockResolvedValue([]);

    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: 'user-owner-1',
        username: 'owner',
        email: 'owner@example.com',
        role: 'OWNER',
        reportFrequency: 'daily',
        reportFormat: 'pdf',
        reportScheduleTime: '09:00',
        reportScheduleWeekday: 'monday',
        receiveScheduledReports: true,
      },
    ]);

    mockPrisma.auditLog.findFirst.mockResolvedValue(null);

    mockExpenseCategoryService.getEffectiveAffectsCogs.mockImplementation((expense) => {
      if (typeof expense.affects_cogs_override === 'boolean') {
        return expense.affects_cogs_override;
      }
      return Boolean(expense.expense_category?.affects_cogs_default);
    });

    app = createApp();
    client = createTestClient(app);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.REPORT_METRIC_MODE;
    delete process.env.REPORT_RECONCILIATION_TOLERANCE;
  });

  describe('GET /reports/summary', () => {
    it('returns unauthorized without token', async () => {
      const response = await client.get('/api/reports/summary');
      assertions.expectAuthError(response);
    });

    it('returns cogs-aware summary with cutover metadata', async () => {
      const response = await client.get('/api/reports/summary?range=weekly', ownerToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body.range).toBe('weekly');
      expect(response.body).toEqual(
        expect.objectContaining({
          totalSales: 12000,
          totalExpenses: 4000,
          cogsFromExpenses: 3000,
          operatingExpenses: 1000,
          profitV2: 8000,
          netProfit: 8000,
          defaultProfitMetric: 'profitV2',
          metricsMode: 'v2',
          reconciliation: expect.objectContaining({
            isReconciled: true,
            tolerance: 0.01,
          }),
        })
      );
    });

    it('returns reconciled custom summary totals for a multi-day fixture', async () => {
      mockPrisma.sale.aggregate.mockResolvedValueOnce({ _sum: { total: 4500 }, _count: 3 });
      mockPrisma.expense.findMany.mockResolvedValueOnce([
        {
          date: new Date('2026-04-01'),
          category: 'Buying stocks',
          amount: 400,
          affects_cogs_override: true,
          expense_category: { name: 'Buying stocks', affects_cogs_default: true },
        },
        {
          date: new Date('2026-04-02'),
          category: 'Shop rent',
          amount: 200,
          affects_cogs_override: false,
          expense_category: { name: 'Shop rent', affects_cogs_default: false },
        },
        {
          date: new Date('2026-04-10'),
          category: 'Shipping',
          amount: 300,
          expense_category: { name: 'Shipping', affects_cogs_default: true },
        },
      ]);

      const response = await client.get(
        '/api/reports/summary?range=custom&startDate=2026-04-01&endDate=2026-04-30',
        ownerToken
      );

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual(
        expect.objectContaining({
          range: 'custom',
          totalSales: 4500,
          totalExpenses: 900,
          cogsFromExpenses: 700,
          operatingExpenses: 200,
          profit: 3600,
          profitV2: 3600,
          netProfit: 3600,
          reconciliation: expect.objectContaining({
            delta: 0,
            isReconciled: true,
          }),
        })
      );
    });

    it('marks reconciliation as false when rounded delta exceeds tolerance', async () => {
      process.env.REPORT_RECONCILIATION_TOLERANCE = '0.005';

      mockPrisma.sale.aggregate.mockResolvedValueOnce({ _sum: { total: 1000 }, _count: 1 });
      mockPrisma.expense.findMany.mockResolvedValueOnce([
        {
          date: new Date('2026-04-01'),
          category: 'Buying stocks',
          amount: 0.335,
          affects_cogs_override: true,
          expense_category: { name: 'Buying stocks', affects_cogs_default: true },
        },
        {
          date: new Date('2026-04-01'),
          category: 'Shop rent',
          amount: 0.335,
          affects_cogs_override: false,
          expense_category: { name: 'Shop rent', affects_cogs_default: false },
        },
      ]);

      const response = await client.get('/api/reports/summary?range=daily', ownerToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual(
        expect.objectContaining({
          totalSales: 1000,
          totalExpenses: 0.67,
          cogsFromExpenses: 0.34,
          operatingExpenses: 0.34,
          profit: 999.33,
          profitV2: 999.32,
          netProfit: 999.32,
          reconciliation: expect.objectContaining({
            delta: -0.01,
            tolerance: 0.005,
            isReconciled: false,
          }),
        })
      );
    });

    it('keeps reconciliation true when rounded delta equals tolerance boundary', async () => {
      process.env.REPORT_RECONCILIATION_TOLERANCE = '0.01';

      mockPrisma.sale.aggregate.mockResolvedValueOnce({ _sum: { total: 1000 }, _count: 1 });
      mockPrisma.expense.findMany.mockResolvedValueOnce([
        {
          date: new Date('2026-04-01'),
          category: 'Buying stocks',
          amount: 0.335,
          affects_cogs_override: true,
          expense_category: { name: 'Buying stocks', affects_cogs_default: true },
        },
        {
          date: new Date('2026-04-01'),
          category: 'Shop rent',
          amount: 0.335,
          affects_cogs_override: false,
          expense_category: { name: 'Shop rent', affects_cogs_default: false },
        },
      ]);

      const response = await client.get('/api/reports/summary?range=daily', ownerToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body.reconciliation).toEqual(
        expect.objectContaining({
          delta: -0.01,
          tolerance: 0.01,
          isReconciled: true,
        })
      );
    });

    it('falls back to legacy metric mode when REPORT_METRIC_MODE is invalid', async () => {
      process.env.REPORT_METRIC_MODE = 'unexpected-mode';
      process.env.REPORT_RECONCILIATION_TOLERANCE = '0.01';

      mockPrisma.sale.aggregate.mockResolvedValueOnce({ _sum: { total: 1000 }, _count: 1 });
      mockPrisma.expense.findMany.mockResolvedValueOnce([
        {
          date: new Date('2026-04-01'),
          category: 'Buying stocks',
          amount: 0.335,
          affects_cogs_override: true,
          expense_category: { name: 'Buying stocks', affects_cogs_default: true },
        },
        {
          date: new Date('2026-04-01'),
          category: 'Shop rent',
          amount: 0.335,
          affects_cogs_override: false,
          expense_category: { name: 'Shop rent', affects_cogs_default: false },
        },
      ]);

      const response = await client.get('/api/reports/summary?range=daily', ownerToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual(
        expect.objectContaining({
          metricsMode: 'legacy',
          defaultProfitMetric: 'profit',
          profit: 999.33,
          profitV2: 999.32,
          netProfit: 999.33,
          reconciliation: expect.objectContaining({
            delta: -0.01,
            tolerance: 0.01,
            isReconciled: true,
          }),
        })
      );
    });
  });

  describe('GET /reports/quick-stats', () => {
    it('returns quick stats with netProfit and reconciliation', async () => {
      const response = await client.get('/api/reports/quick-stats?type=daily', ownerToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual(
        expect.objectContaining({
          totalSales: 12000,
          totalExpenses: 4000,
          cogsFromExpenses: 3000,
          operatingExpenses: 1000,
          profitV2: 8000,
          netProfit: 8000,
          defaultProfitMetric: 'profitV2',
          reconciliation: expect.objectContaining({ isReconciled: true }),
        })
      );
    });

    it('allows staff to access quick stats endpoint', async () => {
      const response = await client.get('/api/reports/quick-stats?type=daily', staffToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual(
        expect.objectContaining({
          type: 'daily',
          totalSales: 12000,
          totalExpenses: 4000,
        })
      );
    });
  });

  describe('Non-restricted report endpoints', () => {
    it('allows staff to access low-stock endpoint with threshold filtering', async () => {
      mockPrisma.variant.findMany.mockResolvedValueOnce([
        {
          id: 'variant-1',
          variant_name: '128GB',
          stock: 4,
          model: {
            name: 'Galaxy S24',
            brand: { name: 'Samsung' },
          },
        },
      ]);

      const response = await client.get('/api/reports/low-stock?threshold=5', staffToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual([
        {
          id: 'variant-1',
          name: 'Samsung Galaxy S24 128GB',
          stock: 4,
          threshold: 5,
        },
      ]);
    });

    it('allows staff to access sales trend with grouped and sorted rows', async () => {
      mockPrisma.sale.findMany.mockResolvedValueOnce([
        { date: new Date('2026-04-02'), total: 200 },
        { date: new Date('2026-04-01'), total: 100 },
        { date: new Date('2026-04-01'), total: 50 },
      ]);

      const response = await client.get('/api/reports/sales-trend?range=daily', staffToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual([
        { date: '2026-04-01', sales: 150 },
        { date: '2026-04-02', sales: 200 },
      ]);
    });

    it('groups weekly sales trend into distinct buckets across week boundaries', async () => {
      mockPrisma.sale.findMany.mockResolvedValueOnce([
        { date: new Date('2026-04-01'), total: 100 },
        { date: new Date('2026-04-03'), total: 250 },
        { date: new Date('2026-04-20'), total: 300 },
        { date: new Date('2026-04-21'), total: 150 },
      ]);

      const response = await client.get('/api/reports/sales-trend?range=weekly', staffToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((row) => row.sales)).toEqual([350, 450]);
      response.body.forEach((row) => {
        expect(row.date).toMatch(/^Week of /);
      });
    });

    it('groups monthly sales trend with sorted month keys', async () => {
      mockPrisma.sale.findMany.mockResolvedValueOnce([
        { date: new Date('2026-04-02'), total: 200 },
        { date: new Date('2026-04-24'), total: 100 },
        { date: new Date('2026-05-01'), total: 300 },
        { date: new Date('2026-05-20'), total: 400 },
      ]);

      const response = await client.get('/api/reports/sales-trend?range=monthly', staffToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual([
        { date: '2026-04', sales: 300 },
        { date: '2026-05', sales: 700 },
      ]);
    });

    it('applies custom sales trend bounds with inclusive end-of-day', async () => {
      mockPrisma.sale.findMany.mockResolvedValueOnce([
        { date: new Date('2026-04-01T00:00:00.000Z'), total: 100 },
        { date: new Date('2026-04-30T23:59:59.000Z'), total: 200 },
      ]);

      const response = await client.get(
        '/api/reports/sales-trend?range=custom&startDate=2026-04-01&endDate=2026-04-30',
        staffToken
      );

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual([
        { date: '2026-04-01', sales: 100 },
        { date: '2026-04-30', sales: 200 },
      ]);

      const findManyArgs = mockPrisma.sale.findMany.mock.calls[0][0];
      const expectedStart = new Date('2026-04-01');
      const expectedEnd = new Date('2026-04-30');
      expectedEnd.setHours(23, 59, 59, 999);

      expect(findManyArgs.where.date.gte.getTime()).toBe(expectedStart.getTime());
      expect(findManyArgs.where.date.lte.getTime()).toBe(expectedEnd.getTime());
    });

    it('allows staff to access expense analytics with cogs breakdown totals', async () => {
      mockPrisma.expense.findMany.mockResolvedValueOnce([
        {
          date: new Date('2026-04-01'),
          category: 'Buying stocks',
          amount: 300,
          affects_cogs_override: true,
          expense_category: { name: 'Buying stocks', affects_cogs_default: true },
        },
        {
          date: new Date('2026-04-01'),
          category: 'Shop rent',
          amount: 100,
          affects_cogs_override: false,
          expense_category: { name: 'Shop rent', affects_cogs_default: false },
        },
        {
          date: new Date('2026-04-02'),
          category: 'Other',
          amount: 50,
        },
      ]);

      const response = await client.get('/api/reports/expenses?range=daily', staffToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual(
        expect.objectContaining({
          trend: [
            { date: '2026-04-01', amount: 400 },
            { date: '2026-04-02', amount: 50 },
          ],
          distribution: [
            { category: 'Buying stocks', amount: 300 },
            { category: 'Shop rent', amount: 100 },
            { category: 'Other', amount: 50 },
          ],
          totalExpenses: 450,
          cogsFromExpenses: 300,
          operatingExpenses: 150,
        })
      );
    });

    it('groups weekly expense analytics trend and preserves cogs split totals', async () => {
      mockPrisma.expense.findMany.mockResolvedValueOnce([
        {
          date: new Date('2026-04-01'),
          category: 'Buying stocks',
          amount: 100,
          affects_cogs_override: true,
          expense_category: { name: 'Buying stocks', affects_cogs_default: true },
        },
        {
          date: new Date('2026-04-03'),
          category: 'Shop rent',
          amount: 50,
          affects_cogs_override: false,
          expense_category: { name: 'Shop rent', affects_cogs_default: false },
        },
        {
          date: new Date('2026-04-20'),
          category: 'Other',
          amount: 200,
          affects_cogs_override: true,
        },
        {
          date: new Date('2026-04-21'),
          category: 'Utilities',
          amount: 50,
          affects_cogs_override: false,
        },
      ]);

      const response = await client.get('/api/reports/expenses?range=weekly', staffToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body.trend).toHaveLength(2);
      expect(response.body.trend.map((row) => row.amount)).toEqual([150, 250]);
      response.body.trend.forEach((row) => {
        expect(row.date).toMatch(/^Week of /);
      });
      expect(response.body.distribution).toEqual(
        expect.arrayContaining([
          { category: 'Other', amount: 200 },
          { category: 'Buying stocks', amount: 100 },
          { category: 'Shop rent', amount: 50 },
          { category: 'Utilities', amount: 50 },
        ])
      );
      expect(response.body).toEqual(
        expect.objectContaining({
          totalExpenses: 400,
          cogsFromExpenses: 300,
          operatingExpenses: 100,
        })
      );
    });

    it('groups monthly expense analytics trend with relation and fallback categories', async () => {
      mockPrisma.expense.findMany.mockResolvedValueOnce([
        {
          date: new Date('2026-04-30'),
          category: 'Supplies',
          amount: 125,
          expense_category: { name: 'Buying stocks', affects_cogs_default: true },
        },
        {
          date: new Date('2026-05-01'),
          category: 'Rent',
          amount: 75,
          expense_category: { name: 'Shop rent', affects_cogs_default: false },
        },
        {
          date: new Date('2026-05-15'),
          category: null,
          amount: 25,
          affects_cogs_override: true,
        },
      ]);

      const response = await client.get('/api/reports/expenses?range=monthly', staffToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual(
        expect.objectContaining({
          trend: [
            { date: '2026-04', amount: 125 },
            { date: '2026-05', amount: 100 },
          ],
          totalExpenses: 225,
          cogsFromExpenses: 150,
          operatingExpenses: 75,
        })
      );
      expect(response.body.distribution).toEqual([
        { category: 'Buying stocks', amount: 125 },
        { category: 'Shop rent', amount: 75 },
        { category: 'Other', amount: 25 },
      ]);
    });

    it('applies custom expense analytics bounds with inclusive end-of-day', async () => {
      mockPrisma.expense.findMany.mockResolvedValueOnce([
        {
          date: new Date('2026-04-01T00:00:00.000Z'),
          category: 'Buying stocks',
          amount: 150,
          affects_cogs_override: true,
          expense_category: { name: 'Buying stocks', affects_cogs_default: true },
        },
        {
          date: new Date('2026-04-30T23:59:59.000Z'),
          category: 'Shop rent',
          amount: 50,
          affects_cogs_override: false,
          expense_category: { name: 'Shop rent', affects_cogs_default: false },
        },
      ]);

      const response = await client.get(
        '/api/reports/expenses?range=custom&startDate=2026-04-01&endDate=2026-04-30',
        staffToken
      );

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual(
        expect.objectContaining({
          trend: [
            { date: '2026-04-01', amount: 150 },
            { date: '2026-04-30', amount: 50 },
          ],
          distribution: [
            { category: 'Buying stocks', amount: 150 },
            { category: 'Shop rent', amount: 50 },
          ],
          totalExpenses: 200,
          cogsFromExpenses: 150,
          operatingExpenses: 50,
        })
      );

      const findManyArgs = mockPrisma.expense.findMany.mock.calls[0][0];
      const expectedStart = new Date('2026-04-01');
      const expectedEnd = new Date('2026-04-30');
      expectedEnd.setHours(23, 59, 59, 999);

      expect(findManyArgs.where.date.gte.getTime()).toBe(expectedStart.getTime());
      expect(findManyArgs.where.date.lte.getTime()).toBe(expectedEnd.getTime());
    });
  });

  describe('GET /reports/profit-trend', () => {
    it('returns route-stack trend response including reconciliation metadata', async () => {
      const response = await client.get('/api/reports/profit-trend?range=daily', ownerToken);

      assertions.expectApiResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toEqual(
        expect.objectContaining({
          netProfit: expect.any(Number),
          defaultProfitMetric: 'profitV2',
          reconciliation: expect.objectContaining({ isReconciled: true }),
        })
      );
    });

    it('reconciles daily profit rows for a custom multi-period fixture', async () => {
      mockPrisma.sale.findMany.mockResolvedValueOnce([
        { date: new Date('2026-04-01'), total: 1000, quantity: 1 },
        { date: new Date('2026-04-02'), total: 2000, quantity: 2 },
        { date: new Date('2026-04-10'), total: 1500, quantity: 1 },
      ]);

      mockPrisma.expense.findMany.mockResolvedValueOnce([
        {
          date: new Date('2026-04-01'),
          category: 'Buying stocks',
          amount: 400,
          affects_cogs_override: true,
          expense_category: { name: 'Buying stocks', affects_cogs_default: true },
        },
        {
          date: new Date('2026-04-02'),
          category: 'Shop rent',
          amount: 200,
          affects_cogs_override: false,
          expense_category: { name: 'Shop rent', affects_cogs_default: false },
        },
        {
          date: new Date('2026-04-10'),
          category: 'Shipping',
          amount: 300,
          expense_category: { name: 'Shipping', affects_cogs_default: true },
        },
      ]);

      const response = await client.get(
        '/api/reports/profit-trend?range=daily&startDate=2026-04-01&endDate=2026-04-30',
        ownerToken
      );

      assertions.expectApiResponse(response, 200);
      expect(response.body).toHaveLength(3);

      const rowsByDate = Object.fromEntries(response.body.map((row) => [row.date, row]));

      expect(rowsByDate['2026-04-01']).toEqual(
        expect.objectContaining({
          sales: 1000,
          expenses: 400,
          cogsFromExpenses: 400,
          operatingExpenses: 0,
          profit: 600,
          profitV2: 600,
          netProfit: 600,
          defaultProfitMetric: 'profitV2',
        })
      );

      expect(rowsByDate['2026-04-02']).toEqual(
        expect.objectContaining({
          sales: 2000,
          expenses: 200,
          cogsFromExpenses: 0,
          operatingExpenses: 200,
          profit: 1800,
          profitV2: 1800,
          netProfit: 1800,
          defaultProfitMetric: 'profitV2',
        })
      );

      expect(rowsByDate['2026-04-10']).toEqual(
        expect.objectContaining({
          sales: 1500,
          expenses: 300,
          cogsFromExpenses: 300,
          operatingExpenses: 0,
          profit: 1200,
          profitV2: 1200,
          netProfit: 1200,
          defaultProfitMetric: 'profitV2',
        })
      );

      response.body.forEach((row) => {
        expect(row.reconciliation).toEqual(
          expect.objectContaining({
            delta: 0,
            tolerance: 0.01,
            isReconciled: true,
          })
        );
      });
    });
  });

  describe('GET /reports/expense-distribution', () => {
    it('allows accountant and returns categories sorted by amount desc', async () => {
      mockPrisma.expense.findMany.mockResolvedValueOnce([
        {
          date: new Date('2026-04-01'),
          category: 'Shop rent',
          amount: 400,
          expense_category: { name: 'Shop rent', affects_cogs_default: false },
        },
        {
          date: new Date('2026-04-01'),
          category: 'Buying stocks',
          amount: 1200,
          expense_category: { name: 'Buying stocks', affects_cogs_default: true },
        },
        {
          date: new Date('2026-04-02'),
          category: 'Shop rent',
          amount: 100,
          expense_category: { name: 'Shop rent', affects_cogs_default: false },
        },
      ]);

      const response = await client.get('/api/reports/expense-distribution?range=monthly', accountantToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual([
        { category: 'Buying stocks', amount: 1200 },
        { category: 'Shop rent', amount: 500 },
      ]);
    });
  });

  describe('Scheduled report access control', () => {
    it('returns scheduler diagnostics for owner with expected response shape', async () => {
      const response = await client.get('/api/reports/scheduler/status?previewLimit=5', ownerToken);

      assertions.expectApiResponse(response, 200);
      expect(new Date(response.body.now).toString()).not.toBe('Invalid Date');

      expect(response.body).toEqual(
        expect.objectContaining({
          pollIntervalMs: expect.any(Number),
          schedulerEnabled: expect.any(Boolean),
          schedulerRunning: expect.any(Boolean),
          tickInProgress: expect.any(Boolean),
          mailConfigured: expect.any(Boolean),
          cacheSize: expect.any(Number),
          timezone: expect.any(String),
        })
      );

      expect(response.body.instance).toEqual(
        expect.objectContaining({
          currentInstanceId: expect.any(String),
          schedulerInstanceId: expect.any(String),
          isActiveInstance: expect.any(Boolean),
        })
      );

      expect(response.body.users).toEqual(
        expect.objectContaining({
          receiveScheduledReportsEnabled: expect.any(Number),
          dueNowCount: expect.any(Number),
          dueAlreadySentCount: expect.any(Number),
          dueToSendCount: expect.any(Number),
          notDueCount: expect.any(Number),
        })
      );

      expect(Array.isArray(response.body.duePreview)).toBe(true);
      expect(Array.isArray(response.body.notDuePreview)).toBe(true);
      expect(response.body.duePreview.length).toBeLessThanOrEqual(5);
      expect(response.body.notDuePreview.length).toBeLessThanOrEqual(5);
    });

    it('blocks accountant and staff from scheduler diagnostics endpoint', async () => {
      const accountantResponse = await client.get('/api/reports/scheduler/status', accountantToken);
      const staffResponse = await client.get('/api/reports/scheduler/status', staffToken);

      assertions.expectForbiddenError(accountantResponse);
      assertions.expectForbiddenError(staffResponse);
    });

    it('allows owner to create a schedule', async () => {
      const response = await client.post('/api/reports/schedule', { frequency: 'weekly' }, ownerToken);

      assertions.expectApiResponse(response, 200);
      expect(response.body).toEqual({ message: 'Scheduled reports coming soon' });
    });

    it('allows owner to list, get, update, and delete schedules', async () => {
      const listResponse = await client.get('/api/reports/schedules', ownerToken);
      const getResponse = await client.get('/api/reports/schedules/schedule-1', ownerToken);
      const updateResponse = await client.put(
        '/api/reports/schedules/schedule-1',
        { frequency: 'monthly' },
        ownerToken
      );
      const deleteResponse = await client.delete('/api/reports/schedules/schedule-1', ownerToken);

      assertions.expectApiResponse(listResponse, 200);
      assertions.expectApiResponse(getResponse, 200);
      assertions.expectApiResponse(updateResponse, 200);
      assertions.expectApiResponse(deleteResponse, 200);

      expect(listResponse.body).toEqual([]);
      expect(getResponse.body).toEqual({ message: 'Schedule not found' });
      expect(updateResponse.body).toEqual({ message: 'Schedule updated' });
      expect(deleteResponse.body).toEqual({ message: 'Schedule deleted' });
    });

    it('blocks accountant from owner-only schedule endpoints', async () => {
      const createResponse = await client.post(
        '/api/reports/schedule',
        { frequency: 'weekly' },
        accountantToken
      );
      const listResponse = await client.get('/api/reports/schedules', accountantToken);
      const getResponse = await client.get('/api/reports/schedules/schedule-1', accountantToken);
      const updateResponse = await client.put(
        '/api/reports/schedules/schedule-1',
        { frequency: 'monthly' },
        accountantToken
      );
      const deleteResponse = await client.delete('/api/reports/schedules/schedule-1', accountantToken);

      assertions.expectForbiddenError(createResponse);
      assertions.expectForbiddenError(listResponse);
      assertions.expectForbiddenError(getResponse);
      assertions.expectForbiddenError(updateResponse);
      assertions.expectForbiddenError(deleteResponse);
    });

    it('blocks staff from owner-only schedule endpoints', async () => {
      const createResponse = await client.post('/api/reports/schedule', { frequency: 'weekly' }, staffToken);
      const listResponse = await client.get('/api/reports/schedules', staffToken);
      const getResponse = await client.get('/api/reports/schedules/schedule-1', staffToken);
      const updateResponse = await client.put(
        '/api/reports/schedules/schedule-1',
        { frequency: 'monthly' },
        staffToken
      );
      const deleteResponse = await client.delete('/api/reports/schedules/schedule-1', staffToken);

      assertions.expectForbiddenError(createResponse);
      assertions.expectForbiddenError(listResponse);
      assertions.expectForbiddenError(getResponse);
      assertions.expectForbiddenError(updateResponse);
      assertions.expectForbiddenError(deleteResponse);
    });

    it('blocks staff from owner/accountant restricted report endpoints', async () => {
      const summaryResponse = await client.get('/api/reports/summary?range=weekly', staffToken);
      const profitTrendResponse = await client.get('/api/reports/profit-trend?range=daily', staffToken);
      const expenseDistributionResponse = await client.get(
        '/api/reports/expense-distribution?range=monthly',
        staffToken
      );

      assertions.expectForbiddenError(summaryResponse);
      assertions.expectForbiddenError(profitTrendResponse);
      assertions.expectForbiddenError(expenseDistributionResponse);
    });
  });

  describe('POST /reports/export access control', () => {
    it('allows owner and accountant to export reports', async () => {
      const ownerResponse = await client.post(
        '/api/reports/export',
        { type: 'summary', range: 'monthly' },
        ownerToken
      );
      const accountantResponse = await client.post(
        '/api/reports/export',
        { type: 'summary', range: 'monthly' },
        accountantToken
      );

      assertions.expectApiResponse(ownerResponse, 200);
      assertions.expectApiResponse(accountantResponse, 200);
      expect(ownerResponse.body).toEqual(
        expect.objectContaining({
          message: 'Export feature coming soon',
          type: 'summary',
          range: 'monthly',
        })
      );
      expect(accountantResponse.body).toEqual(
        expect.objectContaining({
          message: 'Export feature coming soon',
          type: 'summary',
          range: 'monthly',
        })
      );
    });

    it('blocks staff from export endpoint', async () => {
      const response = await client.post(
        '/api/reports/export',
        { type: 'summary', range: 'monthly' },
        staffToken
      );

      assertions.expectForbiddenError(response);
    });
  });
});
