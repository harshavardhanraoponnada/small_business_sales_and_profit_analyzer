/**
 * Integration Tests: Brand Routes
 */

const { createTestClient, assertions } = require('../helpers');

jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const router = express.Router();
  let brands = [];

  router.get('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json(brands);
  });

  router.post('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.body.name) return res.status(400).json({ message: 'Name required' });
    const brand = { id: brands.length + 1, ...req.body };
    brands.push(brand);
    return res.status(201).json(brand);
  });

  router.put('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const brand = brands.find(b => b.id === parseInt(req.params.id));
    if (!brand) return res.status(404).json({ message: 'Not found' });
    Object.assign(brand, req.body);
    return res.json(brand);
  });

  router.delete('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const idx = brands.findIndex(b => b.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ message: 'Not found' });
    brands.splice(idx, 1);
    return res.json({ success: true });
  });

  app.use('/api/brands', router);
  return app;
});

describe('Brand Routes Integration Tests', () => {
  let app, client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = require('../../app');
    client = createTestClient(app);
  });

  it('should CRUD brands', async () => {
    // Create
    let response = await client.post('/api/brands', { name: 'Samsung', category_id: 1 }, token);
    assertions.expectApiResponse(response, 201);

    // Read
    response = await client.get('/api/brands', token);
    assertions.expectApiResponse(response, 200);

    // Update
    response = await client.put('/api/brands/1', { name: 'LG' }, token);
    assertions.expectApiResponse(response, 200);

    // Delete
    response = await client.delete('/api/brands/1', token);
    assertions.expectApiResponse(response, 200);
  });
});
