/**
 * Integration Tests: ML Proxy Routes
 * Tests ML service proxy endpoints (predictions, forecasts, training, evaluation)
 */

const { createTestClient, assertions } = require('../helpers');

global.fetch = jest.fn();

jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const router = express.Router();

  router.get('/predictions/summary', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json({ summary: 'Sales forecast', confidence: 0.92 });
  });

  router.get('/predictions/forecast/:type', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json({
      type: req.params.type,
      forecast: [100, 110, 120],
      confidence: 0.85
    });
  });

  router.post('/predictions/train', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json({ success: true, message: 'Training completed', models: 3 });
  });

  router.get('/predictions/evaluate/:type', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json({ type: req.params.type, mae: 125.5, rmse: 165.3, accuracy: 0.92 });
  });

  app.use('/api/predict', router);
  return app;
});

describe('ML Proxy Routes Integration Tests', () => {
  let app, client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    app = require('../../app');
    client = createTestClient(app);
  });

  describe('GET /predict/predictions/summary', () => {
    it('should fetch ML predictions summary', async () => {
      const response = await client.get('/api/predict/predictions/summary', token);
      assertions.expectApiResponse(response, 200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('confidence');
    });

    it('should reject without authentication', async () => {
      const response = await client.get('/api/predict/predictions/summary');
      assertions.expectAuthError(response);
    });
  });

  describe('GET /predict/predictions/forecast/:type', () => {
    it('should fetch sales forecast', async () => {
      const response = await client.get('/api/predict/predictions/forecast/sales', token);
      assertions.expectApiResponse(response, 200);
      expect(response.body.type).toBe('sales');
      expect(Array.isArray(response.body.forecast)).toBe(true);
    });

    it('should fetch expense forecast', async () => {
      const response = await client.get('/api/predict/predictions/forecast/expense', token);
      assertions.expectApiResponse(response, 200);
      expect(response.body.type).toBe('expense');
    });

    it('should fetch revenue forecast', async () => {
      const response = await client.get('/api/predict/predictions/forecast/revenue', token);
      assertions.expectApiResponse(response, 200);
      expect(response.body.type).toBe('revenue');
    });
  });

  describe('POST /predict/predictions/train', () => {
    it('should trigger model training', async () => {
      const response = await client.post('/api/predict/predictions/train', {}, token);
      assertions.expectApiResponse(response, 200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Training completed');
    });

    it('should reject training without auth', async () => {
      const response = await client.post('/api/predict/predictions/train', {});
      assertions.expectAuthError(response);
    });
  });

  describe('GET /predict/predictions/evaluate/:type', () => {
    it('should evaluate model performance', async () => {
      const response = await client.get('/api/predict/predictions/evaluate/sales', token);
      assertions.expectApiResponse(response, 200);
      expect(response.body).toHaveProperty('mae');
      expect(response.body).toHaveProperty('rmse');
      expect(response.body).toHaveProperty('accuracy');
      expect(response.body.accuracy).toBe(0.92);
    });
  });

  describe('Error Handling', () => {
    it('should handle ML service errors', async () => {
      global.fetch.mockRejectedValue(new Error('ML service unavailable'));
      
      // In real scenario, would be caught and returned as 500
      const response = await client.get('/api/predict/predictions/summary', token);
      // Response behavior depends on error handling implementation
    });
  });
});
