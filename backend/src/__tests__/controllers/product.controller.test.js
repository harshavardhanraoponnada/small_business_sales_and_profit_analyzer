/**
 * Unit Tests: Product Controller
 */

const mockPrisma = {
  product: {
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
  transformProducts: jest.fn((items) => items),
  transformProduct: jest.fn((item) => item),
  packPrices: jest.fn(({ purchase_price, selling_price }) => ({ purchase_price, selling_price })),
};

jest.mock('../../services/prisma.service', () => mockPrisma);
jest.mock('../../services/audit.service', () => mockAuditService);
jest.mock('../../services/priceTransform.service', () => mockPriceTransform);

const controller = require('../../controllers/product.controller');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('Product Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('returns active products by default', async () => {
      const products = [{ id: 'p1', name: 'Phone' }];
      mockPrisma.product.findMany.mockResolvedValue(products);

      const req = { query: {} };
      const res = createMockRes();

      await controller.getProducts(req, res);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { is_deleted: false } })
      );
      expect(mockPriceTransform.transformProducts).toHaveBeenCalledWith(products);
      expect(res.json).toHaveBeenCalledWith(products);
    });

    it('includes deleted products when includeDeleted=true', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const req = { query: { includeDeleted: 'true' } };
      const res = createMockRes();

      await controller.getProducts(req, res);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('addProduct', () => {
    it('creates product and logs audit action', async () => {
      const created = {
        id: 'p1',
        name: 'Phone',
        category: { name: 'Mobiles' },
      };
      mockPrisma.product.create.mockResolvedValue(created);

      const req = {
        body: {
          name: 'Phone',
          sku: ' SKU-PHONE-001 ',
          brand: 'BrandX',
          category_id: 'c1',
          stock: 10,
          purchase_price: 200,
          selling_price: 300,
        },
        user: { id: 'u1', role: 'OWNER' },
      };
      const res = createMockRes();

      await controller.addProduct(req, res);

      expect(mockPriceTransform.packPrices).toHaveBeenCalledWith({ purchase_price: 200, selling_price: 300 });
      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Phone',
            sku: 'SKU-PHONE-001',
          }),
        })
      );
      expect(mockAuditService.logAction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product added', product: created });
    });
  });

  describe('updateProduct', () => {
    it('returns 404 when product is not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const req = { params: { id: 'p404' }, body: {}, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
    });

    it('updates product with packed prices and numeric stock', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', name: 'Phone' });
      const updated = { id: 'p1', name: 'Phone Pro', category: { name: 'Mobiles' } };
      mockPrisma.product.update.mockResolvedValue(updated);

      const req = {
        params: { id: 'p1' },
        body: {
          name: 'Phone Pro',
          sku: ' SKU-PRO-001 ',
          stock: '15',
          purchase_price: 220,
          selling_price: 330,
        },
        user: { id: 'u1' },
      };
      const res = createMockRes();

      await controller.updateProduct(req, res);

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({
            name: 'Phone Pro',
            sku: 'SKU-PRO-001',
            stock: 15,
            prices: { purchase_price: 220, selling_price: 330 },
          }),
        })
      );
      expect(mockAuditService.logAction).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Product updated', product: updated });
    });
  });

  describe('deleteProduct', () => {
    it('returns 404 when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const req = { params: { id: 'p404' }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
    });

    it('soft deletes product and returns success', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', name: 'Phone' });
      mockPrisma.product.update.mockResolvedValue({ id: 'p1', name: 'Phone', is_deleted: true });

      const req = { params: { id: 'p1' }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.deleteProduct(req, res);

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { is_deleted: true },
      });
      expect(res.json).toHaveBeenCalledWith({ message: 'Product deleted', productId: 'p1' });
    });
  });

  describe('restoreProduct', () => {
    it('restores a soft-deleted product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', name: 'Phone', is_deleted: true });
      const restored = { id: 'p1', name: 'Phone', is_deleted: false, category: { name: 'Mobiles' } };
      mockPrisma.product.update.mockResolvedValue(restored);

      const req = { params: { id: 'p1' }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.restoreProduct(req, res);

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'p1' }, data: { is_deleted: false } })
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Product restored', product: restored });
    });
  });
});
