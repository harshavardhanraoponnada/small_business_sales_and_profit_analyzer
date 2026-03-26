const Redis = require("ioredis");

// Initialize Redis client with connection pooling
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

// Handle Redis connection events
redis.on("connect", () => {
  console.log("✓ Redis rate limiter connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

redis.on("close", () => {
  console.warn("⚠ Redis connection closed");
});

/**
 * Get client IP from request
 * Supports X-Forwarded-For header (proxies) and direct connections
 */
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * Create a Redis-backed rate limiter
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 min)
 * @param {number} options.max - Max requests per window (default: 100)
 * @param {Function} options.keyGenerator - Custom key generator (default: client IP)
 * @param {string} options.message - Custom rate limit message
 * @param {boolean} options.skipSuccessfulRequests - Skip counting successful requests (default: false)
 * @param {boolean} options.skipFailedRequests - Skip counting failed requests (default: false)
 * @returns {Function} Express middleware
 */
function createRedisRateLimiter(options = {}) {
  const windowMs = Number(options.windowMs || 15 * 60 * 1000);
  const max = Number(options.max || 100);
  const keyGenerator = options.keyGenerator || ((req) => getClientIp(req));
  const message = options.message || "Too many requests. Please try again later.";
  const skipSuccessfulRequests = options.skipSuccessfulRequests || false;
  const skipFailedRequests = options.skipFailedRequests || false;

  return async (req, res, next) => {
    // Skip rate limiting if Redis is unavailable (graceful fallback)
    if (!redis.connected) {
      console.warn("⚠ Redis unavailable, allowing request (rate limiting disabled)");
      return next();
    }

    try {
      const key = keyGenerator(req);
      const redisKey = `rateLimit:${req.method}:${req.baseUrl || ""}:${req.path || ""}:${key}`;

      // Increment counter atomically
      const count = await redis.incr(redisKey);

      // Set expiration on first request
      if (count === 1) {
        await redis.pexpire(redisKey, windowMs);
      }

      // Store metadata for response headers
      req.rateLimit = {
        limit: max,
        current: count,
        remaining: Math.max(0, max - count),
      };

      // Check if limit exceeded
      if (count > max) {
        // Get remaining time in seconds
        const ttl = await redis.pttl(redisKey);
        const retryAfterSeconds = Math.max(1, Math.ceil(ttl / 1000));

        res.setHeader("Retry-After", String(retryAfterSeconds));
        res.setHeader("X-RateLimit-Limit", String(max));
        res.setHeader("X-RateLimit-Remaining", "0");
        res.setHeader("X-RateLimit-Reset", String(Date.now() + ttl));

        return res.status(429).json({
          message,
          retryAfter: retryAfterSeconds,
        });
      }

      // Add rate limit headers to response
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", String(req.rateLimit.remaining));

      // Call hook after rate limiting, before next middleware
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function (data) {
          const skip =
            (skipSuccessfulRequests && res.statusCode < 400) ||
            (skipFailedRequests && res.statusCode >= 400);

          if (skip) {
            // Decrement counter if we should skip this request
            redis.decr(redisKey).catch((err) =>
              console.error("Error decrementing rate limit counter:", err)
            );
          }

          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      console.error("Redis rate limiter error:", error.message);
      // On error, allow the request but log the issue
      next();
    }
  };
}

/**
 * Gracefully close Redis connection
 */
async function closeRedis() {
  if (redis) {
    try {
      await redis.quit();
      console.log("✓ Redis connection closed gracefully");
    } catch (error) {
      console.error("Error closing Redis connection:", error);
    }
  }
}

module.exports = {
  createRedisRateLimiter,
  getRedisClient: () => redis,
  closeRedis,
};
