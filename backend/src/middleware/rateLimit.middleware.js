const { createRedisRateLimiter } = require("../services/redis-rate-limiter");

// Export Redis-backed rate limiter (maintains backward compatibility with 'createRateLimiter' name)
module.exports = {
  createRateLimiter: createRedisRateLimiter,
};
