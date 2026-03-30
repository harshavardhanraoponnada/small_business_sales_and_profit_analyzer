const express = require('express');
const request = require('supertest');

// Mock dependencies
jest.mock('../../middleware/authMiddleware', () => (req, res, next) => next());
jest.mock('../../middleware/roleMiddleware', () => () => (req, res, next) => next());
jest.mock('../../middleware/auditLogger', () => () => (req, res, next) => next());
jest.mock('../../middleware/validation.middleware', () => ({
  validate: () => (req, res, next) => next(),
  categorySchema: {},
}));

jest.mock('../../controllers/category.controller', () => ({
  getCategories: jest.fn((req, res) => res.json({ success: true, action: 'getCategories' })),
  addCategory: jest.fn((req, res) => res.json({ success: true, action: 'addCategory' })),
  updateCategory: jest.fn((req, res) => res.json({ success: true, action: 'updateCategory' })),
  deleteCategory: jest.fn((req, res) => res.json({ success: true, action: 'deleteCategory' })),
  restoreCategory: jest.fn((req, res) => res.json({ success: true, action: 'restoreCategory' })),
}));

const categoryRoutes = require('../../routes/category.routes');
const controller = require('../../controllers/category.controller');

describe('Category Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/categories', categoryRoutes);
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should call getCategories controller', async () => {
      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(controller.getCategories).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'getCategories' });
    });
  });

  describe('POST /api/categories', () => {
    it('should call addCategory controller', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Test Category' });

      expect(response.status).toBe(200);
      expect(controller.addCategory).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'addCategory' });
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should call updateCategory controller', async () => {
      const response = await request(app)
        .put('/api/categories/1')
        .send({ name: 'Updated Category' });

      expect(response.status).toBe(200);
      expect(controller.updateCategory).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'updateCategory' });
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should call deleteCategory controller', async () => {
      const response = await request(app).delete('/api/categories/1');

      expect(response.status).toBe(200);
      expect(controller.deleteCategory).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'deleteCategory' });
    });
  });

  describe('PATCH /api/categories/:id/restore', () => {
    it('should call restoreCategory controller', async () => {
      const response = await request(app).patch('/api/categories/1/restore');

      expect(response.status).toBe(200);
      expect(controller.restoreCategory).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'restoreCategory' });
    });
  });

  describe('Route ordering', () => {
    it('should handle all HTTP methods', async () => {
      await request(app).get('/api/categories');
      await request(app).post('/api/categories').send({ name: 'Category' });
      await request(app).put('/api/categories/1').send({ name: 'Category Updated' });
      await request(app).delete('/api/categories/1');
      await request(app).patch('/api/categories/1/restore');

      expect(controller.getCategories).toHaveBeenCalledTimes(1);
      expect(controller.addCategory).toHaveBeenCalledTimes(1);
      expect(controller.updateCategory).toHaveBeenCalledTimes(1);
      expect(controller.deleteCategory).toHaveBeenCalledTimes(1);
      expect(controller.restoreCategory).toHaveBeenCalledTimes(1);
    });
  });
});
