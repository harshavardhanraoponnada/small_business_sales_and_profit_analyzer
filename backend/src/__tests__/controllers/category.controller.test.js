/**
 * Unit Tests: Category Controller
 */

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockAuditService = {
  logAction: jest.fn(),
};

jest.mock('../../services/prisma.service', () => mockPrisma);
jest.mock('../../services/audit.service', () => mockAuditService);

const controller = require('../../controllers/category.controller');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('Category Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCategories returns non-deleted by default', async () => {
    mockPrisma.category.findMany.mockResolvedValue([{ id: 'c1', name: 'Mobiles' }]);

    const req = { query: {} };
    const res = createMockRes();

    await controller.getCategories(req, res);

    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { is_deleted: false } })
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('getCategories includes deleted when includeDeleted=true', async () => {
    mockPrisma.category.findMany.mockResolvedValue([]);

    const req = { query: { includeDeleted: 'true' } };
    const res = createMockRes();

    await controller.getCategories(req, res);

    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it('addCategory creates category and logs action', async () => {
    mockPrisma.category.create.mockResolvedValue({ id: 'c1', name: 'Mobiles' });

    const req = { body: { name: 'Mobiles' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.addCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockAuditService.logAction).toHaveBeenCalled();
  });

  it('updateCategory returns 404 when category not found', async () => {
    mockPrisma.category.findUnique.mockResolvedValue(null);

    const req = { params: { id: 'c404' }, body: { name: 'X' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.updateCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Category not found' });
  });

  it('updateCategory updates and returns category', async () => {
    mockPrisma.category.findUnique.mockResolvedValue({ id: 'c1', name: 'Old' });
    mockPrisma.category.update.mockResolvedValue({ id: 'c1', name: 'New' });

    const req = { params: { id: 'c1' }, body: { name: 'New' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.updateCategory(req, res);

    expect(mockPrisma.category.update).toHaveBeenCalled();
    expect(mockAuditService.logAction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ id: 'c1', name: 'New' });
  });

  it('deleteCategory returns 404 when not found', async () => {
    mockPrisma.category.findUnique.mockResolvedValue(null);

    const req = { params: { id: 'c404' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deleteCategory soft deletes category', async () => {
    mockPrisma.category.findUnique.mockResolvedValue({ id: 'c1', name: 'Mobiles' });
    mockPrisma.category.update.mockResolvedValue({ id: 'c1', name: 'Mobiles', is_deleted: true });

    const req = { params: { id: 'c1' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.deleteCategory(req, res);

    expect(mockPrisma.category.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { is_deleted: true } });
    expect(res.json).toHaveBeenCalledWith({ message: 'Category deleted successfully', categoryId: 'c1' });
  });

  it('restoreCategory restores category', async () => {
    mockPrisma.category.findUnique.mockResolvedValue({ id: 'c1', name: 'Mobiles', is_deleted: true });
    mockPrisma.category.update.mockResolvedValue({ id: 'c1', name: 'Mobiles', is_deleted: false });

    const req = { params: { id: 'c1' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.restoreCategory(req, res);

    expect(mockPrisma.category.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { is_deleted: false } });
    expect(res.json).toHaveBeenCalledWith({
      message: 'Category restored successfully',
      category: { id: 'c1', name: 'Mobiles', is_deleted: false },
    });
  });
});
