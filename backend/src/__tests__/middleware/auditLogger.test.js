/**
 * Audit Logger Middleware Tests
 * Tests audit logging middleware functionality
 */

jest.mock('../../services/audit.service');
const { logAction } = require('../../services/audit.service');
const auditLogger = require('../../middleware/auditLogger');

describe('auditLogger Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request
    req = {
      user: { id: 1, email: 'test@example.com' },
      body: { data: 'test' },
      method: 'POST',
      path: '/api/test',
    };

    // Mock response with EventEmitter-like behavior
    res = {
      statusCode: 200,
      finished: false,
      listeners: {},
      on: jest.fn(function (event, callback) {
        this.listeners[event] = callback;
        return this;
      }),
      emit: jest.fn(function (event) {
        if (this.listeners[event]) {
          this.listeners[event]();
        }
      }),
    };

    next = jest.fn();
  });

  it('should create middleware function', () => {
    const middleware = auditLogger('TEST_ACTION', () => 'test details');
    expect(typeof middleware).toBe('function');
  });

  it('should call next immediately', () => {
    const middleware = auditLogger('TEST_ACTION', () => 'test details');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should log action on response finish with success status', () => {
    const detailsFn = jest.fn(() => 'test details');
    const middleware = auditLogger('CREATE_USER', detailsFn);

    middleware(req, res, next);
    res.emit('finish');

    expect(logAction).toHaveBeenCalledWith({
      user: req.user,
      action: 'CREATE_USER',
      details: 'test details',
    });
  });

  it('should not log if response status is 400 or higher', () => {
    res.statusCode = 400;
    const detailsFn = jest.fn(() => 'error details');
    const middleware = auditLogger('DELETE_USER', detailsFn);

    middleware(req, res, next);
    res.emit('finish');

    expect(logAction).not.toHaveBeenCalled();
  });

  it('should not log if req.user is not present', () => {
    req.user = null;
    const detailsFn = jest.fn(() => 'test details');
    const middleware = auditLogger('CREATE_PRODUCT', detailsFn);

    middleware(req, res, next);
    res.emit('finish');

    expect(logAction).not.toHaveBeenCalled();
  });

  it('should call detailsFn with request object', () => {
    const detailsFn = jest.fn(() => 'formatted details');
    const middleware = auditLogger('UPDATE_ITEM', detailsFn);

    middleware(req, res, next);
    res.emit('finish');

    expect(detailsFn).toHaveBeenCalledWith(req);
  });

  it('should handle status code 399 (just below error)', () => {
    res.statusCode = 399;
    const detailsFn = jest.fn(() => 'test details');
    const middleware = auditLogger('ACTION', detailsFn);

    middleware(req, res, next);
    res.emit('finish');

    expect(logAction).toHaveBeenCalled();
  });

  it('should handle various action names', () => {
    const actions = ['LOGIN', 'LOGOUT', 'UPDATE', 'DELETE', 'CREATE'];

    actions.forEach((action) => {
      logAction.mockClear();
      const middleware = auditLogger(action, () => 'details');

      middleware(req, res, next);
      res.emit('finish');

      expect(logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action })
      );
    });
  });

  it('should pass request object to detailsFn', () => {
    const detailsFn = jest.fn((request) => {
      return `${request.method} ${request.path}`;
    });
    const middleware = auditLogger('HTTP_REQUEST', detailsFn);

    middleware(req, res, next);
    res.emit('finish');

    expect(detailsFn).toHaveBeenCalledWith(req);
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        details: 'POST /api/test',
      })
    );
  });
});
