const express = require('express');
const request = require('supertest');

// Mock dependencies
jest.mock('../../middleware/authMiddleware', () => (req, res, next) => next());
jest.mock('../../middleware/roleMiddleware', () => () => (req, res, next) => next());
jest.mock('../../middleware/auditLogger', () => () => (req, res, next) => next());
jest.mock('../../middleware/validation.middleware', () => ({
  validate: () => (req, res, next) => next(),
  variantSchema: {},
}));

jest.mock('../../controllers/variant.controller', () => ({
  getVariants: jest.fn((req, res) => res.json({ success: true, action: 'getVariants' })),
  addVariant: jest.fn((req, res) => res.json({ success: true, action: 'addVariant' })),
  updateVariant: jest.fn((req, res) => res.json({ success: true, action: 'updateVariant' })),
  deleteVariant: jest.fn((req, res) => res.json({ success: true, action: 'deleteVariant' })),
  restoreVariant: jest.fn((req, res) => res.json({ success: true, action: 'restoreVariant' })),
}));

const variantRoutes = require('../../routes/variant.routes');
const controller = require('../../controllers/variant.controller');

describe('Variant Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/variants', variantRoutes);
    jest.clearAllMocks();
  });

  describe('GET /api/variants', () => {
    it('should call getVariants controller', async () => {
      const response = await request(app).get('/api/variants');

      expect(response.status).toBe(200);
      expect(controller.getVariants).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'getVariants' });
    });
  });

  describe('POST /api/variants', () => {
    it('should call addVariant controller', async () => {
      const response = await request(app)
        .post('/api/variants')
        .send({ name: 'Test Variant' });

      expect(response.status).toBe(200);
      expect(controller.addVariant).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'addVariant' });
    });
  });

  describe('PUT /api/variants/:id', () => {
    it('should call updateVariant controller', async () => {
      const response = await request(app)
        .put('/api/variants/1')
        .send({ name: 'Updated Variant' });

      expect(response.status).toBe(200);
      expect(controller.updateVariant).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'updateVariant' });
    });
  });

  describe('DELETE /api/variants/:id', () => {
    it('should call deleteVariant controller', async () => {
      const response = await request(app).delete('/api/variants/1');

      expect(response.status).toBe(200);
      expect(controller.deleteVariant).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'deleteVariant' });
    });
  });

  describe('PATCH /api/variants/:id/restore', () => {
    it('should call restoreVariant controller', async () => {
      const response = await request(app).patch('/api/variants/1/restore');

      expect(response.status).toBe(200);
      expect(controller.restoreVariant).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'restoreVariant' });
    });
  });

  describe('Route ordering', () => {
    it('should handle all HTTP methods', async () => {
      await request(app).get('/api/variants');
      await request(app).post('/api/variants').send({ name: 'Variant' });
      await request(app).put('/api/variants/1').send({ name: 'Variant Updated' });
      await request(app).delete('/api/variants/1');
      await request(app).patch('/api/variants/1/restore');

      expect(controller.getVariants).toHaveBeenCalledTimes(1);
      expect(controller.addVariant).toHaveBeenCalledTimes(1);
      expect(controller.updateVariant).toHaveBeenCalledTimes(1);
      expect(controller.deleteVariant).toHaveBeenCalledTimes(1);
      expect(controller.restoreVariant).toHaveBeenCalledTimes(1);
    });
  });
});
