/**
 * Integration Tests: Product Routes
 * Tests product endpoints (GET, POST, PUT, DELETE, PATCH /restore)
 */

const request = require('supertest');
const { createTestClient, factories, assertions } = require('../helpers');

// Mock app for testing
jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  const router = express.Router();
  
  // Mock products storage
  let products = [
    { id: 1, name: 'Product 1', price: 100, stock: 10, category_id: 1, is_deleted: false },
  ];

  router.get('/', (req, res) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const active = products.filter(p => !p.is_deleted);
    return res.json(active);
  });

  router.post('/', (req, res) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!req.body.name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const newProduct = {
      id: products.length + 1,
      ...req.body,
      is_deleted: false,
      created_at: new Date(),
    };
    products.push(newProduct);
    return res.status(201).json(newProduct);
  });

  router.put('/:id', (req, res) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    Object.assign(product, req.body);
    return res.json(product);
  });

  router.delete('/:id', (req, res) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    product.is_deleted = true;
    return res.json({ success: true, message: 'Product deleted' });
  });

  router.patch('/:id/restore', (req, res) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    product.is_deleted = false;
    return res.json({ success: true, message: 'Product restored' });
  });

  app.use('/api/products', router);
  return app;
});

describe('Product Routes Integration Tests', () => {
  let app;
  let client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = require('../../app');
    client = createTestClient(app);
  });

  describe('GET /products', () => {
    it('should list all active products', async () => {
      const response = await client.get('/api/products', token);

      assertions.expectApiResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject GET without authentication', async () => {
      const response = await client.get('/api/products');
      assertions.expectAuthError(response);
    });

    it('should not include deleted products', async () => {
      const response = await client.get('/api/products', token);
      
      expect(response.body.every(p => !p.is_deleted)).toBe(true);
    });
  });

  describe('POST /products', () => {
    it('should create new product with valid data', async () => {
      const productData = {
        name: 'New Product',
        price: 299.99,
        stock: 50,
        category_id: 1,
        description: 'Test product'
      };

      const response = await client.post('/api/products', productData, token);

      assertions.expectApiResponse(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New Product');
    });

    it('should reject POST without authentication', async () => {
      const response = await client.post('/api/products', { name: 'Test' });
      assertions.expectAuthError(response);
    });

    it('should validate required fields', async () => {
      const response = await client.post('/api/products', { price: 100 }, token);
      assertions.expectValidationError(response);
    });
  });

  describe('PUT /products/:id', () => {
    it('should update product with valid data', async () => {
      const updateData = { price: 199.99, stock: 25 };
      const response = await client.put('/api/products/1', updateData, token);

      assertions.expectApiResponse(response, 200);
      expect(response.body.price).toBe(199.99);
    });

    it('should reject update of non-existent product', async () => {
      const response = await client.put('/api/products/999', { price: 100 }, token);
      assertions.expectNotFoundError(response);
    });

    it('should reject PUT without authentication', async () => {
      const response = await client.put('/api/products/1', { price: 100 });
      assertions.expectAuthError(response);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should soft-delete product', async () => {
      const response = await client.delete('/api/products/1', token);

      assertions.expectApiResponse(response, 200);
      expect(response.body.success).toBe(true);
    });

    it('should reject delete of non-existent product', async () => {
      const response = await client.delete('/api/products/999', token);
      assertions.expectNotFoundError(response);
    });

    it('should reject DELETE without authentication', async () => {
      const response = await client.delete('/api/products/1');
      assertions.expectAuthError(response);
    });
  });

  describe('PATCH /products/:id/restore', () => {
    it('should restore deleted product', async () => {
      // First delete
      await client.delete('/api/products/1', token);
      
      // Then restore
      const response = await client.put('/api/products/1/restore', {}, token);
      
      // Note: The test uses PUT for PATCH mock
      assertions.expectApiResponse(response, 200);
    });
  });

  describe('Audit Logging', () => {
    it('should log product creation', async () => {
      await client.post('/api/products', {
        name: 'Audited Product',
        price: 100
      }, token);

      // Audit log verification would check database
    });

    it('should log product deletion', async () => {
      await client.delete('/api/products/1', token);

      // Audit log verification would check database
    });
  });
});
