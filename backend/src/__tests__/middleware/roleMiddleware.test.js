/**
 * Unit Tests: roleMiddleware
 */

const roleMiddleware = require('../../middleware/roleMiddleware');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('roleMiddleware', () => {
  it('returns 403 when req.user is missing', () => {
    const middleware = roleMiddleware('OWNER');
    const req = {};
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when role is not allowed', () => {
    const middleware = roleMiddleware('OWNER');
    const req = { user: { role: 'STAFF' } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when role is allowed', () => {
    const middleware = roleMiddleware('OWNER', 'ACCOUNTANT');
    const req = { user: { role: 'ACCOUNTANT' } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
