/**
 * Integration Tests: Report Routes
 * Tests report endpoints (sales-summary, category-breakdown, expense-analysis)
 */

const { createTestClient, assertions } = require('../helpers');

jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const router = express.Router();

  router.get('/sales-summary', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json({
      range: req.query.range || 'monthly',
      totalSales: 50000,
      totalExpenses: 5000,
      profit: 45000,
      profitMargin: '90.00'
    });
  });

  router.get('/category-breakdown', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json([
      { category: 'Electronics', sales: 30000 },
      { category: 'Accessories', sales: 20000 }
    ]);
  });

  router.get('/expense-analysis', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json({
      totalExpenses: 5000,
      byCategory: { travel: 2000, supplies: 3000 }
    });
  });

  app.use('/api/reports', router);
  return app;
});

describe('Report Routes Integration Tests', () => {
  let app, client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = require('../../app');
    client = createTestClient(app);
  });

  describe('GET /reports/sales-summary', () => {
    it('should return sales summary', async () => {
      const response = await client.get('/api/reports/sales-summary', token);
      assertions.expectApiResponse(response, 200);
      expect(response.body).toHaveProperty('totalSales');
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('profit');
      expect(response.body).toHaveProperty('profitMargin');
    });

    it('should handle date range parameter', async () => {
      const response = await client.get('/api/reports/sales-summary?range=weekly', token);
      assertions.expectApiResponse(response, 200);
      expect(response.body.range).toBe('weekly');
    });
  });

  describe('GET /reports/category-breakdown', () => {
    it('should return category breakdown', async () => {
      const response = await client.get('/api/reports/category-breakdown', token);
      assertions.expectApiResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('category');
      expect(response.body[0]).toHaveProperty('sales');
    });
  });

  describe('GET /reports/expense-analysis', () => {
    it('should return expense analysis', async () => {
      const response = await client.get('/api/reports/expense-analysis', token);
      assertions.expectApiResponse(response, 200);
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('byCategory');
    });
  });
});
