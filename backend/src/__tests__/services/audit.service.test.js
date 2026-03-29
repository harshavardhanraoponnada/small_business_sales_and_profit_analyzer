/**
 * Unit Tests: Audit Service
 * Tests audit.service.js functionality (logging actions without breaking operations)
 */

let mockPrisma;

jest.mock('../../services/prisma.service', () => {
  mockPrisma = {
    auditLog: {
      create: jest.fn(),
    },
  };
  return mockPrisma;
});

describe('Audit Service', () => {
  let auditService;

  beforeEach(() => {
    jest.clearAllMocks();
    auditService = require('../../services/audit.service');
  });

  describe('logAction', () => {
    it('should create an audit log entry in the database', async () => {
      const logData = {
        user: { id: 1, username: 'testuser', role: 'ADMIN' },
        action: 'CREATE',
        details: 'Created new product',
      };

      mockPrisma.auditLog.create.mockResolvedValue({ id: 1, ...logData });

      await auditService.logAction(logData);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'CREATE',
          username: 'testuser',
          user_role: 'ADMIN',
          details: 'Created new product',
          created_by: 1,
        },
      });
    });

    it('should handle different action types', async () => {
      const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];

      for (const actionType of actionTypes) {
        mockPrisma.auditLog.create.mockResolvedValue({});

        await auditService.logAction({
          user: { id: 1, username: 'testuser', role: 'USER' },
          action: actionType,
          details: `Action: ${actionType}`,
        });

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ action: actionType }),
          })
        );
      }
    });

    it('should not throw error if database write fails (graceful degradation)', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Should not throw
      const result = await auditService.logAction({
        user: { id: 1, username: 'testuser', role: 'USER' },
        action: 'CREATE',
        details: 'Test action',
      });

      expect(result).toBeUndefined(); // Audit logging should silently fail
    });

    it('should preserve user metadata in audit trail', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});

      await auditService.logAction({
        user: { id: 5, username: 'admin_user', role: 'ADMIN' },
        action: 'DELETE',
        details: 'Deleted product ID 123',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'DELETE',
          username: 'admin_user',
          user_role: 'ADMIN',
          details: 'Deleted product ID 123',
          created_by: 5,
        },
      });
    });

    it('should handle complex JSON details', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});

      const complexDetails = {
        product_id: 123,
        fields_changed: {
          price: { old: 99.99, new: 89.99 },
          stock: { old: 100, new: 95 },
        },
      };

      await auditService.logAction({
        user: { id: 1, username: 'editor', role: 'EDITOR' },
        action: 'UPDATE',
        details: JSON.stringify(complexDetails),
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            details: JSON.stringify(complexDetails),
          }),
        })
      );
    });
  });
});
