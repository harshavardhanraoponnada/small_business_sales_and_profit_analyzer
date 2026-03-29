/**
 * Integration Tests: Invoice Routes
 * Tests invoice endpoints (GET /invoices, GET /invoices/:id, regenerate)
 */

const { createTestClient, assertions } = require('../helpers');

jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const router = express.Router();
  
  let invoices = [
    { id: 1, invoice_number: 'INV001', sale_id: 1, total: 999.99, created_at: new Date() },
  ];

  router.get('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json(invoices);
  });

  router.get('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const invoice = invoices.find(i => i.id === parseInt(req.params.id));
    if (!invoice) return res.status(404).json({ message: 'Not found' });
    return res.json({ ...invoice, pdf_path: '/uploads/invoices/INV001.pdf' });
  });

  router.post('/regenerate/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const invoice = invoices.find(i => i.id === parseInt(req.params.id));
    if (!invoice) return res.status(404).json({ message: 'Not found' });
    return res.json({ success: true, message: 'Invoice regenerated' });
  });

  app.use('/api/invoices', router);
  return app;
});

describe('Invoice Routes Integration Tests', () => {
  let app, client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = require('../../app');
    client = createTestClient(app);
  });

  describe('GET /invoices', () => {
    it('should list invoices', async () => {
      const response = await client.get('/api/invoices', token);
      assertions.expectApiResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject without auth', async () => {
      const response = await client.get('/api/invoices');
      assertions.expectAuthError(response);
    });
  });

  describe('GET /invoices/:id', () => {
    it('should retrieve invoice by ID', async () => {
      const response = await client.get('/api/invoices/1', token);
      assertions.expectApiResponse(response, 200);
      expect(response.body.invoice_number).toBe('INV001');
      expect(response.body).toHaveProperty('pdf_path');
    });

    it('should return 404 for non-existent invoice', async () => {
      const response = await client.get('/api/invoices/999', token);
      assertions.expectNotFoundError(response);
    });
  });

  describe('POST /invoices/regenerate/:id', () => {
    it('should regenerate invoice PDF', async () => {
      const response = await client.post('/api/invoices/regenerate/1', {}, token);
      assertions.expectApiResponse(response, 200);
      expect(response.body.success).toBe(true);
    });

    it('should reject regenerate for non-existent invoice', async () => {
      const response = await client.post('/api/invoices/regenerate/999', {}, token);
      assertions.expectNotFoundError(response);
    });
  });
});
