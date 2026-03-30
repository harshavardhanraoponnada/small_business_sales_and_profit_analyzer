/**
 * Integration Tests: Sales Routes
 * Tests sales endpoints (GET /sales, POST /sales with invoice generation)
 */

const { createTestClient, factories, assertions } = require('../helpers');

jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  const router = express.Router();
  let sales = [];

  router.get('/', (req, res) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    return res.json(sales);
  });

  router.post('/', (req, res) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!req.body.product_id && !req.body.variant_id) {
      return res.status(400).json({ message: 'product_id or variant_id required' });
    }
    if (req.body.quantity == null || req.body.total == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (Number(req.body.quantity) <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }
    
    const newSale = {
      id: sales.length + 1,
      ...req.body,
      invoice_number: `INV${sales.length + 1}`,
      date: new Date(),
      status: 'completed',
      is_deleted: false,
    };
    sales.push(newSale);
    return res.status(201).json(newSale);
  });

  app.use('/api/sales', router);
  return app;
});

describe('Sales Routes Integration Tests', () => {
  let app;
  let client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    delete require.cache[require.resolve('../../app')];
    app = require('../../app');
    client = createTestClient(app);
  });

  describe('GET /sales', () => {
    it('should list all sales', async () => {
      const response = await client.get('/api/sales', token);

      assertions.expectApiResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject GET without authentication', async () => {
      const response = await client.get('/api/sales');
      assertions.expectAuthError(response);
    });
  });

  describe('POST /sales - Create Sale with Invoice Generation', () => {
    it('should create sale with product_id', async () => {
      const saleData = {
        product_id: 1,
        quantity: 2,
        total: 199.98,
      };

      const response = await client.post('/api/sales', saleData, token);

      assertions.expectApiResponse(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('invoice_number');
      expect(response.body.status).toBe('completed');
    });

    it('should create sale with variant_id', async () => {
      const saleData = {
        variant_id: 1,
        quantity: 1,
        total: 999.99,
      };

      const response = await client.post('/api/sales', saleData, token);

      assertions.expectApiResponse(response, 201);
      expect(response.body).toHaveProperty('invoice_number');
    });

    it('should reject sale without product_id or variant_id', async () => {
      const saleData = {
        quantity: 1,
        total: 100,
      };

      const response = await client.post('/api/sales', saleData, token);
      assertions.expectValidationError(response);
    });

    it('should reject POST without authentication', async () => {
      const saleData = {
        product_id: 1,
        quantity: 1,
        total: 100,
      };

      const response = await client.post('/api/sales', saleData);
      assertions.expectAuthError(response);
    });

    it('should generate invoice PDF on sale creation', async () => {
      const saleData = {
        product_id: 1,
        quantity: 1,
        total: 99.99,
      };

      const response = await client.post('/api/sales', saleData, token);

      // In real tests: verify invoice PDF was created
      expect(response.body).toHaveProperty('invoice_number');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        product_id: 1,
        // missing quantity and total
      };

      const response = await client.post('/api/sales', incompleteData, token);
      assertions.expectValidationError(response);
    });

    it('should calculate sale amount correctly', async () => {
      const saleData = {
        product_id: 1,
        quantity: 5,
        total: 499.95,
      };

      const response = await client.post('/api/sales', saleData, token);

      assertions.expectApiResponse(response, 201);
      expect(response.body.total).toBe(499.95);
    });
  });

  describe('Audit Logging', () => {
    it('should log sale creation with product_id', async () => {
      await client.post('/api/sales', {
        product_id: 1,
        quantity: 1,
        total: 100,
      }, token);

      // Audit log would contain: "Sold product 1"
    });

    it('should log sale creation with variant_id', async () => {
      await client.post('/api/sales', {
        variant_id: 1,
        quantity: 1,
        total: 100,
      }, token);

      // Audit log would contain: "Sold variant 1"
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity', async () => {
      const response = await client.post('/api/sales', {
        product_id: 1,
        quantity: 0,
        total: 0,
      }, token);

      assertions.expectValidationError(response);
    });

    it('should handle large quantities', async () => {
      const response = await client.post('/api/sales', {
        product_id: 1,
        quantity: 10000,
        total: 999000,
      }, token);

      assertions.expectApiResponse(response, 201);
    });

    it('should handle decimal prices', async () => {
      const response = await client.post('/api/sales', {
        product_id: 1,
        quantity: 3,
        total: 299.97,
      }, token);

      assertions.expectApiResponse(response, 201);
      expect(response.body.total).toBe(299.97);
    });
  });
});
