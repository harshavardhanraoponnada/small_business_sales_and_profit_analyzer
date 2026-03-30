/**
 * Unit Tests: Brand Controller
 */

const mockPrisma = {
  brand: {
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

const controller = require('../../controllers/brand.controller');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('Brand Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getBrands filters by category and non-deleted by default', async () => {
    mockPrisma.brand.findMany.mockResolvedValue([{ id: 'b1', name: 'BrandX' }]);

    const req = { query: { categoryId: 'c1' } };
    const res = createMockRes();

    await controller.getBrands(req, res);

    expect(mockPrisma.brand.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category_id: 'c1', is_deleted: false } })
    );
  });

  it('addBrand creates brand', async () => {
    mockPrisma.brand.create.mockResolvedValue({ id: 'b1', name: 'BrandX' });
    const req = { body: { name: 'BrandX', category_id: 'c1' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.addBrand(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockAuditService.logAction).toHaveBeenCalled();
  });

  it('updateBrand returns 404 when brand not found', async () => {
    mockPrisma.brand.findUnique.mockResolvedValue(null);
    const req = { params: { id: 'b404' }, body: { name: 'X' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.updateBrand(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Brand not found' });
  });

  it('updateBrand updates brand when found', async () => {
    mockPrisma.brand.findUnique.mockResolvedValue({ id: 'b1', name: 'Old' });
    mockPrisma.brand.update.mockResolvedValue({ id: 'b1', name: 'New' });
    const req = { params: { id: 'b1' }, body: { name: 'New' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.updateBrand(req, res);

    expect(mockPrisma.brand.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ id: 'b1', name: 'New' });
  });

  it('deleteBrand soft deletes', async () => {
    mockPrisma.brand.findUnique.mockResolvedValue({ id: 'b1', name: 'BrandX' });
    mockPrisma.brand.update.mockResolvedValue({ id: 'b1', is_deleted: true, name: 'BrandX' });
    const req = { params: { id: 'b1' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.deleteBrand(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Brand deleted successfully', brandId: 'b1' });
  });

  it('restoreBrand restores deleted brand', async () => {
    mockPrisma.brand.findUnique.mockResolvedValue({ id: 'b1', is_deleted: true, name: 'BrandX' });
    mockPrisma.brand.update.mockResolvedValue({ id: 'b1', is_deleted: false, name: 'BrandX' });
    const req = { params: { id: 'b1' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.restoreBrand(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Brand restored successfully',
      brand: { id: 'b1', is_deleted: false, name: 'BrandX' },
    });
  });
});
