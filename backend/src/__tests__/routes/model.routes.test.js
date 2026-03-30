const express = require('express');
const request = require('supertest');

// Mock dependencies
jest.mock('../../middleware/authMiddleware', () => (req, res, next) => next());
jest.mock('../../middleware/roleMiddleware', () => () => (req, res, next) => next());
jest.mock('../../middleware/auditLogger', () => () => (req, res, next) => next());
jest.mock('../../middleware/validation.middleware', () => ({
  validate: () => (req, res, next) => next(),
  modelSchema: {},
}));

jest.mock('../../controllers/model.controller', () => ({
  getModels: jest.fn((req, res) => res.json({ success: true, action: 'getModels' })),
  addModel: jest.fn((req, res) => res.json({ success: true, action: 'addModel' })),
  updateModel: jest.fn((req, res) => res.json({ success: true, action: 'updateModel' })),
  deleteModel: jest.fn((req, res) => res.json({ success: true, action: 'deleteModel' })),
  restoreModel: jest.fn((req, res) => res.json({ success: true, action: 'restoreModel' })),
}));

const modelRoutes = require('../../routes/model.routes');
const controller = require('../../controllers/model.controller');

describe('Model Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/models', modelRoutes);
    jest.clearAllMocks();
  });

  describe('GET /api/models', () => {
    it('should call getModels controller', async () => {
      const response = await request(app).get('/api/models');

      expect(response.status).toBe(200);
      expect(controller.getModels).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'getModels' });
    });
  });

  describe('POST /api/models', () => {
    it('should call addModel controller', async () => {
      const response = await request(app)
        .post('/api/models')
        .send({ name: 'Test Model' });

      expect(response.status).toBe(200);
      expect(controller.addModel).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'addModel' });
    });
  });

  describe('PUT /api/models/:id', () => {
    it('should call updateModel controller', async () => {
      const response = await request(app)
        .put('/api/models/1')
        .send({ name: 'Updated Model' });

      expect(response.status).toBe(200);
      expect(controller.updateModel).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'updateModel' });
    });
  });

  describe('DELETE /api/models/:id', () => {
    it('should call deleteModel controller', async () => {
      const response = await request(app).delete('/api/models/1');

      expect(response.status).toBe(200);
      expect(controller.deleteModel).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'deleteModel' });
    });
  });

  describe('PATCH /api/models/:id/restore', () => {
    it('should call restoreModel controller', async () => {
      const response = await request(app).patch('/api/models/1/restore');

      expect(response.status).toBe(200);
      expect(controller.restoreModel).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'restoreModel' });
    });
  });

  describe('Route ordering', () => {
    it('should handle all HTTP methods', async () => {
      await request(app).get('/api/models');
      await request(app).post('/api/models').send({ name: 'Model' });
      await request(app).put('/api/models/1').send({ name: 'Model Updated' });
      await request(app).delete('/api/models/1');
      await request(app).patch('/api/models/1/restore');

      expect(controller.getModels).toHaveBeenCalledTimes(1);
      expect(controller.addModel).toHaveBeenCalledTimes(1);
      expect(controller.updateModel).toHaveBeenCalledTimes(1);
      expect(controller.deleteModel).toHaveBeenCalledTimes(1);
      expect(controller.restoreModel).toHaveBeenCalledTimes(1);
    });
  });
});
