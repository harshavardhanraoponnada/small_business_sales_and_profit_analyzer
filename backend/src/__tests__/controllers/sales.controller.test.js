/**
 * Unit Tests: Sales Controller
 */

const mockPrisma = {
  sale: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  variant: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockInvoiceService = {
  generateInvoice: jest.fn(),
};

jest.mock('../../services/prisma.service', () => mockPrisma);
jest.mock('../../services/invoice.service', () => mockInvoiceService);

const controller = require('../../controllers/sales.controller');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('Sales Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSales', () => {
    it('returns non-deleted sales', async () => {
      const sales = [{ id: 's1', total: 100 }];
      mockPrisma.sale.findMany.mockResolvedValue(sales);

      const req = {};
      const res = createMockRes();

      await controller.getSales(req, res);

      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { is_deleted: false } })
      );
      expect(res.json).toHaveBeenCalledWith(sales);
    });

    it('returns 500 when sales query fails', async () => {
      mockPrisma.sale.findMany.mockRejectedValue(new Error('DB down'));

      const req = {};
      const res = createMockRes();

      await controller.getSales(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('addSale', () => {
    it('returns 400 when quantity is invalid', async () => {
      const req = { body: { product_id: 'p1', quantity: 0 }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.addSale(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Quantity must be a positive number' });
    });

    it('returns 400 when product_id and variant_id are both missing', async () => {
      const req = { body: { quantity: 1 }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.addSale(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Either product_id or variant_id must be provided' });
    });

    it('returns 404 when variant is not found', async () => {
      mockPrisma.variant.findUnique.mockResolvedValue(null);

      const req = { body: { variant_id: 'v404', quantity: 1 }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.addSale(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Variant not found' });
    });

    it('returns 400 when variant stock is insufficient', async () => {
      mockPrisma.variant.findUnique.mockResolvedValue({ id: 'v1', stock: 1, model: { name: 'M1' } });

      const req = { body: { variant_id: 'v1', quantity: 2 }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.addSale(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient stock' });
    });

    it('creates sale for variant and generates invoice', async () => {
      mockPrisma.variant.findUnique.mockResolvedValue({ id: 'v1', stock: 5, model: { name: 'M1' } });
      mockPrisma.variant.update.mockResolvedValue({ id: 'v1', stock: 3 });
      mockPrisma.sale.create.mockResolvedValue({ id: 's1', total: 200, user: { username: 'owner' } });

      const req = { body: { variant_id: 'v1', quantity: 2, unit_price: 100 }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.addSale(req, res);

      expect(mockPrisma.variant.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: { stock: 3 },
      });
      expect(mockPrisma.sale.create).toHaveBeenCalled();
      expect(mockInvoiceService.generateInvoice).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Sale recorded', invoice_id: expect.any(String) })
      );
    });

    it('returns 404 when product is not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const req = { body: { product_id: 'p404', quantity: 1 }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.addSale(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
    });

    it('returns 400 when product stock is insufficient', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', stock: 1, name: 'Phone' });

      const req = { body: { product_id: 'p1', quantity: 2 }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.addSale(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient stock' });
    });

    it('creates sale for product and generates invoice', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', stock: 10, name: 'Phone' });
      mockPrisma.product.update.mockResolvedValue({ id: 'p1', stock: 8 });
      mockPrisma.sale.create.mockResolvedValue({ id: 's1', total: 200, user: { username: 'owner' } });

      const req = { body: { product_id: 'p1', quantity: 2, unit_price: 100 }, user: { id: 'u1' } };
      const res = createMockRes();

      await controller.addSale(req, res);

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { stock: 8 },
      });
      expect(mockInvoiceService.generateInvoice).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Sale recorded', invoice_id: expect.any(String) })
      );
    });
  });
});
