/**
 * Logger Service Tests
 * Tests structured logging functions for HTTP, data, security, error, and audit events
 */

// Mock pino logger before importing service
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.mock('pino', () => {
  return jest.fn(() => mockLogger);
});

const {
  logRequest,
  logData,
  logSecurity,
  logError,
  logAudit,
  logger,
} = require('../../services/logger.service');

describe('Logger Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
  });

  describe('logRequest', () => {
    it('should log successful HTTP requests at info level', () => {
      logRequest('GET', '/api/users', 200, 123);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'http_request',
          method: 'GET',
          path: '/api/users',
          statusCode: 200,
          durationMs: 123,
        })
      );
    });

    it('should log HTTP requests with userId', () => {
      logRequest('POST', '/api/login', 200, 456, 'user123');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'http_request',
          method: 'POST',
          path: '/api/login',
          statusCode: 200,
          durationMs: 456,
          userId: 'user123',
        })
      );
    });

    it('should log client errors (4xx) at warn level', () => {
      logRequest('POST', '/api/users', 400, 89);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'http_request',
          method: 'POST',
          path: '/api/users',
          statusCode: 400,
          durationMs: 89,
        })
      );
    });

    it('should log server errors (5xx) at warn level', () => {
      logRequest('GET', '/api/data', 500, 234);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'http_request',
          statusCode: 500,
        })
      );
    });

    it('should log edge case status codes', () => {
      logRequest('DELETE', '/api/resource', 204, 50);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 204,
        })
      );
    });

    it('should include timestamp in log entry', () => {
      const beforeTime = Date.now();
      logRequest('GET', '/api/test', 200, 100);
      const afterTime = Date.now();

      const callArg = mockLogger.info.mock.calls[0][0];
      const logTimestamp = new Date(callArg.timestamp).getTime();
      
      expect(logTimestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(logTimestamp).toBeLessThanOrEqual(afterTime + 1000);
    });
  });

  describe('logData', () => {
    it('should log successful data operations at info level', () => {
      logData('INSERT', 'users', true, { rowsAffected: 1 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'data_operation',
          operation: 'INSERT',
          entity: 'users',
          successful: true,
          rowsAffected: 1,
        })
      );
    });

    it('should log failed data operations at warn level', () => {
      logData('UPDATE', 'products', false, { error: 'Constraint violation' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'data_operation',
          operation: 'UPDATE',
          entity: 'products',
          successful: false,
          error: 'Constraint violation',
        })
      );
    });

    it('should log DELETE operations', () => {
      logData('DELETE', 'orders', true, { rowsAffected: 5 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'DELETE',
          entity: 'orders',
        })
      );
    });

    it('should handle missing details parameter', () => {
      logData('SELECT', 'categories', true);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'data_operation',
          operation: 'SELECT',
          entity: 'categories',
          successful: true,
        })
      );
    });

    it('should include timestamp in log entry', () => {
      logData('INSERT', 'test', true);

      const callArg = mockLogger.info.mock.calls[0][0];
      expect(callArg.timestamp).toBeDefined();
      expect(typeof callArg.timestamp).toBe('string');
    });
  });

  describe('logSecurity', () => {
    it('should log critical security events at error level', () => {
      logSecurity('unauthorized_access', 'critical', { userId: 'attacker' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'security_event',
          event: 'unauthorized_access',
          severity: 'critical',
          userId: 'attacker',
        })
      );
    });

    it('should log high severity security events at warn level', () => {
      logSecurity('privilege_escalation', 'high', { userId: 'user123' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'security_event',
          event: 'privilege_escalation',
          severity: 'high',
          userId: 'user123',
        })
      );
    });

    it('should log low severity security events at info level', () => {
      logSecurity('suspicious_activity', 'low', { threshold: 5 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'security_event',
          event: 'suspicious_activity',
          severity: 'low',
          threshold: 5,
        })
      );
    });

    it('should log medium severity security events at info level', () => {
      logSecurity('failed_login_attempts', 'medium', { count: 3 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'security_event',
          event: 'failed_login_attempts',
          severity: 'medium',
          count: 3,
        })
      );
    });

    it('should handle missing details parameter', () => {
      logSecurity('session_hijacking', 'critical');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'security_event',
          event: 'session_hijacking',
          severity: 'critical',
        })
      );
    });

    it('should include timestamp in log entry', () => {
      logSecurity('test_event', 'low');

      const callArg = mockLogger.info.mock.calls[0][0];
      expect(callArg.timestamp).toBeDefined();
    });
  });

  describe('logError', () => {
    it('should log errors with message and stack', () => {
      const error = new Error('Test error message');

      logError(error, { userId: 'user123' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Test error message',
          stack: expect.stringContaining('Error: Test error message'),
          userId: 'user123',
        })
      );
    });

    it('should log errors without context', () => {
      const error = new Error('Standalone error');

      logError(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Standalone error',
        })
      );
    });

    it('should handle errors with multiple context fields', () => {
      const error = new Error('Database error');

      logError(error, { userId: 'user1', operation: 'INSERT', table: 'users' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Database error',
          userId: 'user1',
          operation: 'INSERT',
          table: 'users',
        })
      );
    });

    it('should handle errors with empty context', () => {
      const error = new Error('Test');

      logError(error, {});

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Test',
        })
      );
    });

    it('should include timestamp in log entry', () => {
      const error = new Error('Test error');

      logError(error);

      const callArg = mockLogger.error.mock.calls[0][0];
      expect(callArg.timestamp).toBeDefined();
      expect(typeof callArg.timestamp).toBe('string');
    });

    it('should always log at error level', () => {
      const error = new Error('Any error');

      logError(error);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('logAudit', () => {
    it('should log audit events', () => {
      logAudit('UPDATE_USER', 'admin', 'user_123', { oldRole: 'user', newRole: 'admin' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audit',
          action: 'UPDATE_USER',
          user: 'admin',
          resource: 'user_123',
          oldRole: 'user',
          newRole: 'admin',
        })
      );
    });

    it('should log DELETE audit events', () => {
      logAudit('DELETE_PRODUCT', 'user456', 'product_789', { productName: 'Widget' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audit',
          action: 'DELETE_PRODUCT',
          user: 'user456',
          resource: 'product_789',
          productName: 'Widget',
        })
      );
    });

    it('should log CREATE audit events', () => {
      logAudit('CREATE_USER', 'admin', 'new_user', { email: 'test@example.com' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audit',
          action: 'CREATE_USER',
          user: 'admin',
          resource: 'new_user',
          email: 'test@example.com',
        })
      );
    });

    it('should handle missing details parameter', () => {
      logAudit('EXPORT_DATA', 'user999', 'report_001');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audit',
          action: 'EXPORT_DATA',
          user: 'user999',
          resource: 'report_001',
        })
      );
    });

    it('should always log at info level', () => {
      logAudit('TEST_ACTION', 'user', 'resource');

      expect(mockLogger.info).toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should include timestamp in log entry', () => {
      logAudit('ACTION', 'user', 'resource');

      const callArg = mockLogger.info.mock.calls[0][0];
      expect(callArg.timestamp).toBeDefined();
      expect(typeof callArg.timestamp).toBe('string');
    });

    it('should handle complex details objects', () => {
      const details = {
        changes: { field1: 'old', field2: 'new' },
        metadata: { ip: '192.168.1.1', userAgent: 'Test' },
      };

      logAudit('UPDATE_SETTINGS', 'admin', 'system', details);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audit',
          action: 'UPDATE_SETTINGS',
          user: 'admin',
          resource: 'system',
          changes: details.changes,
          metadata: details.metadata,
        })
      );
    });
  });

  describe('Logger module itself', () => {
    it('should export logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });
  });
});
