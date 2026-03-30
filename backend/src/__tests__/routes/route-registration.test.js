/**
 * Smoke Tests: Route module registration
 * Loads each real route module and verifies it exports an Express router.
 */

const express = require('express');
const request = require('supertest');

const routeModules = [
  { mount: '/api/auth', router: require('../../routes/auth.routes') },
  { mount: '/api/products', router: require('../../routes/product.routes') },
  { mount: '/api/sales', router: require('../../routes/sales.routes') },
  { mount: '/api/invoices', router: require('../../routes/invoice.routes') },
  { mount: '/api/audit', router: require('../../routes/audit.routes') },
  { mount: '/api/expenses', router: require('../../routes/expense.routes') },
  { mount: '/api/reports', router: require('../../routes/report.routes') },
  { mount: '/api/categories', router: require('../../routes/category.routes') },
  { mount: '/api/brands', router: require('../../routes/brand.routes') },
  { mount: '/api/models', router: require('../../routes/model.routes') },
  { mount: '/api/variants', router: require('../../routes/variant.routes') },
  { mount: '/api/ml', router: require('../../routes/mlProxy.routes') },
  { mount: '/api/users', router: require('../../routes/user.routes') },
];

describe('Route Registration', () => {
  it('all route modules export routers with handlers', () => {
    for (const mod of routeModules) {
      expect(mod.router).toBeDefined();
      expect(typeof mod.router.use).toBe('function');
      expect(Array.isArray(mod.router.stack)).toBe(true);
      expect(mod.router.stack.length).toBeGreaterThan(0);
    }
  });

  it('all route modules can mount into an express app', async () => {
    const app = express();
    app.use(express.json());

    for (const mod of routeModules) {
      app.use(mod.mount, mod.router);
    }

    // Unknown route under a mounted prefix should return 404 (app is alive and routes mounted).
    const response = await request(app).get('/api/auth/__route_registration_smoke__');
    expect(response.status).toBe(404);
  });
});
