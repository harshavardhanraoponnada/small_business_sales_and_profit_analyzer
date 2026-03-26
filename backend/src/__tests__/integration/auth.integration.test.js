/**
 * Integration Tests: Authentication API
 * Tests auth routes with database interactions
 */

const { createTestClient, factories, assertions } = require('../__tests__/helpers');

describe('Authentication API Integration Tests', () => {
  let app;
  let client;
  let prisma;

  beforeAll(() => {
    // Initialize app and test client
    app = require('../app');
    client = createTestClient(app);

    // Mock Prisma
    prisma = require('../services/prisma.service');
  });

  afterAll(async () => {
    // Cleanup
    jest.doMock('../services/prisma.service');
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if username is missing', async () => {
      const response = await client.post('/api/auth/login', {
        password: 'password123',
      });

      assertions.expectValidationError(response);
      expect(response.body.message).toMatch(/username|required/i);
    });

    it('should return 400 if password is missing', async () => {
      const response = await client.post('/api/auth/login', {
        username: 'testuser',
      });

      assertions.expectValidationError(response);
      expect(response.body.message).toMatch(/password|required/i);
    });

    it('should return 401 if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      const response = await client.post('/api/auth/login', {
        username: 'nonexistent',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/invalid credentials|not found/i);
    });

    it('should return JWT token on successful login', async () => {
      const mockUser = factories.user({
        username: 'testuser',
        password_hash: 'hashed_password',
      });

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(mockUser);
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValueOnce(true);

      const response = await client.post('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should create new user with valid data', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValueOnce(
        factories.user({ username: 'newuser' })
      );

      const response = await client.post('/api/auth/register', {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'SecurePass123!',
      });

      assertions.expectApiResponse(response, 201);
      expect(response.body.message).toMatch(/registered|created|success/i);
    });

    it('should return 400 if username already exists', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(
        factories.user()
      );

      const response = await client.post('/api/auth/register', {
        username: 'existinguser',
        email: 'new@test.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/already exists|username taken/i);
    });

    it('should validate password strength', async () => {
      const response = await client.post('/api/auth/register', {
        username: 'newuser',
        email: 'new@test.com',
        password: '123',  // Too weak
      });

      assertions.expectValidationError(response);
      expect(response.body.message).toMatch(/password|strength|requirements/i);
    });

    it('should validate email format', async () => {
      const response = await client.post('/api/auth/register', {
        username: 'newuser',
        email: 'invalid-email',
        password: 'SecurePass123!',
      });

      assertions.expectValidationError(response);
      expect(response.body.message).toMatch(/email|format|invalid/i);
    });
  });

  describe('Rate Limiting on Auth Endpoints', () => {
    it('should enforce login rate limit', async () => {
      const maxAttempts = 10;
      let response;

      // Make requests equal to the limit
      for (let i = 0; i <= maxAttempts; i++) {
        response = await client.post('/api/auth/login', {
          username: 'user',
          password: 'pass',
        });
      }

      // The last request should be rate limited
      expect(response.status).toBe(429);
      expect(response.body.message).toMatch(/too many|rate limit/i);
    });
  });

  describe('JWT Token Validation', () => {
    it('should reject requests without token', async () => {
      const response = await client.get('/api/user/profile');

      assertions.expectAuthError(response);
    });

    it('should reject requests with invalid token', async () => {
      const response = await client.get('/api/user/profile', 'invalid-token');

      assertions.expectAuthError(response);
    });

    it('should accept requests with valid token', async () => {
      const token = require('jsonwebtoken').sign(
        { userId: 1, username: 'testuser' },
        process.env.JWT_SECRET
      );

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(
        factories.user({ id: 1 })
      );

      const response = await client.get('/api/user/profile', token);

      // Should not return 401 if token is valid
      expect(response.status).not.toBe(401);
    });
  });
});
