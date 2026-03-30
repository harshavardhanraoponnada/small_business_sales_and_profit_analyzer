/**
 * Invoice Controller Tests
 * Tests invoice download and generation functionality
 */

// Set up mocks BEFORE requiring the controller
jest.mock('../../services/pdf.service');
jest.mock('fs');

const fs = require('fs');
const path = require('path');
const { generateInvoicePDF } = require('../../services/pdf.service');

// Mock prisma module with proper jest.mock usage
const mockPrismaModule = {
  sale: {
    findUnique: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaModule),
}));

// Now require the controller after all mocks are set up
const { downloadInvoice } = require('../../invoices/invoice.controller');

describe('Invoice Controller', () => {
  let mockRes;
  let mockReq;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      download: jest.fn().mockReturnThis(),
    };

    // Mock fs - set default to file doesn't exist
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.mkdirSync = jest.fn();

    // Mock PDF generation
    generateInvoicePDF.mockResolvedValue(undefined);
  });

  describe('downloadInvoice', () => {
    it('should download invoice when sale exists', async () => {
      const mockSale = {
        id: 'sale123',
        quantity: 2,
        unit_price: 5000,
        date: '2024-03-30',
        variant: {
          variant_name: 'Black',
          model: {
            name: 'Phone X',
            brand: { name: 'PhoneVerse' },
          },
        },
        product: null,
      };

      mockPrismaModule.sale.findUnique.mockResolvedValue(mockSale);
      fs.existsSync.mockReturnValue(true); // File already exists

      mockReq = { params: { id: 'sale123' } };

      await downloadInvoice(mockReq, mockRes);

      expect(mockRes.download).toHaveBeenCalledWith(
        expect.stringContaining('sale123.pdf')
      );
    });

    it('should return 404 when sale not found', async () => {
      mockPrismaModule.sale.findUnique.mockResolvedValue(null);

      mockReq = { params: { id: 'nonexistent' } };

      await downloadInvoice(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Sale not found',
        })
      );
    });

    it('should generate PDF when file does not exist', async () => {
      const mockSale = {
        id: 'sale456',
        quantity: 1,
        unit_price: 10000,
        date: '2024-03-30',
        variant: {
          variant_name: 'Gold',
          model: {
            name: 'Phone Y',
            brand: { name: 'PhoneVerse' },
          },
        },
        product: null,
      };

      mockPrismaModule.sale.findUnique.mockResolvedValue(mockSale);
      fs.existsSync.mockReturnValue(false); // File doesn't exist

      mockReq = { params: { id: 'sale456' } };

      await downloadInvoice(mockReq, mockRes);

      expect(generateInvoicePDF).toHaveBeenCalled();
      expect(generateInvoicePDF).toHaveBeenCalledWith(
        expect.stringContaining('sale456.pdf'),
        expect.objectContaining({
          invoiceId: 'sale456',
          date: '2024-03-30',
          items: expect.arrayContaining([
            expect.objectContaining({
              name: 'PhoneVerse Phone Y - Gold',
              qty: 1,
              price: 10000,
              total: 10000,
            }),
          ]),
          total: 10000,
        })
      );
    });

    it('should use product name when variant not available', async () => {
      const mockSale = {
        id: 'sale789',
        quantity: 3,
        unit_price: 2000,
        date: '2024-03-30',
        variant: null,
        product: { name: 'Generic Product' },
      };

      mockPrismaModule.sale.findUnique.mockResolvedValue(mockSale);
      fs.existsSync.mockReturnValue(false);

      mockReq = { params: { id: 'sale789' } };

      await downloadInvoice(mockReq, mockRes);

      expect(generateInvoicePDF).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              name: 'Generic Product',
              qty: 3,
              price: 2000,
              total: 6000,
            }),
          ]),
        })
      );
    });

    it('should use "Unknown Product" when no variant or product', async () => {
      const mockSale = {
        id: 'sale999',
        quantity: 1,
        unit_price: 5000,
        date: '2024-03-30',
        variant: null,
        product: null,
      };

      mockPrismaModule.sale.findUnique.mockResolvedValue(mockSale);
      fs.existsSync.mockReturnValue(false);

      mockReq = { params: { id: 'sale999' } };

      await downloadInvoice(mockReq, mockRes);

      expect(generateInvoicePDF).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              name: 'Unknown Product',
              qty: 1,
              price: 5000,
            }),
          ]),
        })
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaModule.sale.findUnique.mockRejectedValue(dbError);

      mockReq = { params: { id: 'sale333' } };

      await downloadInvoice(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error downloading invoice',
        })
      );
    });

    it('should handle PDF generation errors', async () => {
      const mockSale = {
        id: 'sale444',
        quantity: 1,
        unit_price: 5000,
        date: '2024-03-30',
        variant: null,
        product: { name: 'Product' },
      };

      mockPrismaModule.sale.findUnique.mockResolvedValue(mockSale);
      fs.existsSync.mockReturnValue(false);
      generateInvoicePDF.mockRejectedValue(new Error('PDF generation failed'));

      mockReq = { params: { id: 'sale444' } };

      await downloadInvoice(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error downloading invoice',
        })
      );
    });

    it('should correctly calculate total price', async () => {
      const mockSale = {
        id: 'sale555',
        quantity: 5,
        unit_price: 1500,
        date: '2024-03-30',
        variant: null,
        product: { name: 'Item' },
      };

      mockPrismaModule.sale.findUnique.mockResolvedValue(mockSale);
      fs.existsSync.mockReturnValue(false);

      mockReq = { params: { id: 'sale555' } };

      await downloadInvoice(mockReq, mockRes);

      expect(generateInvoicePDF).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          items: [
            {
              name: 'Item',
              qty: 5,
              price: 1500,
              total: 7500,
            },
          ],
          total: 7500,
        })
      );
    });

    it('should handle Decimal unit_price conversion', async () => {
      const mockSale = {
        id: 'sale666',
        quantity: 1,
        unit_price: { toString: () => '9999.99' }, // Decimal object
        date: '2024-03-30',
        variant: null,
        product: { name: 'Expensive Item' },
      };

      mockPrismaModule.sale.findUnique.mockResolvedValue(mockSale);
      fs.existsSync.mockReturnValue(false);

      mockReq = { params: { id: 'sale666' } };

      await downloadInvoice(mockReq, mockRes);

      expect(generateInvoicePDF).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          items: [
            expect.objectContaining({
              price: 9999.99,
              total: 9999.99,
            }),
          ],
        })
      );
    });
  });
});
