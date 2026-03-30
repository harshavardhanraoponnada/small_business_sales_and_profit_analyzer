jest.mock('../../services/prisma.service', () => ({
  auditLog: {
    findMany: jest.fn(),
  },
}));

const prismaService = require('../../services/prisma.service');
const { getLogs } = require('../../controllers/audit.controller');

describe('Audit Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {};
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getLogs', () => {
    it('should fetch and format all audit logs', async () => {
      const mockLogs = [
        {
          id: 1,
          created_at: new Date('2024-03-30T10:00:00Z'),
          username: 'user1',
          user_role: 'admin',
          action: 'CREATE',
          details: 'Created new product',
          user: { username: 'user1' },
        },
        {
          id: 2,
          created_at: new Date('2024-03-30T09:00:00Z'),
          username: 'user2',
          user_role: 'editor',
          action: 'UPDATE',
          details: 'Updated category',
          user: { username: 'user2' },
        },
      ];

      prismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      await getLogs(mockReq, mockRes);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith({
        include: {
          user: { select: { username: true } },
        },
        orderBy: { created_at: 'desc' },
      });

      expect(mockRes.json).toHaveBeenCalledWith([
        {
          timestamp: '2024-03-30T10:00:00.000Z',
          username: 'user1',
          role: 'admin',
          action: 'CREATE',
          details: 'Created new product',
        },
        {
          timestamp: '2024-03-30T09:00:00.000Z',
          username: 'user2',
          role: 'editor',
          action: 'UPDATE',
          details: 'Updated category',
        },
      ]);
    });

    it('should return empty array when no logs exist', async () => {
      prismaService.auditLog.findMany.mockResolvedValue([]);

      await getLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('should order logs by created_at descending', async () => {
      const mockLogs = [
        {
          id: 3,
          created_at: new Date('2024-03-30T11:00:00Z'),
          username: 'user3',
          user_role: 'viewer',
          action: 'READ',
          details: 'Viewed report',
          user: { username: 'user3' },
        },
      ];

      prismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      await getLogs(mockReq, mockRes);

      // Verify orderBy parameter
      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { created_at: 'desc' },
        })
      );
    });

    it('should include user information in query', async () => {
      const mockLogs = [
        {
          id: 4,
          created_at: new Date('2024-03-30T08:00:00Z'),
          username: 'admin_user',
          user_role: 'admin',
          action: 'DELETE',
          details: 'Deleted obsolete data',
          user: { username: 'admin_user' },
        },
      ];

      prismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      await getLogs(mockReq, mockRes);

      // Verify include parameter for user data
      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: { select: { username: true } },
          },
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      prismaService.auditLog.findMany.mockRejectedValue(dbError);

      await getLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Failed to fetch audit logs',
        error: 'Database connection failed',
      });
    });

    it('should handle prisma query timeout', async () => {
      const timeoutError = new Error('Query timeout');
      prismaService.auditLog.findMany.mockRejectedValue(timeoutError);

      await getLogs(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Failed to fetch audit logs',
        error: 'Query timeout',
      });
    });

    it('should correctly convert ISO date format', async () => {
      const mockLogs = [
        {
          id: 5,
          created_at: new Date('2024-01-15T14:30:45.123Z'),
          username: 'testuser',
          user_role: 'admin',
          action: 'EXPORT',
          details: 'Exported data',
          user: { username: 'testuser' },
        },
      ];

      prismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      await getLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([
        expect.objectContaining({
          timestamp: '2024-01-15T14:30:45.123Z',
        }),
      ]);
    });

    it('should handle logs with various action types', async () => {
      const mockLogs = [
        {
          id: 6,
          created_at: new Date('2024-03-30T12:00:00Z'),
          username: 'user_a',
          user_role: 'admin',
          action: 'LOGIN',
          details: 'User logged in',
          user: { username: 'user_a' },
        },
        {
          id: 7,
          created_at: new Date('2024-03-30T11:00:00Z'),
          username: 'user_b',
          user_role: 'editor',
          action: 'LOGOUT',
          details: 'User logged out',
          user: { username: 'user_b' },
        },
      ];

      prismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      await getLogs(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ action: 'LOGIN' }),
          expect.objectContaining({ action: 'LOGOUT' }),
        ])
      );
    });
  });
});
