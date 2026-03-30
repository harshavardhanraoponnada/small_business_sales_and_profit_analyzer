/**
 * Unit Tests: validate.middleware
 */

const {
  validateLoginBody,
  validateForgotPasswordBody,
  validateResetPasswordBody,
  validateUserBody,
} = require('../../middleware/validate.middleware');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('validate.middleware', () => {
  describe('validateLoginBody', () => {
    it('rejects invalid username', () => {
      const req = { body: { username: '', password: 'password123' } };
      const res = createMockRes();
      const next = jest.fn();

      validateLoginBody(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('allows valid body', () => {
      const req = { body: { username: 'validUser', password: 'password123' } };
      const res = createMockRes();
      const next = jest.fn();

      validateLoginBody(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateForgotPasswordBody', () => {
    it('rejects invalid email', () => {
      const req = { body: { email: 'bad-email' } };
      const res = createMockRes();
      const next = jest.fn();

      validateForgotPasswordBody(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('accepts valid email', () => {
      const req = { body: { email: 'user@test.com' } };
      const res = createMockRes();
      const next = jest.fn();

      validateForgotPasswordBody(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateResetPasswordBody', () => {
    it('rejects invalid otp', () => {
      const req = { body: { email: 'user@test.com', otp: '12', newPassword: 'password123' } };
      const res = createMockRes();
      const next = jest.fn();

      validateResetPasswordBody(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('accepts valid reset payload', () => {
      const req = { body: { email: 'user@test.com', otp: '123456', newPassword: 'password123' } };
      const res = createMockRes();
      const next = jest.fn();

      validateResetPasswordBody(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateUserBody', () => {
    it('rejects invalid role', () => {
      const req = { body: { username: 'user1', email: 'user@test.com', password: 'password123', role: 'BAD' } };
      const res = createMockRes();
      const next = jest.fn();

      validateUserBody(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('accepts valid user payload', () => {
      const req = { body: { username: 'user1', email: 'user@test.com', password: 'password123', role: 'STAFF' } };
      const res = createMockRes();
      const next = jest.fn();

      validateUserBody(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
