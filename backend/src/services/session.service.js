/**
 * Redis Session Store Service
 * Handles user sessions across multiple backend instances
 * Stores JWT + session metadata for multi-instance consistency
 */

const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  lazyConnect: false,
});

redis.on('connect', () => {
  console.log('✓ Redis session store connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis session store error:', err.message);
});

/**
 * Create a new session for user
 * @param {string} userId - User ID
 * @param {Object} sessionData - Session metadata { role, email, permissions }
 * @param {number} expirySeconds - Session expiry (default 24 hours)
 * @returns {Promise<string>} Session token
 */
async function createSession(userId, sessionData, expirySeconds = 86400) {
  try {
    const sessionId = `session:${userId}:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sessionKey = `sess:${sessionId}`;

    const payload = {
      userId,
      sessionId,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      ...sessionData,
    };

    await redis.setex(
      sessionKey,
      expirySeconds,
      JSON.stringify(payload)
    );

    // Also maintain a user→session index for quick lookups
    await redis.sadd(`user_sessions:${userId}`, sessionId);
    await redis.expire(`user_sessions:${userId}`, expirySeconds);

    console.log(`✓ Session created for user ${userId}: ${sessionId.substring(0, 20)}...`);
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', error.message);
    throw error;
  }
}

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session data or null if expired
 */
async function getSession(sessionId) {
  try {
    if (!redis.connected) {
      console.warn('⚠ Redis unavailable, session store offline');
      return null;
    }

    const sessionKey = `sess:${sessionId}`;
    const data = await redis.get(sessionKey);

    if (data) {
      // Refresh TTL on access (sliding window)
      await redis.expire(sessionKey, 86400);
      
      const session = JSON.parse(data);
      session.lastActivityAt = Date.now();
      
      // Update last activity
      await redis.set(sessionKey, JSON.stringify(session), 'EX', 86400);

      return session;
    }

    return null;
  } catch (error) {
    console.error('Error retrieving session:', error.message);
    return null;
  }
}

/**
 * Update session metadata
 * @param {string} sessionId - Session ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success flag
 */
async function updateSession(sessionId, updates) {
  try {
    if (!redis.connected) {
      console.warn('⚠ Redis unavailable, cannot update session');
      return false;
    }

    const sessionKey = `sess:${sessionId}`;
    const data = await redis.get(sessionKey);

    if (!data) {
      return false;
    }

    const session = JSON.parse(data);
    const updated = { ...session, ...updates, lastActivityAt: Date.now() };

    await redis.setex(sessionKey, 86400, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error updating session:', error.message);
    return false;
  }
}

/**
 * Destroy session (logout)
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} Success flag
 */
async function destroySession(sessionId) {
  try {
    if (!redis.connected) {
      console.warn('⚠ Redis unavailable, cannot destroy session');
      return false;
    }

    const sessionKey = `sess:${sessionId}`;
    const data = await redis.get(sessionKey);

    if (data) {
      const session = JSON.parse(data);
      
      // Remove session key
      await redis.del(sessionKey);
      
      // Remove from user session index
      await redis.srem(`user_sessions:${session.userId}`, sessionId);

      console.log(`✓ Session destroyed: ${sessionId.substring(0, 20)}...`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error destroying session:', error.message);
    return false;
  }
}

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of session objects
 */
async function getUserSessions(userId) {
  try {
    if (!redis.connected) {
      return [];
    }

    const sessionIds = await redis.smembers(`user_sessions:${userId}`);
    const sessions = [];

    for (const sessionId of sessionIds) {
      const session = await getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  } catch (error) {
    console.error('Error retrieving user sessions:', error.message);
    return [];
  }
}

/**
 * Invalidate all sessions for a user (force logout on all devices)
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of sessions destroyed
 */
async function invalidateUserSessions(userId) {
  try {
    if (!redis.connected) {
      return 0;
    }

    const sessionIds = await redis.smembers(`user_sessions:${userId}`);
    let count = 0;

    for (const sessionId of sessionIds) {
      const destroyed = await destroySession(sessionId);
      if (destroyed) count++;
    }

    // Clear the user session index
    await redis.del(`user_sessions:${userId}`);

    console.log(`✓ Invalidated ${count} sessions for user ${userId}`);
    return count;
  } catch (error) {
    console.error('Error invalidating user sessions:', error.message);
    return 0;
  }
}

/**
 * Cache data with TTL
 * @param {string} key - Cache key
 * @param {*} value - Value to cache (any JSON-serializable object)
 * @param {number} ttlSeconds - Time to live in seconds (default 1 hour)
 * @returns {Promise<boolean>} Success flag
 */
async function cacheSet(key, value, ttlSeconds = 3600) {
  try {
    if (!redis.connected) {
      console.warn('⚠ Redis unavailable, cache set skipped');
      return false;
    }

    const cacheKey = `cache:${key}`;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    await redis.setex(cacheKey, ttlSeconds, serialized);
    return true;
  } catch (error) {
    console.error('Error setting cache:', error.message);
    return false;
  }
}

/**
 * Retrieve cached data
 * @param {string} key - Cache key
 * @returns {Promise<*|null>} Cached value or null
 */
async function cacheGet(key) {
  try {
    if (!redis.connected) {
      return null;
    }

    const cacheKey = `cache:${key}`;
    const data = await redis.get(cacheKey);

    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }

    return null;
  } catch (error) {
    console.error('Error retrieving cache:', error.message);
    return null;
  }
}

/**
 * Invalidate cache by key pattern
 * @param {string} pattern - Redis key pattern (e.g., "cache:categories:*")
 * @returns {Promise<number>} Count of keys deleted
 */
async function cacheInvalidate(pattern) {
  try {
    if (!redis.connected) {
      return 0;
    }

    const cachePattern = `${pattern}`;
    const keys = await redis.keys(cachePattern);

    if (keys.length > 0) {
      const deleted = await redis.del(...keys);
      console.log(`✓ Invalidated ${deleted} cache entries for pattern: ${pattern}`);
      return deleted;
    }

    return 0;
  } catch (error) {
    console.error('Error invalidating cache:', error.message);
    return 0;
  }
}

/**
 * Clear all cache entries
 * @returns {Promise<number>} Count of keys deleted
 */
async function cacheClearAll() {
  try {
    if (!redis.connected) {
      return 0;
    }

    const cacheKeys = await redis.keys('cache:*');
    if (cacheKeys.length > 0) {
      const deleted = await redis.del(...cacheKeys);
      console.log(`✓ Cleared ${deleted} cache entries`);
      return deleted;
    }

    return 0;
  } catch (error) {
    console.error('Error clearing cache:', error.message);
    return 0;
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats { sessions, cached_items, memory_used }
 */
async function getCacheStats() {
  try {
    if (!redis.connected) {
      return { sessions: 0, cached_items: 0, memory_used: 'unknown' };
    }

    const sessionKeys = await redis.keys('sess:*');
    const cacheKeys = await redis.keys('cache:*');
    const info = await redis.info('memory');

    const usedMemory = info.match(/used_memory_human:([^\r\n]+)/) ? 
      info.match(/used_memory_human:([^\r\n]+)/)[1] : 'unknown';

    return {
      sessions: sessionKeys.length,
      cached_items: cacheKeys.length,
      total_keys: sessionKeys.length + cacheKeys.length,
      memory_used: usedMemory,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error.message);
    return {};
  }
}

/**
 * Close Redis connection gracefully
 */
async function closeRedis() {
  try {
    await redis.quit();
    console.log('✓ Redis session store closed');
  } catch (error) {
    console.error('Error closing Redis:', error);
  }
}

module.exports = {
  // Session management
  createSession,
  getSession,
  updateSession,
  destroySession,
  getUserSessions,
  invalidateUserSessions,

  // Caching
  cacheSet,
  cacheGet,
  cacheInvalidate,
  cacheClearAll,

  // Utilities
  getCacheStats,
  closeRedis,
  getRedisClient: () => redis,
};
