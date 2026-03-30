/**
 * Unit Tests: Variant Controller
 */

const mockPrisma = {
  variant: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockAuditService = {
  logAction: jest.fn(),
};

const mockPriceTransform = {
  transformVariants: jest.fn((items) => items),
  transformVariant: jest.fn((item) => item),
  packPrices: jest.fn((prices) => prices),
};

jest.mock('../../services/prisma.service', () => mockPrisma);
jest.mock('../../services/audit.service', () => mockAuditService);
jest.mock('../../services/priceTransform.service', () => mockPriceTransform);

const controller = require('../../controllers/variant.controller');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('Variant Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getVariants returns transformed variants', async () => {
    mockPrisma.variant.findMany.mockResolvedValue([{ id: 'v1', variant_name: '128GB' }]);
    const req = { query: {} };
    const res = createMockRes();

    await controller.getVariants(req, res);

    expect(mockPrisma.variant.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { is_deleted: false } }));
    expect(mockPriceTransform.transformVariants).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it('addVariant creates variant and logs action', async () => {
    const variant = { id: 'v1', variant_name: '128GB', model: { name: 'ModelX' } };
    mockPrisma.variant.create.mockResolvedValue(variant);

    const req = {
      body: {
        model_id: 'm1',
        variant_name: '128GB',
        stock: '5',
        purchase_price: 100,
        selling_price: 150,
        reorder_level: 2,
      },
      user: { id: 'u1' },
    };
    const res = createMockRes();

    await controller.addVariant(req, res);

    expect(mockPriceTransform.packPrices).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockAuditService.logAction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(variant);
  });

  it('updateVariant returns 404 when variant not found', async () => {
    mockPrisma.variant.findUnique.mockResolvedValue(null);

    const req = { params: { id: 'v404' }, body: {}, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.updateVariant(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Variant not found' });
  });

  it('updateVariant packs prices and updates stock as number', async () => {
    mockPrisma.variant.findUnique.mockResolvedValue({ id: 'v1', variant_name: '128GB' });
    const updated = { id: 'v1', variant_name: '256GB', model: { name: 'ModelX' } };
    mockPrisma.variant.update.mockResolvedValue(updated);

    const req = {
      params: { id: 'v1' },
      body: {
        variant_name: '256GB',
        stock: '7',
        purchase_price: 120,
        selling_price: 180,
        reorder_level: 3,
      },
      user: { id: 'u1' },
    };
    const res = createMockRes();

    await controller.updateVariant(req, res);

    expect(mockPrisma.variant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'v1' },
        data: expect.objectContaining({
          stock: 7,
          prices: { purchase_price: 120, selling_price: 180, reorder_level: 3 },
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('deleteVariant soft deletes variant', async () => {
    mockPrisma.variant.findUnique.mockResolvedValue({ id: 'v1', variant_name: '128GB' });
    mockPrisma.variant.update.mockResolvedValue({ id: 'v1', is_deleted: true, variant_name: '128GB' });

    const req = { params: { id: 'v1' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.deleteVariant(req, res);

    expect(mockPrisma.variant.update).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { is_deleted: true } });
    expect(res.json).toHaveBeenCalledWith({ message: 'Variant deleted successfully', variantId: 'v1' });
  });

  it('restoreVariant restores and transforms variant', async () => {
    mockPrisma.variant.findUnique.mockResolvedValue({ id: 'v1', is_deleted: true, variant_name: '128GB' });
    const restored = { id: 'v1', is_deleted: false, variant_name: '128GB', model: { name: 'ModelX' } };
    mockPrisma.variant.update.mockResolvedValue(restored);

    const req = { params: { id: 'v1' }, user: { id: 'u1' } };
    const res = createMockRes();

    await controller.restoreVariant(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Variant restored successfully',
      variant: restored,
    });
  });
});
