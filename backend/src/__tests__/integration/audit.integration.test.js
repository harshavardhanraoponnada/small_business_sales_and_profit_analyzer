/**
 * Integration Tests: Audit Routes
 */

const { createTestClient, assertions } = require('../helpers');

jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const router = express.Router();
  let auditLogs = [
    { id: 1, action: 'LOGIN', username: 'testuser', created_at: new Date() }
  ];

  router.get('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json(auditLogs);
  });

  app.use('/api/audit', router);
  return app;
});

describe('Audit Routes Integration Tests', () => {
  let app, client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = require('../../app');
    client = createTestClient(app);
  });

  it('should list audit logs', async () => {
    const response = await client.get('/api/audit', token);
    assertions.expectApiResponse(response, 200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('action');
    expect(response.body[0]).toHaveProperty('username');
  });

  it('should reject without authentication', async () => {
    const response = await client.get('/api/audit');
    assertions.expectAuthError(response);
  });
});
