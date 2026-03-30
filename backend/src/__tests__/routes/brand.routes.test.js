const express = require('express');
const request = require('supertest');

// Mock dependencies
jest.mock('../../middleware/authMiddleware', () => (req, res, next) => next());
jest.mock('../../middleware/roleMiddleware', () => () => (req, res, next) => next());
jest.mock('../../middleware/auditLogger', () => () => (req, res, next) => next());
jest.mock('../../middleware/validation.middleware', () => ({
  validate: () => (req, res, next) => next(),
  brandSchema: {},
}));

jest.mock('../../controllers/brand.controller', () => ({
  getBrands: jest.fn((req, res) => res.json({ success: true, action: 'getBrands' })),
  addBrand: jest.fn((req, res) => res.json({ success: true, action: 'addBrand' })),
  updateBrand: jest.fn((req, res) => res.json({ success: true, action: 'updateBrand' })),
  deleteBrand: jest.fn((req, res) => res.json({ success: true, action: 'deleteBrand' })),
  restoreBrand: jest.fn((req, res) => res.json({ success: true, action: 'restoreBrand' })),
}));

const brandRoutes = require('../../routes/brand.routes');
const controller = require('../../controllers/brand.controller');

describe('Brand Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/brands', brandRoutes);
    jest.clearAllMocks();
  });

  describe('GET /api/brands', () => {
    it('should call getBrands controller', async () => {
      const response = await request(app).get('/api/brands');

      expect(response.status).toBe(200);
      expect(controller.getBrands).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'getBrands' });
    });
  });

  describe('POST /api/brands', () => {
    it('should call addBrand controller', async () => {
      const response = await request(app)
        .post('/api/brands')
        .send({ name: 'Test Brand' });

      expect(response.status).toBe(200);
      expect(controller.addBrand).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'addBrand' });
    });
  });

  describe('PUT /api/brands/:id', () => {
    it('should call updateBrand controller', async () => {
      const response = await request(app)
        .put('/api/brands/1')
        .send({ name: 'Updated Brand' });

      expect(response.status).toBe(200);
      expect(controller.updateBrand).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'updateBrand' });
    });
  });

  describe('DELETE /api/brands/:id', () => {
    it('should call deleteBrand controller', async () => {
      const response = await request(app).delete('/api/brands/1');

      expect(response.status).toBe(200);
      expect(controller.deleteBrand).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'deleteBrand' });
    });
  });

  describe('PATCH /api/brands/:id/restore', () => {
    it('should call restoreBrand controller', async () => {
      const response = await request(app).patch('/api/brands/1/restore');

      expect(response.status).toBe(200);
      expect(controller.restoreBrand).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true, action: 'restoreBrand' });
    });
  });

  describe('Route ordering', () => {
    it('should handlers all HTTP methods', async () => {
      await request(app).get('/api/brands');
      await request(app).post('/api/brands').send({ name: 'Brand' });
      await request(app).put('/api/brands/1').send({ name: 'Brand Updated' });
      await request(app).delete('/api/brands/1');
      await request(app).patch('/api/brands/1/restore');

      expect(controller.getBrands).toHaveBeenCalledTimes(1);
      expect(controller.addBrand).toHaveBeenCalledTimes(1);
      expect(controller.updateBrand).toHaveBeenCalledTimes(1);
      expect(controller.deleteBrand).toHaveBeenCalledTimes(1);
      expect(controller.restoreBrand).toHaveBeenCalledTimes(1);
    });
  });
});
