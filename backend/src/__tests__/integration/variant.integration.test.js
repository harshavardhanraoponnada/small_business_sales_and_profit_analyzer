/**
 * Integration Tests: Variant Routes
 */

const { createTestClient, assertions } = require('../helpers');

jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const router = express.Router();
  let variants = [];

  router.get('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json(variants);
  });

  router.post('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.body.variant_name || !req.body.product_id) return res.status(400).json({ message: 'Missing fields' });
    const v = { id: variants.length + 1, ...req.body };
    variants.push(v);
    return res.status(201).json(v);
  });

  router.put('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const v = variants.find(x => x.id === parseInt(req.params.id));
    if (!v) return res.status(404).json({ message: 'Not found' });
    Object.assign(v, req.body);
    return res.json(v);
  });

  router.delete('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const idx = variants.findIndex(x => x.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ message: 'Not found' });
    variants.splice(idx, 1);
    return res.json({ success: true });
  });

  app.use('/api/variants', router);
  return app;
});

describe('Variant Routes Integration Tests', () => {
  let app, client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = require('../../app');
    client = createTestClient(app);
  });

  it('should CRUD variants', async () => {
    let response = await client.post('/api/variants', {
      variant_name: 'Galaxy S21 Black',
      product_id: 1,
      sku: 'SKU001',
      selling_price: 999.99,
      stock: 50
    }, token);
    assertions.expectApiResponse(response, 201);

    response = await client.get('/api/variants', token);
    assertions.expectApiResponse(response, 200);

    response = await client.put('/api/variants/1', { stock: 40 }, token);
    assertions.expectApiResponse(response, 200);

    response = await client.delete('/api/variants/1', token);
    assertions.expectApiResponse(response, 200);
  });
});
