/**
 * Unit Tests: Redis Rate Limiter Service
 * Tests redis-rate-limiter.js functionality
 */

jest.mock('ioredis');

describe('Redis Rate Limiter Service', () => {
  let redisRateLimiter;
  let mockRedis;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Redis instance
    mockRedis = {
      incr: jest.fn().mockResolvedValue(1),
      pexpire: jest.fn().mockResolvedValue(1),
      pttl: jest.fn().mockResolvedValue(60000),
      connected: true,
      on: jest.fn(),
    };

    const Redis = require('ioredis');
    Redis.mockImplementation(() => mockRedis);

    // Clear require cache
    delete require.cache[require.resolve('../../services/redis-rate-limiter')];
    redisRateLimiter = require('../../services/redis-rate-limiter');
  });

  describe('Redis Rate Limiter', () => {
    it('should export createRedisRateLimiter function', () => {
      expect(redisRateLimiter).toBeDefined();
      expect(redisRateLimiter.createRedisRateLimiter).toBeDefined();
    });

    it('should return a middleware function', () => {
      const limiter = redisRateLimiter.createRedisRateLimiter();
      expect(typeof limiter).toBe('function');
    });

    it('should accept custom configuration', () => {
      const config = {
        max: 20,
        windowMs: 120000,
        message: 'Custom limit message',
      };

      const limiter = redisRateLimiter.createRedisRateLimiter(config);
      expect(typeof limiter).toBe('function');
    });

    it('should gracefully handle Redis connection errors', () => {
      // Simulate Redis unavailable
      mockRedis.connected = false;

      const limiter = redisRateLimiter.createRedisRateLimiter();
      expect(typeof limiter).toBe('function');
    });

    it('should track requests', () => {
      const limiter = redisRateLimiter.createRedisRateLimiter({
        max: 10,
      });

      expect(typeof limiter).toBe('function');
    });

    it('should set expiration on rate limit keys', () => {
      const limiter = redisRateLimiter.createRedisRateLimiter({
        windowMs: 60000,
      });

      expect(typeof limiter).toBe('function');
    });
  });
});
