/**
 * Test Utilities & Helpers
 * Common functions for testing Express API
 */

const request = require('supertest');

/**
 * Create API test client
 * @param {Express.Application} app - Express app instance
 * @returns {Object} Test client with helpers
 */
function createTestClient(app) {
  return {
    /**
     * Make authenticated request
     * @param {string} method - HTTP method
     * @param {string} path - Request path
     * @param {string} token - JWT token (optional)
     * @param {Object} body - Request body (optional)
     * @returns {Promise<Object>} Response
     */
    async request(method, path, token, body) {
      let req = request(app)[method.toLowerCase()](path);

      if (token) {
        req = req.set('Authorization', `Bearer ${token}`);
      }

      if (body) {
        req = req.send(body);
      }

      return req;
    },

    /**
     * GET request
     */
    async get(path, token) {
      return this.request('GET', path, token);
    },

    /**
     * POST request
     */
    async post(path, body, token) {
      return this.request('POST', path, token, body);
    },

    /**
     * PUT request
     */
    async put(path, body, token) {
      return this.request('PUT', path, token, body);
    },

    /**
     * DELETE request
     */
    async delete(path, token) {
      return this.request('DELETE', path, token);
    },

    /**
     * Login user and return token
     */
    async login(username, password) {
      const response = await this.post('/api/auth/login', { username, password });
      
      if (response.status === 200 && response.body.token) {
        return response.body.token;
      }

      throw new Error(`Login failed: ${response.body.message}`);
    },
  };
}

/**
 * Mock Prisma client for unit tests
 */
function createMockPrismaClient() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    brand: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sale: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    expense: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };
}

/**
 * Test data factories
 */
const factories = {
  user: (overrides = {}) => ({
    id: 1,
    username: 'testuser',
    email: 'test@test.com',
    password_hash: 'hashed_password',
    role: 'user',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  category: (overrides = {}) => ({
    id: 1,
    name: 'Electronics',
    description: 'Electronic devices',
    is_deleted: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  brand: (overrides = {}) => ({
    id: 1,
    name:  'Samsung',
    category_id: 1,
    description: 'Samsung products',
    is_deleted: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  product: (overrides = {}) => ({
    id: 1,
    name: 'Galaxy S21',
    category_id: 1,
    description: 'Smartphone',
    price: 999.99,
    stock: 50,
    sku: 'SKU123',
    is_deleted: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  sale: (overrides = {}) => ({
    id: 1,
    user_id: 1,
    product_id: 1,
    quantity: 1,
    total_amount: 999.99,
    status: 'completed',
    invoice_path: '/uploads/invoices/INV001.pdf',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),

  expense: (overrides = {}) => ({
    id: 1,
    user_id: 1,
    category: 'office',
    amount: 50.00,
    description: 'Office supplies',
    receipt_path: '/uploads/bills/RECEIPT001.pdf',
    is_deleted: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }),
};

/**
 * Assertion helpers
 */
const assertions = {
  /**
   * Assert API response structure
   */
  expectApiResponse: (response, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
  },

  /**
   * Assert error response
   */
  expectErrorResponse: (response, expectedStatus = 400) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.message).toBeDefined();
  },

  /**
   * Assert validation error
   */
  expectValidationError: (response) => {
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/validation|required|invalid/i);
  },

  /**
   * Assert auth error (401)
   */
  expectAuthError: (response) => {
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/unauthorized|token|auth/i);
  },

  /**
   * Assert forbidden error (403)
   */
  expectForbiddenError: (response) => {
    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/forbidden|permission|role/i);
  },

  /**
   * Assert not found error (404)
   */
  expectNotFoundError: (response) => {
    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found|does not exist/i);
  },
};

module.exports = {
  createTestClient,
  createMockPrismaClient,
  factories,
  assertions,
};
