/**
 * Unit Tests: Redis Rate Limiter Service
 * Tests redis-rate-limiter.js functionality
 */

jest.mock('ioredis');

describe('Redis Rate Limiter Service', () => {
  let redisRateLimiter;
  let mockRedis;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock Redis client
    const Redis = require('ioredis');
    mockRedis = {
      incr: jest.fn(),
      pexpire: jest.fn(),
      pttl: jest.fn(),
      connected: true,
      on: jest.fn(),
    };

    Redis.mockImplementation(() => mockRedis);

    // Require the rate limiter after mocking Redis
    redisRateLimiter = require('../services/redis-rate-limiter');
  });

  afterEach(() => {
    jest.unmock('ioredis');
  });

  describe('createRedisRateLimiter', () => {
    it('should return a middleware function', () => {
      const limiter = redisRateLimiter.createRedisRateLimiter();
      expect(typeof limiter).toBe('function');
    });

    it('should allow requests within the limit', async () => {
      mockRedis.incr.mockResolvedValue(5);
      mockRedis.pexpire.mockResolvedValue(1);

      const limiter = redisRateLimiter.createRedisRateLimiter({
        max: 10,
        windowMs: 60000,
      });

      const req = {
        method: 'POST',
        baseUrl: '/api',
        path: '/auth/login',
        ip: '127.0.0.1',
        headers: {},
      };

      const res = {};
      const next = jest.fn();

      await limiter(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBeUndefined(); // Not set to 429
    });

    it('should block requests exceeding the limit', async () => {
      mockRedis.incr.mockResolvedValue(15);
      mockRedis.pttl.mockResolvedValue(45000);

      const limiter = redisRateLimiter.createRedisRateLimiter({
        max: 10,
        windowMs: 60000,
        message: 'Too many requests',
      });

      const req = {
        method: 'POST',
        baseUrl: '/api',
        path: '/auth/login',
        ip: '127.0.0.1',
        headers: {},
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
      };

      const next = jest.fn();

      await limiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalled();
    });

    it('should add rate limit headers to response', async () => {
      mockRedis.incr.mockResolvedValue(5);
      mockRedis.pexpire.mockResolvedValue(1);

      const limiter = redisRateLimiter.createRedisRateLimiter({
        max: 10,
        windowMs: 60000,
      });

      const req = {
        method: 'POST',
        baseUrl: '/api',
        path: '/auth/login',
        ip: '127.0.0.1',
        headers: {},
      };

      const res = {
        setHeader: jest.fn(),
      };

      const next = jest.fn();

      await limiter(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '5');
    });

    it('should handle Redis unavailability gracefully', async () => {
      const unavailableRateLimiter = redisRateLimiter.createRedisRateLimiter();

      const req = {
        method: 'POST',
        baseUrl: '/api',
        path: '/auth/login',
        ip: '127.0.0.1',
        headers: {},
      };

      const res = {
        setHeader: jest.fn(),
      };

      const next = jest.fn();

      // Mock Redis as disconnected
      Object.defineProperty(mockRedis, 'connected', { value: false });

      await unavailableRateLimiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should extract client IP from X-Forwarded-For header', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.pexpire.mockResolvedValue(1);

      const limiter = redisRateLimiter.createRedisRateLimiter();

      const req = {
        method: 'GET',
        baseUrl: '/api',
        path: '/categories',
        ip: '127.0.0.1',
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      };

      const res = {};
      const next = jest.fn();

      await limiter(req, res, next);

      const callArgs = mockRedis.incr.mock.calls[0][0];
      expect(callArgs).toContain('192.168.1.1');
    });
  });

  describe('Rate Limiter Configuration', () => {
    it('should use default configuration if not provided', async () => {
      mockRedis.incr.mockResolvedValue(1);

      const limiter = redisRateLimiter.createRedisRateLimiter();

      const req = {
        method: 'GET',
        baseUrl: '',
        path: '/test',
        ip: '127.0.0.1',
        headers: {},
      };

      const res = {};
      const next = jest.fn();

      await limiter(req, res, next);

      expect(mockRedis.incr).toHaveBeenCalled();
      expect(mockRedis.pexpire).toHaveBeenCalledWith(expect.any(String), 15 * 60 * 1000);
    });

    it('should use custom configuration', async () => {
      mockRedis.incr.mockResolvedValue(1);

      const customMs = 30000;
      const limiter = redisRateLimiter.createRedisRateLimiter({
        windowMs: customMs,
        max: 50,
      });

      const req = {
        method: 'GET',
        baseUrl: '',
        path: '/test',
        ip: '127.0.0.1',
        headers: {},
      };

      const res = {};
      const next = jest.fn();

      await limiter(req, res, next);

      expect(mockRedis.pexpire).toHaveBeenCalledWith(expect.any(String), customMs);
    });
  });
});
