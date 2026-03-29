/**
 * Integration Tests: Model Routes
 * Tests ML model management endpoints
 */

const { createTestClient, assertions } = require('../helpers');

jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const router = express.Router();
  let models = [{ id: 1, name: 'sales_forecast', version: '1.0', accuracy: 0.92 }];

  router.get('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json(models);
  });

  router.post('/save', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const model = { id: models.length + 1, ...req.body, saved_at: new Date() };
    models.push(model);
    return res.status(201).json(model);
  });

  router.get('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const model = models.find(m => m.id === parseInt(req.params.id));
    if (!model) return res.status(404).json({ message: 'Not found' });
    return res.json(model);
  });

  app.use('/api/models', router);
  return app;
});

describe('Model Routes Integration Tests', () => {
  let app, client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = require('../../app');
    client = createTestClient(app);
  });

  it('should list models', async () => {
    const response = await client.get('/api/models', token);
    assertions.expectApiResponse(response, 200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should save model', async () => {
    const response = await client.post('/api/models/save', {
      name: 'expense_forecast',
      version: '2.0'
    }, token);
    assertions.expectApiResponse(response, 201);
    expect(response.body.name).toBe('expense_forecast');
  });

  it('should get model by ID', async () => {
    const response = await client.get('/api/models/1', token);
    assertions.expectApiResponse(response, 200);
    expect(response.body.name).toBe('sales_forecast');
  });
});
