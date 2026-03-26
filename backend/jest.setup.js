/**
 * Jest Setup File
 * Configure test environment, globals, and setup/teardown hooks
 */

require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/infosys_test?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';

// Increase test timeout for database operations
jest.setTimeout(10000);

// Suppress console logs during tests (optional)
// global.console.log = jest.fn();
// global.console.error = jest.fn();
// global.console.warn = jest.fn();

// Mock timers if needed
// jest.useFakeTimers();

// Global test utilities
global.testUtils = {
  /**
   * Delay execution (useful for async operations)
   */
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate test data helpers
   */
  generateTestUser: () => ({
    username: `test_user_${Date.now()}`,
    email: `test_${Date.now()}@test.com`,
    password: 'Test@123',
    role: 'user',
  }),

  generateTestCategory: () => ({
    name: `Category_${Date.now()}`,
    description: 'Test category',
  }),

  generateTestProduct: () => ({
    name: `Product_${Date.now()}`,
    category_id: 1,
    price: 99.99,
    stock: 10,
  }),
};

// Cleanup after all tests
afterAll(async () => {
  // Add any global cleanup here
  // Example: Close database connections, Redis clients, etc.
});
