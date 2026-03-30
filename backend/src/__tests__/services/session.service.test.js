/**
 * Session Service Tests
 * Tests Redis session management and caching functionality
 */

// Mock Redis BEFORE requiring the service
jest.mock('ioredis');

let sessionService;
let mockRedisInstance;

describe('Session Service', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    // Setup Redis mock with all required methods
    mockRedisInstance = {
      connected: true,
      setex: jest.fn().mockResolvedValue('OK'),
      sadd: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      srem: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
      keys: jest.fn().mockResolvedValue([]),
      info: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    };

    const Redis = require('ioredis');
    Redis.mockImplementation(() => mockRedisInstance);
    
    // NOW require the service after Redis is properly mocked
    sessionService = require('../../services/session.service');
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      const userId = 'user123';
      const sessionData = { role: 'ADMIN', email: 'user@example.com' };

      const sessionId = await sessionService.createSession(userId, sessionData);

      expect(sessionId).toContain('session:user123');
      expect(mockRedisInstance.setex).toHaveBeenCalled();
      expect(mockRedisInstance.sadd).toHaveBeenCalledWith(
        'user_sessions:user123',
        expect.any(String)
      );
    });

    it('should use custom expiry seconds', async () => {
      const userId = 'user123';
      const sessionData = { role: 'USER' };
      const expirySeconds = 3600;

      await sessionService.createSession(userId, sessionData, expirySeconds);

      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        expect.any(String),
        expirySeconds,
        expect.any(String)
      );
    });

    it('should handle Redis errors during session creation', async () => {
      mockRedisInstance.setex.mockRejectedValueOnce(new Error('Redis connection failed'));

      await expect(sessionService.createSession('user123', {}))
        .rejects
        .toThrow('Redis connection failed');
    });
  });

  describe('getSession', () => {
    it('should retrieve session data successfully', async () => {
      const sessionData = {
        userId: 'user123',
        sessionId: 'session:abc',
        role: 'ADMIN',
        createdAt: 1234567890,
      };

      mockRedisInstance.get.mockResolvedValueOnce(JSON.stringify(sessionData));

      const result = await sessionService.getSession('session:abc');

      expect(result).toEqual(expect.objectContaining(sessionData));
      expect(mockRedisInstance.expire).toHaveBeenCalledWith('sess:session:abc', 86400);
    });

    it('should return null when session not found', async () => {
      mockRedisInstance.get.mockResolvedValueOnce(null);

      const result = await sessionService.getSession('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when Redis is disconnected', async () => {
      mockRedisInstance.connected = false;

      const result = await sessionService.getSession('session:abc');

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await sessionService.getSession('session:abc');

      expect(result).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session metadata successfully', async () => {
      const sessionData = {
        userId: 'user123',
        sessionId: 'session:abc',
        role: 'USER',
      };

      mockRedisInstance.get.mockResolvedValueOnce(JSON.stringify(sessionData));

      const result = await sessionService.updateSession('session:abc', { role: 'ADMIN' });

      expect(result).toBe(true);
      expect(mockRedisInstance.setex).toHaveBeenCalled();
    });

    it('should return false when session not found', async () => {
      mockRedisInstance.get.mockResolvedValueOnce(null);

      const result = await sessionService.updateSession('nonexistent', {});

      expect(result).toBe(false);
    });

    it('should return false when Redis is disconnected', async () => {
      mockRedisInstance.connected = false;

      const result = await sessionService.updateSession('session:abc', { role: 'ADMIN' });

      expect(result).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await sessionService.updateSession('session:abc', {});

      expect(result).toBe(false);
    });
  });

  describe('destroySession', () => {
    it('should destroy session successfully', async () => {
      const sessionData = {
        userId: 'user123',
        sessionId: 'session:abc',
      };

      mockRedisInstance.get.mockResolvedValueOnce(JSON.stringify(sessionData));

      const result = await sessionService.destroySession('session:abc');

      expect(result).toBe(true);
      expect(mockRedisInstance.del).toHaveBeenCalledWith('sess:session:abc');
      expect(mockRedisInstance.srem).toHaveBeenCalledWith('user_sessions:user123', 'session:abc');
    });

    it('should return false when session not found', async () => {
      mockRedisInstance.get.mockResolvedValueOnce(null);

      const result = await sessionService.destroySession('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when Redis is disconnected', async () => {
      mockRedisInstance.connected = false;

      const result = await sessionService.destroySession('session:abc');

      expect(result).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await sessionService.destroySession('session:abc');

      expect(result).toBe(false);
    });
  });

  describe('getUserSessions', () => {
    it('should retrieve all sessions for a user', async () => {
      const sessionIds = ['session:1', 'session:2'];
      mockRedisInstance.smembers.mockResolvedValueOnce(sessionIds);

      const sessionData1 = { userId: 'user123', sessionId: 'session:1' };
      const sessionData2 = { userId: 'user123', sessionId: 'session:2' };

      mockRedisInstance.get
        .mockResolvedValueOnce(JSON.stringify(sessionData1))
        .mockResolvedValueOnce(JSON.stringify(sessionData2));

      const results = await sessionService.getUserSessions('user123');

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(expect.objectContaining(sessionData1));
      expect(results[1]).toEqual(expect.objectContaining(sessionData2));
    });

    it('should return empty array when no sessions found', async () => {
      mockRedisInstance.smembers.mockResolvedValueOnce([]);

      const results = await sessionService.getUserSessions('user123');

      expect(results).toEqual([]);
    });

    it('should return empty array when Redis is disconnected', async () => {
      mockRedisInstance.connected = false;

      const results = await sessionService.getUserSessions('user123');

      expect(results).toEqual([]);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.smembers.mockRejectedValueOnce(new Error('Redis error'));

      const results = await sessionService.getUserSessions('user123');

      expect(results).toEqual([]);
    });
  });

  describe('invalidateUserSessions', () => {
    it('should invalidate all sessions for a user', async () => {
      const sessionIds = ['session:1', 'session:2'];
      mockRedisInstance.smembers.mockResolvedValueOnce(sessionIds);

      const sessionData1 = { userId: 'user123', sessionId: 'session:1' };
      const sessionData2 = { userId: 'user123', sessionId: 'session:2' };

      mockRedisInstance.get
        .mockResolvedValueOnce(JSON.stringify(sessionData1))
        .mockResolvedValueOnce(JSON.stringify(sessionData2))
        .mockResolvedValueOnce(JSON.stringify(sessionData1))
        .mockResolvedValueOnce(JSON.stringify(sessionData2));

      const count = await sessionService.invalidateUserSessions('user123');

      expect(count).toBe(2);
      expect(mockRedisInstance.del).toHaveBeenCalledWith('user_sessions:user123');
    });

    it('should return 0 when no sessions exist', async () => {
      mockRedisInstance.smembers.mockResolvedValueOnce([]);

      const count = await sessionService.invalidateUserSessions('user123');

      expect(count).toBe(0);
    });

    it('should return 0 when Redis is disconnected', async () => {
      mockRedisInstance.connected = false;

      const count = await sessionService.invalidateUserSessions('user123');

      expect(count).toBe(0);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.smembers.mockRejectedValueOnce(new Error('Redis error'));

      const count = await sessionService.invalidateUserSessions('user123');

      expect(count).toBe(0);
    });
  });

  describe('cacheSet', () => {
    it('should cache data with default TTL', async () => {
      const result = await sessionService.cacheSet('mykey', { data: 'value' });

      expect(result).toBe(true);
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'cache:mykey',
        3600,
        expect.any(String)
      );
    });

    it('should cache data with custom TTL', async () => {
      const result = await sessionService.cacheSet('mykey', { data: 'value' }, 7200);

      expect(result).toBe(true);
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'cache:mykey',
        7200,
        expect.any(String)
      );
    });

    it('should cache string values directly', async () => {
      const result = await sessionService.cacheSet('mykey', 'string value');

      expect(result).toBe(true);
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'cache:mykey',
        3600,
        'string value'
      );
    });

    it('should return false when Redis is disconnected', async () => {
      mockRedisInstance.connected = false;

      const result = await sessionService.cacheSet('mykey', { data: 'value' });

      expect(result).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.setex.mockRejectedValueOnce(new Error('Redis error'));

      const result = await sessionService.cacheSet('mykey', { data: 'value' });

      expect(result).toBe(false);
    });
  });

  describe('cacheGet', () => {
    it('should retrieve cached data as object', async () => {
      const cachedData = { key: 'value' };
      mockRedisInstance.get.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await sessionService.cacheGet('mykey');

      expect(result).toEqual(cachedData);
    });

    it('should retrieve cached data as string', async () => {
      mockRedisInstance.get.mockResolvedValueOnce('string value');

      const result = await sessionService.cacheGet('mykey');

      expect(result).toBe('string value');
    });

    it('should return null when cache not found', async () => {
      mockRedisInstance.get.mockResolvedValueOnce(null);

      const result = await sessionService.cacheGet('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when Redis is disconnected', async () => {
      mockRedisInstance.connected = false;

      const result = await sessionService.cacheGet('mykey');

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await sessionService.cacheGet('mykey');

      expect(result).toBeNull();
    });
  });

  describe('cacheInvalidate', () => {
    it('should invalidate cache by pattern', async () => {
      mockRedisInstance.keys.mockResolvedValueOnce(['cache:categories:1', 'cache:categories:2']);

      const count = await sessionService.cacheInvalidate('cache:categories:*');

      expect(count).toBe(1); // mock del returns 1
      expect(mockRedisInstance.keys).toHaveBeenCalledWith('cache:categories:*');
      expect(mockRedisInstance.del).toHaveBeenCalledWith('cache:categories:1', 'cache:categories:2');
    });

    it('should return 0 when no keys match pattern', async () => {
      mockRedisInstance.keys.mockResolvedValueOnce([]);

      const count = await sessionService.cacheInvalidate('cache:nonexistent:*');

      expect(count).toBe(0);
    });

    it('should return 0 when Redis is disconnected', async () => {
      mockRedisInstance.connected = false;

      const count = await sessionService.cacheInvalidate('cache:*');

      expect(count).toBe(0);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.keys.mockRejectedValueOnce(new Error('Redis error'));

      const count = await sessionService.cacheInvalidate('cache:*');

      expect(count).toBe(0);
    });
  });

  describe('cacheClearAll', () => {
    it('should clear all cache entries', async () => {
      mockRedisInstance.keys.mockResolvedValueOnce(['cache:1', 'cache:2', 'cache:3']);

      const count = await sessionService.cacheClearAll();

      expect(count).toBe(1); // mock del returns 1
      expect(mockRedisInstance.keys).toHaveBeenCalledWith('cache:*');
      expect(mockRedisInstance.del).toHaveBeenCalledWith('cache:1', 'cache:2', 'cache:3');
    });

    it('should return 0 when no cache entries exist', async () => {
      mockRedisInstance.keys.mockResolvedValueOnce([]);

      const count = await sessionService.cacheClearAll();

      expect(count).toBe(0);
    });

    it('should return 0 when Redis is disconnected', async () => {
      mockRedisInstance.connected = false;

      const count = await sessionService.cacheClearAll();

      expect(count).toBe(0);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.keys.mockRejectedValueOnce(new Error('Redis error'));

      const count = await sessionService.cacheClearAll();

      expect(count).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      mockRedisInstance.keys
        .mockResolvedValueOnce(['sess:1', 'sess:2']) // session keys
        .mockResolvedValueOnce(['cache:1', 'cache:2', 'cache:3']); // cache keys

      const memoryInfo = 'used_memory_human:5M\r\nused_memory_peak_human:6M';
      mockRedisInstance.info.mockResolvedValueOnce(memoryInfo);

      const stats = await sessionService.getCacheStats();

      expect(stats.sessions).toBe(2);
      expect(stats.cached_items).toBe(3);
      expect(stats.total_keys).toBe(5);
      expect(stats.memory_used).toBe('5M');
    });

    it('should return default stats when Redis is disconnected', async () => {
      mockRedisInstance.connected = false;

      const stats = await sessionService.getCacheStats();

      expect(stats).toEqual({
        sessions: 0,
        cached_items: 0,
        memory_used: 'unknown',
      });
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.keys.mockRejectedValueOnce(new Error('Redis error'));

      const stats = await sessionService.getCacheStats();

      expect(stats).toEqual({});
    });
  });

  describe('closeRedis', () => {
    it('should close Redis connection gracefully', async () => {
      await sessionService.closeRedis();

      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });

    it('should handle Redis errors during close', async () => {
      mockRedisInstance.quit.mockRejectedValueOnce(new Error('Close error'));

      await expect(sessionService.closeRedis()).resolves.not.toThrow();
    });
  });

  describe('getRedisClient', () => {
    it('should return Redis client instance', () => {
      const client = sessionService.getRedisClient();

      expect(client).toBeDefined();
      expect(client.setex).toBeDefined();
      expect(client.connected).toBe(true);
    });
  });
});
