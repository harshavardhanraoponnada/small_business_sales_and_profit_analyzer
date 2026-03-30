/**
 * Unit Tests: Auth Controller
 * Tests real controller logic with mocked Prisma and dependencies.
 */

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

const mockAuditService = {
  logAction: jest.fn(),
};

const mockOtpStore = {
  setOTP: jest.fn(),
  verifyOTP: jest.fn(),
  clearOTP: jest.fn(),
};

const mockMailService = {
  sendOTPEmail: jest.fn(),
};

jest.mock('../../services/prisma.service', () => mockPrisma);
jest.mock('../../services/audit.service', () => mockAuditService);
jest.mock('../../utils/otp.store', () => mockOtpStore);
jest.mock('../../services/mail.service', () => mockMailService);
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
}));
jest.mock('bcryptjs', () => ({
  compareSync: jest.fn(),
  hash: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const controller = require('../../controllers/auth.controller');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.MAIL_USER = '';
    process.env.MAIL_PASS = '';
  });

  describe('login', () => {
    it('returns token and role for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        username: 'owner1',
        role: 'OWNER',
        password_hash: 'hashed',
      });
      bcrypt.compareSync.mockReturnValue(true);

      const req = { body: { username: 'owner1', password: 'pass123' } };
      const res = createMockRes();

      await controller.login(req, res);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'owner1' } });
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ token: 'mock-token', role: 'OWNER' });
    });

    it('returns 401 when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const req = { body: { username: 'missing', password: 'pass123' } };
      const res = createMockRes();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('returns 401 when password is invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        username: 'owner1',
        role: 'OWNER',
        password_hash: 'hashed',
      });
      bcrypt.compareSync.mockReturnValue(false);

      const req = { body: { username: 'owner1', password: 'bad' } };
      const res = createMockRes();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });

  describe('forgotPassword', () => {
    it('returns 400 when email is missing', async () => {
      const req = { body: {} };
      const res = createMockRes();

      await controller.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email is required' });
    });

    it('stores OTP and returns security response even if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const req = { body: { email: 'unknown@example.com' } };
      const res = createMockRes();

      await controller.forgotPassword(req, res);

      expect(mockOtpStore.setOTP).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'If the account exists, an OTP has been sent' });
    });
  });

  describe('resetPassword', () => {
    it('returns 400 for invalid OTP', async () => {
      mockOtpStore.verifyOTP.mockReturnValue(false);

      const req = { body: { email: 'u@test.com', otp: '123456', newPassword: 'newpass' } };
      const res = createMockRes();

      await controller.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired OTP' });
    });

    it('returns 404 when OTP is valid but user does not exist', async () => {
      mockOtpStore.verifyOTP.mockReturnValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const req = { body: { email: 'u@test.com', otp: '123456', newPassword: 'newpass' } };
      const res = createMockRes();

      await controller.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('updates password and clears OTP on success', async () => {
      mockOtpStore.verifyOTP.mockReturnValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'u@test.com' });
      bcrypt.hash.mockResolvedValue('new-hash');
      mockPrisma.user.update.mockResolvedValue({});

      const req = { body: { email: 'u@test.com', otp: '123456', newPassword: 'newpass' } };
      const res = createMockRes();

      await controller.resetPassword(req, res);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { password_hash: 'new-hash' },
      });
      expect(mockOtpStore.clearOTP).toHaveBeenCalledWith('u@test.com');
      expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successful' });
    });
  });

  describe('addUser', () => {
    it('returns 400 for missing fields', async () => {
      const req = { body: { username: 'u1' }, user: { id: 'admin1' } };
      const res = createMockRes();

      await controller.addUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
    });

    it('returns 400 for invalid role', async () => {
      const req = {
        body: { username: 'u1', email: 'u1@test.com', password: 'pass123', role: 'INVALID' },
        user: { id: 'admin1' },
      };
      const res = createMockRes();

      await controller.addUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid role' });
    });

    it('creates user and logs action on success', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed-pass');
      mockPrisma.user.create.mockResolvedValue({
        id: 'u2',
        username: 'staff1',
        email: 'staff1@test.com',
        role: 'STAFF',
      });

      const req = {
        body: { username: 'staff1', email: 'staff1@test.com', password: 'pass123', role: 'STAFF' },
        user: { id: 'admin1', role: 'OWNER' },
      };
      const res = createMockRes();

      await controller.addUser(req, res);

      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockAuditService.logAction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User added successfully',
        user: {
          id: 'u2',
          username: 'staff1',
          email: 'staff1@test.com',
          role: 'STAFF',
        },
      });
    });
  });

  describe('getUsers', () => {
    it('returns users with safe default report settings', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          username: 'owner1',
          email: 'owner@test.com',
          role: 'OWNER',
          reportFrequency: null,
          reportFormat: null,
          receiveScheduledReports: null,
        },
      ]);

      const req = {};
      const res = createMockRes();

      await controller.getUsers(req, res);

      expect(res.json).toHaveBeenCalledWith([
        {
          id: 'u1',
          username: 'owner1',
          email: 'owner@test.com',
          role: 'OWNER',
          reportFrequency: 'none',
          reportFormat: 'pdf',
          receiveScheduledReports: false,
        },
      ]);
    });
  });
});
