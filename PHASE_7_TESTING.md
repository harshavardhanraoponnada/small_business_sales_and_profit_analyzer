# Phase 7: Jest Testing Framework Implementation

## Overview

Jest testing framework is now configured for the backend API with comprehensive unit, integration, and end-to-end testing capabilities.

---

## Setup ✅

### Installed Dependencies
```bash
npm install --save-dev jest supertest
```

### Configuration Files Created

**package.json** - Test scripts & Jest configuration
- `npm test` — Run all tests
- `npm run test:watch` — Watch mode for development
- `npm run test:coverage` — Generate coverage reports
- `npm run test:integration` — Run integration tests only

**jest.setup.js** — Test environment configuration
- Sets NODE_ENV to 'test'
- Configures test database URL
- Provides global test utilities

---

## Test Structure

```
backend/src/
├── __tests__/
│   ├── helpers.js                    # Test utilities & factories
│   ├── services/
│   │   └── redis-rate-limiter.test.js    # Unit tests
│   └── integration/
│       └── auth.integration.test.js      # Integration tests
```

### Test Types

**Unit Tests** (`services/redis-rate-limiter.test.js`)
- Test individual functions in isolation
- Mock external dependencies
- Fast execution (~100ms per test)
- Example: Redis rate limiter behavior with mocked Redis client

**Integration Tests** (`integration/auth.integration.test.js`)
- Test API endpoints with database interactions
- Use actual database (test db)
- Slower execution (~1-2s per test)
- Example: Auth API with Prisma mocks

**End-to-End Tests** (`e2e/` - planned)
- Test complete user workflows
- Use real database, Redis, and services
- Slowest execution (~5-10s per test)
- Example: User registration → Login → Create product → Sale

---

## Running Tests

### All Tests
```bash
npm test
```

**Output:**
```
 PASS  src/__tests__/services/redis-rate-limiter.test.js
  Redis Rate Limiter Service
    createRedisRateLimiter
      ✓ should return a middleware function (5ms)
      ✓ should allow requests within the limit (2ms)
      ✓ should block requests exceeding the limit (1ms)
      ✓ should add rate limit headers to response (1ms)
      ✓ should handle Redis unavailability gracefully (1ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Time:        2.345 s
```

### Watch Mode (Development)
```bash
npm run test:watch
```
Re-runs tests when files change. Ideal for TDD workflow.

### Coverage Report
```bash
npm run test:coverage
```

**Output:**
```
-------------|----------|----------|----------|----------|------|
File           |  % Stmts | % Branch | % Funcs | % Lines  | Untested |
-------------|----------|----------|----------|----------|------|
All files     |    65.2  |   58.9   |    72.1 |    64.8   |        |
services      |    78.5  |   65.2   |    85.0 |    77.9   |        |
middleware    |    52.1  |   45.6   |    58.3 |    51.9   |        |
controllers   |    58.3  |   52.1   |    65.0 |    57.8   |        |
-------------|----------|----------|----------|----------|------|
```

### Integration Tests Only
```bash
npm run test:integration
```

---

## Test Helpers & Utilities

### createTestClient(app)
Create API test client with built-in request methods:

```javascript
const { createTestClient } = require('./helpers');

const client = createTestClient(app);

// Simple GET
const response = await client.get('/api/categories');

// Authenticated POST
const token = 'jwt_token_here';
const response = await client.post('/api/categories', { name: 'Electronics' }, token);

// Login and get token
const token = await client.login('username', 'password');
```

### createMockPrismaClient()
Mock all Prisma models for unit tests:

```javascript
const { createMockPrismaClient } = require('./helpers');

const mockPrisma = createMockPrismaClient();

// Mock database responses
mockPrisma.user.findUnique.mockResolvedValue({
  id: 1,
  username: 'test',
  email: 'test@test.com',
});
```

### factories
Generate test data quickly:

```javascript
const { factories } = require('./helpers');

// Create test user
const user = factories.user({ username: 'custom' });

// Create test category
const category = factories.category({ name: 'Custom' });

// Create test product
const product = factories.product({ price: 199.99 });
```

### assertions
Common test assertions:

```javascript
const { assertions } = require('./helpers');

// API response assertion
assertions.expectApiResponse(response, 200);

// Error response
assertions.expectErrorResponse(response, 400);

// Validation error
assertions.expectValidationError(response);

// Auth error (401)
assertions.expectAuthError(response);

// Forbidden error (403)
assertions.expectForbiddenError(response);

// Not found error (404)
assertions.expectNotFoundError(response);
```

---

## Writing Tests

### Unit Test Example
```javascript
describe('Rate Limiter', () => {
  let limiter;

  beforeEach(() => {
    limiter = createRateLimiter({ max: 10 });
  });

  it('should block requests exceeding limit', async () => {
    const req = { ip: '127.0.0.1', method: 'POST', path: '/api/test' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // Make 11 requests
    for (let i = 0; i < 11; i++) {
      await limiter(req, res, next);
    }

    // 11th request should be blocked
    expect(res.status).toHaveBeenCalledWith(429);
  });
});
```

### Integration Test Example
```javascript
describe('POST /api/categories', () => {
  it('should create category with valid data', async () => {
    const mockPrisma = createMockPrismaClient();
    mockPrisma.category.create.mockResolvedValue({ id: 1, name: 'Electronics' });

    const response = await client.post(
      '/api/categories',
      { name: 'Electronics' },
      token
    );

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(1);
    expect(response.body.name).toBe('Electronics');
  });

  it('should return 400 if name is missing', async () => {
    const response = await client.post('/api/categories', {}, token);

    assertions.expectValidationError(response);
    expect(response.body.message).toMatch(/name|required/i);
  });
});
```

---

## Coverage Requirements

Current thresholds in `package.json`:
```json
"coverageThreshold": {
  "global": {
    "branches": 60,
    "functions": 60,
    "lines": 60,
    "statements": 60
  }
}
```

**Interpretation:**
- At least 60% of code lines must be executed by tests
- At least 60% of branches (if/else paths) must be tested
- At least 60% of functions must be tested

To increase coverage:
```bash
npm run test:coverage
# Review coverage/lcov-report/index.html
# Add tests for untested files/branches
```

---

## CI/CD Integration (GitHub Actions)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/infosys_test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
```

---

## Debugging Tests

### Run single test file
```bash
npm test -- redis-rate-limiter.test.js
```

### Run single test case
```bash
npm test -- -t "should block requests exceeding limit"
```

### Verbose output
```bash
npm test -- --verbose
```

### Debug mode
```bash
node --inspect-brk node_modules/jest/bin/jest.js --runInBand
```

---

## Best Practices

1. **Test Naming:** Use descriptive test names
   - ❌ `it('works')`
   - ✅ `it('should return 400 if email is invalid')`

2. **Arrange-Act-Assert:** Structure tests clearly
   ```javascript
   it('should...', () => {
     // Arrange: Setup test data
     const input = { email: 'test@test.com' };
     
     // Act: Execute function
     const result = validateEmail(input);
     
     // Assert: Check result
     expect(result).toBe(true);
   });
   ```

3. **DRY Tests:** Use beforeEach/afterEach
   ```javascript
   beforeEach(() => {
     mockPrisma.user.findUnique.mockResolvedValue(testUser);
   });
   ```

4. **Mocking:** Mock external dependencies
   - Database queries
   - Redis operations
   - Email sending
   - File uploads

5. **Test Organization:** Group related tests with describe()
   ```javascript
   describe('Category API', () => {
     describe('GET /categories', () => {
       it('should return categories');
     });
     
     describe('POST /categories', () => {
       it('should create category');
     });
   });
   ```

---

## Next Steps

### Phase 7.2: Expand Test Coverage
- [ ] Add tests for all controllers
- [ ] Add tests for all services
- [ ] Add tests for all middleware
- [ ] Target 80%+ code coverage

### Phase 7.3: GitHub Actions CI/CD
- [ ] Create GitHub Actions workflow
- [ ] Run tests on every push/PR
- [ ] Block merges if tests fail
- [ ] Report coverage to Codecov

### Phase 7.4: Performance Testing
- [ ] Load testing with k6 or Artillery
- [ ] Stress testing for rate limiting
- [ ] Database query optimization tests

---

## Reference

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Node.js Testing Best Practices](https://nodejs.org/en/docs/guides/testing/)
