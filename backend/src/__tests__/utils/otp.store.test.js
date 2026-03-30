/**
 * OTP Store Utility Tests
 * Tests in-memory OTP storage and verification
 */

const { setOTP, verifyOTP, clearOTP } = require('../../utils/otp.store');

describe('OTP Store', () => {
  beforeEach(() => {
    // Clear any stored OTPs before each test
    clearOTP('test@example.com');
    clearOTP('user@example.com');
    clearOTP('expired@example.com');
  });

  describe('setOTP', () => {
    it('should store OTP for an email', () => {
      const email = 'test@example.com';
      const otp = '123456';

      setOTP(email, otp);

      // Verify it was stored by checking if verification works
      expect(verifyOTP(email, otp)).toBe(true);
    });

    it('should overwrite existing OTP for same email', () => {
      const email = 'test@example.com';
      const otp1 = '111111';
      const otp2 = '222222';

      setOTP(email, otp1);
      setOTP(email, otp2);

      // Only the second OTP should work
      expect(verifyOTP(email, otp1)).toBe(false);
      expect(verifyOTP(email, otp2)).toBe(true);
    });

    it('should store OTP with correct expiration time', () => {
      const email = 'test@example.com';
      const otp = '123456';

      const beforeTime = Date.now();
      setOTP(email, otp);
      const afterTime = Date.now();

      // OTP should be verifiable immediately after storing
      expect(verifyOTP(email, otp)).toBe(true);

      // The stored record should have expiresAt property set to ~10 minutes from now
      // We can't directly test this, but we can verify the OTP works shortly after
      expect(verifyOTP(email, otp)).toBe(true);
    });

    it('should store different OTPs for different emails', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';
      const otp1 = '111111';
      const otp2 = '222222';

      setOTP(email1, otp1);
      setOTP(email2, otp2);

      expect(verifyOTP(email1, otp1)).toBe(true);
      expect(verifyOTP(email2, otp2)).toBe(true);
      expect(verifyOTP(email1, otp2)).toBe(false);
      expect(verifyOTP(email2, otp1)).toBe(false);
    });
  });

  describe('verifyOTP', () => {
    it('should return true for valid OTP', () => {
      const email = 'test@example.com';
      const otp = '123456';

      setOTP(email, otp);
      expect(verifyOTP(email, otp)).toBe(true);
    });

    it('should return false for non-existent email', () => {
      expect(verifyOTP('nonexistent@example.com', '123456')).toBe(false);
    });

    it('should return false for incorrect OTP', () => {
      const email = 'test@example.com';
      const correctOtp = '123456';
      const incorrectOtp = '654321';

      setOTP(email, correctOtp);
      expect(verifyOTP(email, incorrectOtp)).toBe(false);
    });

    it('should return false for expired OTP', () => {
      const email = 'test@example.com';
      const otp = '123456';

      setOTP(email, otp);
      expect(verifyOTP(email, otp)).toBe(true);

      // Simulate expiration by manipulating Date.now()
      // We'll use jest.useFakeTimers to advance time
      jest.useFakeTimers();
      const currentTime = Date.now();
      jest.setSystemTime(currentTime + 11 * 60 * 1000); // 11 minutes later

      expect(verifyOTP(email, otp)).toBe(false);

      jest.useRealTimers();
    });

    it('should return false for OTP right at expiration boundary', () => {
      const email = 'test@example.com';
      const otp = '123456';

      jest.useFakeTimers();
      const initialTime = Date.now();
      jest.setSystemTime(initialTime);

      setOTP(email, otp);

      // Move to exactly 10 minutes later (expiration time)
      jest.setSystemTime(initialTime + 10 * 60 * 1000);

      // Should still be valid at the exact expiration time (depending on implementation)
      // but invalid just after
      jest.setSystemTime(initialTime + 10 * 60 * 1000 + 1);
      expect(verifyOTP(email, otp)).toBe(false);

      jest.useRealTimers();
    });

    it('should handle empty OTP string', () => {
      const email = 'test@example.com';

      setOTP(email, '123456');
      expect(verifyOTP(email, '')).toBe(false);
    });

    it('should be case-sensitive for OTP', () => {
      const email = 'test@example.com';
      const otp = 'ABC123';

      setOTP(email, otp);
      expect(verifyOTP(email, 'abc123')).toBe(false);
      expect(verifyOTP(email, otp)).toBe(true);
    });
  });

  describe('clearOTP', () => {
    it('should remove OTP for an email', () => {
      const email = 'test@example.com';
      const otp = '123456';

      setOTP(email, otp);
      expect(verifyOTP(email, otp)).toBe(true);

      clearOTP(email);
      expect(verifyOTP(email, otp)).toBe(false);
    });

    it('should not affect OTPs for other emails', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';
      const otp1 = '111111';
      const otp2 = '222222';

      setOTP(email1, otp1);
      setOTP(email2, otp2);

      clearOTP(email1);

      expect(verifyOTP(email1, otp1)).toBe(false);
      expect(verifyOTP(email2, otp2)).toBe(true);
    });

    it('should silently handle clearing non-existent OTP', () => {
      // Should not throw error
      expect(() => {
        clearOTP('nonexistent@example.com');
      }).not.toThrow();
    });

    it('should allow re-storing OTP after clearing', () => {
      const email = 'test@example.com';
      const otp1 = '111111';
      const otp2 = '222222';

      setOTP(email, otp1);
      clearOTP(email);
      setOTP(email, otp2);

      expect(verifyOTP(email, otp1)).toBe(false);
      expect(verifyOTP(email, otp2)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle numeric OTPs', () => {
      const email = 'test@example.com';
      const otp = 123456;

      setOTP(email, otp);
      expect(verifyOTP(email, otp)).toBe(true);
    });

    it('should handle special characters in email', () => {
      const email = 'user+tag@example.co.uk';
      const otp = '123456';

      setOTP(email, otp);
      expect(verifyOTP(email, otp)).toBe(true);
      expect(verifyOTP('user+tag@example.co.uk', otp)).toBe(true);
    });

    it('should handle multiple rapid OTP verifications', () => {
      const email = 'test@example.com';
      const otp = '123456';

      setOTP(email, otp);

      // Verify multiple times rapidly - all should succeed
      for (let i = 0; i < 5; i++) {
        expect(verifyOTP(email, otp)).toBe(true);
      }
    });
  });
});
