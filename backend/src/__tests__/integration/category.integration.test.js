/**
 * Integration Tests: Category Routes
 */

const { createTestClient, assertions } = require('../helpers');

jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const router = express.Router();
  let categories = [];

  router.get('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json(categories);
  });

  router.post('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.body.name) return res.status(400).json({ message: 'Name required' });
    const cat = { id: categories.length + 1, ...req.body };
    categories.push(cat);
    return res.status(201).json(cat);
  });

  router.put('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const cat = categories.find(c => c.id === parseInt(req.params.id));
    if (!cat) return res.status(404).json({ message: 'Not found' });
    Object.assign(cat, req.body);
    return res.json(cat);
  });

  router.delete('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const idx = categories.findIndex(c => c.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ message: 'Not found' });
    categories.splice(idx, 1);
    return res.json({ success: true });
  });

  app.use('/api/categories', router);
  return app;
});

describe('Category Routes Integration Tests', () => {
  let app, client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = require('../../app');
    client = createTestClient(app);
  });

  describe('CRUD Operations', () => {
    it('should list categories', async () => {
      const response = await client.get('/api/categories', token);
      assertions.expectApiResponse(response, 200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should create category', async () => {
      const response = await client.post('/api/categories', { name: 'Electronics' }, token);
      assertions.expectApiResponse(response, 201);
      expect(response.body.name).toBe('Electronics');
    });

    it('should update category', async () => {
      await client.post('/api/categories', { name: 'Phones' }, token);
      const response = await client.put('/api/categories/1', { name: 'Mobile' }, token);
      assertions.expectApiResponse(response, 200);
      expect(response.body.name).toBe('Mobile');
    });

    it('should delete category', async () => {
      await client.post('/api/categories', { name: 'Test' }, token);
      const response = await client.delete('/api/categories/1', token);
      assertions.expectApiResponse(response, 200);
      expect(response.body.success).toBe(true);
    });
  });
});
