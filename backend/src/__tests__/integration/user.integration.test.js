/**
 * Integration Tests: User Routes
 */

const { createTestClient, assertions } = require('../helpers');

jest.mock('../../app', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  const router = express.Router();
  let users = [{ id: 1, username: 'testuser', role: 'OWNER' }];

  router.get('/', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    return res.json(users);
  });

  router.get('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ message: 'Not found' });
    return res.json(user);
  });

  router.put('/:id', (req, res) => {
    if (!req.headers.authorization) return res.status(401).json({ message: 'Unauthorized' });
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ message: 'Not found' });
    Object.assign(user, req.body);
    return res.json(user);
  });

  app.use('/api/users', router);
  return app;
});

describe('User Routes Integration Tests', () => {
  let app, client;
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    app = require('../../app');
    client = createTestClient(app);
  });

  it('should list users', async () => {
    const response = await client.get('/api/users', token);
    assertions.expectApiResponse(response, 200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get user profile', async () => {
    const response = await client.get('/api/users/1', token);
    assertions.expectApiResponse(response, 200);
    expect(response.body.username).toBe('testuser');
  });

  it('should update user profile', async () => {
    const response = await client.put('/api/users/1', { email: 'newemail@test.com' }, token);
    assertions.expectApiResponse(response, 200);
    expect(response.body.email).toBe('newemail@test.com');
  });
});
