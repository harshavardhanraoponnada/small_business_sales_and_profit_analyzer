/**
 * Cache Invalidation Middleware Tests
 * Tests cache invalidation logic and route handler decoration
 */

// Mock Redis before importing session service
jest.mock('ioredis');

// Mock session service exports
jest.mock('../../services/session.service', () => ({
  cacheInvalidate: jest.fn().mockResolvedValue(1),
  cacheClearAll: jest.fn().mockResolvedValue(5),
}));

const {
  withCacheInvalidation,
  cacheInvalidationMiddleware,
  invalidateCachesForResponse,
  clearAllCaches,
} = require('../../middleware/cache-invalidation.middleware');
const { cacheInvalidate, cacheClearAll } = require('../../services/session.service');

describe('Cache Invalidation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheInvalidate.mockResolvedValue(1);
    cacheClearAll.mockResolvedValue(5);
  });

  describe('withCacheInvalidation', () => {
    it('should return a function', () => {
      const handler = jest.fn();
      const decorated = withCacheInvalidation(handler, []);
      expect(typeof decorated).toBe('function');
    });

    it('should call the original handler', async () => {
      const handler = jest.fn(async (req, res, next) => {
        res.statusCode = 200;
        res.json({ success: true });
      });
      const decorated = withCacheInvalidation(handler, []);

      const req = { method: 'POST', path: '/api/users' };
      const res = {
        statusCode: 200,
        json: jest.fn().mockReturnValue({}),
      };
      const next = jest.fn();

      await decorated(req, res, next);

      expect(handler).toHaveBeenCalledWith(req, res, next);
    });

    it('should invalidate caches on successful response', async () => {
      const handler = jest.fn(async (req, res, next) => {
        res.statusCode = 201;
        res.json({ id: 1, success: true });
      });
      const patterns = ['cache:users:*', 'cache:permissions:*'];
      const decorated = withCacheInvalidation(handler, patterns);

      const req = { method: 'POST', path: '/api/users' };
      const res = {
        statusCode: 201,
        json: jest.fn(function (data) {
          return data;
        }),
      };
      const next = jest.fn();

      await decorated(req, res, next);

      expect(cacheInvalidate).toHaveBeenCalledWith('cache:users:*');
      expect(cacheInvalidate).toHaveBeenCalledWith('cache:permissions:*');
    });

    it('should not invalidate caches if no patterns provided', async () => {
      const handler = jest.fn(async (req, res, next) => {
        res.statusCode = 200;
        res.json({ success: true });
      });
      const decorated = withCacheInvalidation(handler, []);

      const req = { method: 'GET', path: '/api/users' };
      const res = {
        statusCode: 200,
        json: jest.fn().mockReturnValue({}),
      };
      const next = jest.fn();

      await decorated(req, res, next);

      expect(cacheInvalidate).not.toHaveBeenCalled();
    });

    it('should not invalidate caches on error status codes', async () => {
      const handler = jest.fn(async (req, res, next) => {
        res.statusCode = 400;
        res.json({ error: 'Bad request' });
      });
      const patterns = ['cache:users:*'];
      const decorated = withCacheInvalidation(handler, patterns);

      const req = { method: 'POST', path: '/api/users' };
      const res = {
        statusCode: 400,
        json: jest.fn().mockReturnValue({}),
      };
      const next = jest.fn();

      await decorated(req, res, next);

      expect(cacheInvalidate).not.toHaveBeenCalled();
    });

    it('should handle handler errors with next()', async () => {
      const error = new Error('Handler failed');
      const handler = jest.fn(async (req, res, next) => {
        throw error;
      });
      const decorated = withCacheInvalidation(handler, []);

      const req = { method: 'POST', path: '/api/users' };
      const res = { json: jest.fn().mockReturnValue({}) };
      const next = jest.fn();

      await decorated(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should preserve original response.json behavior', async () => {
      const handler = jest.fn(async (req, res, next) => {
        res.statusCode = 200;
        res.json({ data: 'test' });
      });
      const decorated = withCacheInvalidation(handler, []);

      const req = { method: 'GET', path: '/api/test' };
      const originalJson = jest.fn().mockReturnValue({ data: 'test' });
      const res = {
        statusCode: 200,
        json: originalJson,
      };
      const next = jest.fn();

      await decorated(req, res, next);

      expect(originalJson).toHaveBeenCalled();
    });
  });

  describe('cacheInvalidationMiddleware', () => {
    it('should return a middleware function', () => {
      const middleware = cacheInvalidationMiddleware();
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // (req, res, next)
    });

    it('should call next()', (done) => {
      const middleware = cacheInvalidationMiddleware();
      const req = { method: 'GET', path: '/api/test' };
      const res = { locals: {} };
      const next = jest.fn(() => done());

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should store invalidation patterns for exact route match', (done) => {
      const middleware = cacheInvalidationMiddleware();
      const req = { method: 'POST', path: '/api/categories' };
      const res = { locals: {} };
      const next = jest.fn(() => {
        expect(res.locals.cacheInvalidationPatterns).toEqual(
          expect.arrayContaining(['cache:categories:*', 'cache:brands:*'])
        );
        done();
      });

      middleware(req, res, next);
    });

    it('should set empty patterns for unknown routes', (done) => {
      const middleware = cacheInvalidationMiddleware();
      const req = { method: 'GET', path: '/api/unknown' };
      const res = { locals: {} };
      const next = jest.fn(() => {
        expect(res.locals.cacheInvalidationPatterns).toEqual([]);
        done();
      });

      middleware(req, res, next);
    });

    it('should match POST brand operations', (done) => {
      const middleware = cacheInvalidationMiddleware();
      const req = { method: 'POST', path: '/api/brands' };
      const res = { locals: {} };
      const next = jest.fn(() => {
        expect(res.locals.cacheInvalidationPatterns).toContain('cache:brands:*');
        expect(res.locals.cacheInvalidationPatterns).toContain('cache:models:*');
        done();
      });

      middleware(req, res, next);
    });

    it('should match POST product operations', (done) => {
      const middleware = cacheInvalidationMiddleware();
      const req = { method: 'POST', path: '/api/products' };
      const res = { locals: {} };
      const next = jest.fn(() => {
        expect(res.locals.cacheInvalidationPatterns).toContain('cache:products:*');
        expect(res.locals.cacheInvalidationPatterns).toContain('cache:inventory:*');
        done();
      });

      middleware(req, res, next);
    });

    it('should match POST sales operations', (done) => {
      const middleware = cacheInvalidationMiddleware();
      const req = { method: 'POST', path: '/api/sales' };
      const res = { locals: {} };
      const next = jest.fn(() => {
        expect(res.locals.cacheInvalidationPatterns).toContain('cache:inventory:*');
        expect(res.locals.cacheInvalidationPatterns).toContain('cache:reports:*');
        expect(res.locals.cacheInvalidationPatterns).toContain('cache:sales:*');
        done();
      });

      middleware(req, res, next);
    });

    it('should match POST expense operations', (done) => {
      const middleware = cacheInvalidationMiddleware();
      const req = { method: 'POST', path: '/api/expenses' };
      const res = { locals: {} };
      const next = jest.fn(() => {
        expect(res.locals.cacheInvalidationPatterns).toContain('cache:reports:*');
        expect(res.locals.cacheInvalidationPatterns).toContain('cache:expenses:*');
        done();
      });

      middleware(req, res, next);
    });

    it('should match POST user operations', (done) => {
      const middleware = cacheInvalidationMiddleware();
      const req = { method: 'POST', path: '/api/users' };
      const res = { locals: {} };
      const next = jest.fn(() => {
        expect(res.locals.cacheInvalidationPatterns).toContain('cache:users:*');
        expect(res.locals.cacheInvalidationPatterns).toContain('cache:permissions:*');
        done();
      });

      middleware(req, res, next);
    });
  });

  describe('invalidateCachesForResponse', () => {
    it('should invalidate caches from res.locals', async () => {
      const res = {
        locals: {
          cacheInvalidationPatterns: ['cache:brands:*', 'cache:models:*'],
        },
      };

      await invalidateCachesForResponse(res);

      expect(cacheInvalidate).toHaveBeenCalledWith('cache:brands:*');
      expect(cacheInvalidate).toHaveBeenCalledWith('cache:models:*');
    });

    it('should handle missing res.locals gracefully', async () => {
      const res = {};

      await invalidateCachesForResponse(res);

      expect(cacheInvalidate).not.toHaveBeenCalled();
    });

    it('should handle empty patterns array', async () => {
      const res = { locals: { cacheInvalidationPatterns: [] } };

      await invalidateCachesForResponse(res);

      expect(cacheInvalidate).not.toHaveBeenCalled();
    });

    it('should handle undefined cacheInvalidationPatterns', async () => {
      const res = { locals: {} };

      await invalidateCachesForResponse(res);

      expect(cacheInvalidate).not.toHaveBeenCalled();
    });
  });

  describe('clearAllCaches', () => {
    it('should call cacheClearAll', async () => {
      await clearAllCaches();
      expect(cacheClearAll).toHaveBeenCalled();
    });

    it('should return count of cleared keys', async () => {
      cacheClearAll.mockResolvedValueOnce(10);
      const result = await clearAllCaches();
      expect(result).toBe(10);
    });

    it('should handle cacheClearAll errors', async () => {
      cacheClearAll.mockRejectedValueOnce(new Error('Clear failed'));
      await expect(clearAllCaches()).rejects.toThrow('Clear failed');
    });
  });

  describe('Integration scenarios', () => {
    it('should integrate middleware and decorator together', async () => {
      const middleware = cacheInvalidationMiddleware();
      const handler = jest.fn(async (req, res, next) => {
        res.statusCode = 201;
        res.json({ id: 1 });
      });
      const decorated = withCacheInvalidation(handler, ['cache:brands:*', 'cache:models:*']);

      // First apply middleware
      const req = { method: 'POST', path: '/api/brands' };
      const res = { locals: {} };
      const next1 = jest.fn();
      middleware(req, res, next1);

      // Then call decorated handler
      const jsonFn = jest.fn().mockReturnValue({ id: 1 });
      res.json = jsonFn;
      res.statusCode = 201;
      const next2 = jest.fn();

      await decorated(req, res, next2);

      // Cache should be invalidated
      expect(cacheInvalidate).toHaveBeenCalled();
    });

    it('should handle category POST operation', async () => {
      const middleware = cacheInvalidationMiddleware();
      const req = { method: 'POST', path: '/api/categories' };
      const res = { locals: {} };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.locals.cacheInvalidationPatterns).toEqual([
        'cache:categories:*',
        'cache:brands:*',
        'cache:models:*',
      ]);
    });

    it('should handle variant POST operation', async () => {
      const middleware = cacheInvalidationMiddleware();
      const req = { method: 'POST', path: '/api/variants' };
      const res = { locals: {} };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.locals.cacheInvalidationPatterns).toEqual(
        expect.arrayContaining(['cache:variants:*', 'cache:products:*'])
      );
    });
  });
});
