/**
 * Unit Tests: Model Controller
 */

const mockPrisma = {
  model: {
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

const controller = require('../../controllers/model.controller');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('Model Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getModels filters by brand and non-deleted by default', async () => {
    mockPrisma.model.findMany.mockResolvedValue([{ id: 'm1', name: 'ModelX' }]);

    const req = { query: { brandId: 'b1' } };
    const res = createMockRes();

    await controller.getModels(req, res);

    expect(mockPrisma.model.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { brand_id: 'b1', is_deleted: false } })
    );
  });

  it('addModel creates model', async () => {
    mockPrisma.model.create.mockResolvedValue({ id: 'm1', name: 'ModelX' });
    const req = { body: { name: 'ModelX', brand_id: 'b1' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.addModel(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockAuditService.logAction).toHaveBeenCalled();
  });

  it('updateModel returns 404 when model not found', async () => {
    mockPrisma.model.findUnique.mockResolvedValue(null);
    const req = { params: { id: 'm404' }, body: { name: 'X' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.updateModel(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Model not found' });
  });

  it('updateModel updates model when found', async () => {
    mockPrisma.model.findUnique.mockResolvedValue({ id: 'm1', name: 'Old' });
    mockPrisma.model.update.mockResolvedValue({ id: 'm1', name: 'New' });
    const req = { params: { id: 'm1' }, body: { name: 'New' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.updateModel(req, res);

    expect(mockPrisma.model.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ id: 'm1', name: 'New' });
  });

  it('deleteModel soft deletes', async () => {
    mockPrisma.model.findUnique.mockResolvedValue({ id: 'm1', name: 'ModelX' });
    mockPrisma.model.update.mockResolvedValue({ id: 'm1', is_deleted: true, name: 'ModelX' });
    const req = { params: { id: 'm1' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.deleteModel(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Model deleted successfully', modelId: 'm1' });
  });

  it('restoreModel restores deleted model', async () => {
    mockPrisma.model.findUnique.mockResolvedValue({ id: 'm1', is_deleted: true, name: 'ModelX' });
    mockPrisma.model.update.mockResolvedValue({ id: 'm1', is_deleted: false, name: 'ModelX' });
    const req = { params: { id: 'm1' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.restoreModel(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Model restored successfully',
      model: { id: 'm1', is_deleted: false, name: 'ModelX' },
    });
  });
});
