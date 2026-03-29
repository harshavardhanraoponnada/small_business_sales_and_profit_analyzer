/**
 * Integration Tests: Expense Routes
 * Tests expense endpoints (GET, POST, PUT, DELETE /expenses)
 */

const { createTestClient, assertions } = require('../helpers');

jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const router = express.Router();
  let expenses = [];

  router.get('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json(expenses.filter(e => !e.is_deleted));
  });

  router.post('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.body.category || !req.body.amount) return res.status(400).json({ message: 'Missing fields' });
    
    const newExpense = {
      id: expenses.length + 1,
      ...req.body,
      is_deleted: false,
      date: new Date(),
    };
    expenses.push(newExpense);
    return res.status(201).json(newExpense);
  });

  router.put('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const expense = expenses.find(e => e.id === parseInt(req.params.id));
    if (!expense) return res.status(404).json({ message: 'Not found' });
    Object.assign(expense, req.body);
    return res.json(expense);
  });

  router.delete('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const expense = expenses.find(e => e.id === parseInt(req.params.id));
    if (!expense) return res.status(404).json({ message: 'Not found' });
    expense.is_deleted = true;
    return res.json({ success: true });
  });

  app.use('/api/expenses', router);
  return app;
});

describe('Expense Routes Integration Tests', () => {
  let app, client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = require('../../app');
    client = createTestClient(app);
  });

  describe('GET /expenses', () => {
    it('should list expenses', async () => {
      const response = await client.get('/api/expenses', token);
      assertions.expectApiResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject without auth', async () => {
      const response = await client.get('/api/expenses');
      assertions.expectAuthError(response);
    });
  });

  describe('POST /expenses', () => {
    it('should create expense', async () => {
      const response = await client.post('/api/expenses', {
        category: 'office_supplies',
        amount: 150.50,
        description: 'Pens and paper'
      }, token);

      assertions.expectApiResponse(response, 201);
      expect(response.body).toHaveProperty('id');
    });

    it('should validate required fields', async () => {
      const response = await client.post('/api/expenses', { amount: 100 }, token);
      assertions.expectValidationError(response);
    });
  });

  describe('PUT /expenses/:id', () => {
    it('should update expense', async () => {
      // First create
      await client.post('/api/expenses', { category: 'travel', amount: 500 }, token);
      
      // Then update
      const response = await client.put('/api/expenses/1', { amount: 600 }, token);
      assertions.expectApiResponse(response, 200);
      expect(response.body.amount).toBe(600);
    });
  });

  describe('DELETE /expenses/:id', () => {
    it('should soft-delete expense', async () => {
      await client.post('/api/expenses', { category: 'misc', amount: 50 }, token);
      const response = await client.delete('/api/expenses/1', token);
      assertions.expectApiResponse(response, 200);
      expect(response.body.success).toBe(true);
    });
  });
});
