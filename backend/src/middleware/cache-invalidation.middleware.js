/**
 * Cache Invalidation Middleware
 * Automatically invalidates relevant caches when data is modified
 * Decorates route handlers to manage cache lifecycle
 */

const { cacheInvalidate, cacheClearAll } = require('../services/session.service');

/**
 * Cache invalidation rules map
 * Maps operation types to cache patterns that should be cleared
 */
const invalidationRules = {
  // Category operations
  'POST:/api/categories': ['cache:categories:*', 'cache:brands:*', 'cache:models:*'],
  'PUT:/api/categories/:id': ['cache:categories:*', 'cache:brands:*', 'cache:models:*'],
  'DELETE:/api/categories/:id': ['cache:categories:*', 'cache:brands:*', 'cache:models:*'],

  // Brand operations
  'POST:/api/brands': ['cache:brands:*', 'cache:models:*'],
  'PUT:/api/brands/:id': ['cache:brands:*', 'cache:models:*'],
  'DELETE:/api/brands/:id': ['cache:brands:*', 'cache:models:*'],

  // Model operations
  'POST:/api/models': ['cache:models:*', 'cache:variants:*'],
  'PUT:/api/models/:id': ['cache:models:*', 'cache:variants:*'],
  'DELETE:/api/models/:id': ['cache:models:*', 'cache:variants:*'],

  // Variant operations
  'POST:/api/variants': ['cache:variants:*', 'cache:products:*'],
  'PUT:/api/variants/:id': ['cache:variants:*', 'cache:products:*'],
  'DELETE:/api/variants/:id': ['cache:variants:*', 'cache:products:*'],

  // Product operations
  'POST:/api/products': ['cache:products:*', 'cache:inventory:*'],
  'PUT:/api/products/:id': ['cache:products:*', 'cache:inventory:*'],
  'DELETE:/api/products/:id': ['cache:products:*', 'cache:inventory:*'],

  // Sales operations (impact inventory & reports)
  'POST:/api/sales': ['cache:inventory:*', 'cache:reports:*', 'cache:sales:*'],
  'PUT:/api/sales/:id': ['cache:inventory:*', 'cache:reports:*', 'cache:sales:*'],
  'DELETE:/api/sales/:id': ['cache:inventory:*', 'cache:reports:*', 'cache:sales:*'],

  // Expense operations (impact reports)
  'POST:/api/expenses': ['cache:reports:*', 'cache:expenses:*'],
  'PUT:/api/expenses/:id': ['cache:reports:*', 'cache:expenses:*'],
  'DELETE:/api/expenses/:id': ['cache:reports:*', 'cache:expenses:*'],

  // User operations (impact permissions cache)
  'POST:/api/users': ['cache:users:*', 'cache:permissions:*'],
  'PUT:/api/users/:id': ['cache:users:*', 'cache:permissions:*'],
  'DELETE:/api/users/:id': ['cache:users:*', 'cache:permissions:*'],
};

/**
 * Decorator to add cache invalidation to route handlers
 * @param {Function} handler - Original route handler
 * @param {string} cachePatterns - Cache patterns to invalidate (comma-separated)
 * @returns {Function} Wrapped handler with cache invalidation
 */
function withCacheInvalidation(handler, cachePatterns = []) {
  return async (req, res, next) => {
    // Wrap response.json to intercept success responses
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      // Invalidate caches only on successful responses (2xx)
      if (res.statusCode < 300 && cachePatterns.length > 0) {
        for (const pattern of cachePatterns) {
          await cacheInvalidate(pattern);
        }
        console.log(`[CACHE] Invalidated patterns for ${req.method} ${req.path}: ${cachePatterns.join(', ')}`);
      }

      return originalJson(data);
    };

    // Call original handler
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to apply cache invalidation rules to all routes
 * @returns {Function} Express middleware
 */
function cacheInvalidationMiddleware() {
  return (req, res, next) => {
    // Get route key (METHOD:PATH)
    const routeKey = `${req.method}:${req.path}`;
    
    // Check for exact match or pattern match
    let invalidationPatterns = [];
    
    // Exact match
    if (invalidationRules[routeKey]) {
      invalidationPatterns = invalidationRules[routeKey];
    } else {
      // Pattern match (e.g., POST:/api/categories/:id)
      for (const key in invalidationRules) {
        const keyPattern = key.replace(/:[^/]+/g, ':id');
        const reqPattern = routeKey.replace(/:[^/]+|\/\d+/g, ':id');
        
        if (keyPattern === reqPattern) {
          invalidationPatterns = invalidationRules[key];
          break;
        }
      }
    }

    // Store invalidation patterns for later use
    res.locals.cacheInvalidationPatterns = invalidationPatterns;

    next();
  };
}

/**
 * Apply automatic cache invalidation to response
 * Call this in route handlers after successful data modification
 * @param {Object} res - Express response object
 * @returns {void}
 */
async function invalidateCachesForResponse(res) {
  const patterns = res.locals?.cacheInvalidationPatterns || [];
  
  for (const pattern of patterns) {
    await cacheInvalidate(pattern);
  }
}

/**
 * Clear all application caches (use sparingly)
 * Usage: Call after major data changes or manual cache flush
 * @returns {Promise<number>} Count of cleared keys
 */
async function clearAllCaches() {
  console.log('[CACHE] Clearing all caches...');
  return await cacheClearAll();
}

module.exports = {
  withCacheInvalidation,
  cacheInvalidationMiddleware,
  invalidateCachesForResponse,
  clearAllCaches,
  invalidationRules,
};
