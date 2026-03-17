const buckets = new Map();

function cleanupExpired(now) {
  for (const [key, value] of buckets.entries()) {
    if (value.expiresAt <= now) {
      buckets.delete(key);
    }
  }
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function createRateLimiter(options = {}) {
  const windowMs = Number(options.windowMs || 15 * 60 * 1000);
  const max = Number(options.max || 100);
  const keyGenerator = options.keyGenerator || ((req) => getClientIp(req));
  const message = options.message || "Too many requests. Please try again later.";

  return (req, res, next) => {
    const now = Date.now();
    cleanupExpired(now);

    const key = keyGenerator(req);
    const bucketKey = `${req.method}:${req.baseUrl || ""}:${req.path || ""}:${key}`;
    const bucket = buckets.get(bucketKey);

    if (!bucket || bucket.expiresAt <= now) {
      buckets.set(bucketKey, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ message });
    }

    bucket.count += 1;
    return next();
  };
}

module.exports = {
  createRateLimiter
};
