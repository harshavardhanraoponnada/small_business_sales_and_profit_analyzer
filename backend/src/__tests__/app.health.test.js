/**
 * Integration Tests: app.js wiring and health endpoint
 */

const request = require('supertest');
const app = require('../app');

describe('App Health and Wiring', () => {
  it('GET /api/health returns service metadata', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('instance');
    expect(response.body).toHaveProperty('uptime');
  });

  it('unknown route returns 404', async () => {
    const response = await request(app).get('/api/__not_found__');
    expect(response.status).toBe(404);
  });
});
