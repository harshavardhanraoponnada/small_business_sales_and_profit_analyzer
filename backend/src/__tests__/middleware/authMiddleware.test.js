/**
 * Unit Tests: authMiddleware
 */

jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/authMiddleware');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('authMiddleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when no authorization header', () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token format is invalid', () => {
    const req = { headers: { authorization: 'Bearer' } };
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user and calls next for valid token', () => {
    jwt.verify.mockReturnValue({ id: 'u1', role: 'OWNER' });

    const req = { headers: { authorization: 'Bearer goodtoken' } };
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'u1', role: 'OWNER' });
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when token verification fails', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    const req = { headers: { authorization: 'Bearer badtoken' } };
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
