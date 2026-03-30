/**
 * PDF Service Tests
 * Tests invoice PDF generation functionality
 */

jest.mock('pdfkit');
jest.mock('fs');

const PDFDocument = require('pdfkit');
const fs = require('fs');
const { generateInvoicePDF } = require('../../services/pdf.service');

describe('PDF Service', () => {
  let mockDoc;
  let mockStream;
  let mockCreateWriteStream;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock PDFDocument methods
    mockDoc = {
      pipe: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };

    // Mock stream
    mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          mockStream.finishCallback = callback;
        }
        return mockStream;
      }),
    };

    // Mock fs.createWriteStream
    mockCreateWriteStream = jest.fn(() => mockStream);
    fs.createWriteStream = mockCreateWriteStream;

    // Mock PDFDocument constructor
    PDFDocument.mockImplementation(() => mockDoc);
  });

  describe('generateInvoicePDF', () => {
    it('should create a PDF document with correct margin', async () => {
      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items: [],
        total: 0,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(PDFDocument).toHaveBeenCalledWith({ margin: 40 });
      
      // Resolve the promise
      mockStream.finishCallback();
      await promise;
    });

    it('should create file stream at correct path', async () => {
      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items: [],
        total: 0,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockCreateWriteStream).toHaveBeenCalledWith('/path/to/invoice.pdf');
      
      mockStream.finishCallback();
      await promise;
    });

    it('should pipe document to stream', async () => {
      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items: [],
        total: 0,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockDoc.pipe).toHaveBeenCalledWith(mockStream);
      
      mockStream.finishCallback();
      await promise;
    });

    it('should add header with title and subtitle', async () => {
      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items: [],
        total: 0,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockDoc.fontSize).toHaveBeenCalledWith(18);
      expect(mockDoc.text).toHaveBeenCalledWith('PhoneVerse', { align: 'center' });
      expect(mockDoc.fontSize).toHaveBeenCalledWith(10);
      expect(mockDoc.text).toHaveBeenCalledWith('Small Business Sales & Profit Analyzer', { align: 'center' });
      
      mockStream.finishCallback();
      await promise;
    });

    it('should add invoice ID and date', async () => {
      const invoice = {
        invoiceId: 'INV-2024-001',
        date: '2024-03-30',
        items: [],
        total: 0,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockDoc.text).toHaveBeenCalledWith('Invoice No: INV-2024-001');
      expect(mockDoc.text).toHaveBeenCalledWith('Date: 2024-03-30');
      
      mockStream.finishCallback();
      await promise;
    });

    it('should add items header', async () => {
      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items: [],
        total: 0,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockDoc.text).toHaveBeenCalledWith('Items:');
      
      mockStream.finishCallback();
      await promise;
    });

    it('should format and add single item', async () => {
      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items: [
          { name: 'Phone X', qty: 1, price: 50000, total: 50000 },
        ],
        total: 50000,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('1. Phone X')
      );
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Qty: 1')
      );
      
      mockStream.finishCallback();
      await promise;
    });

    it('should format and add multiple items', async () => {
      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items: [
          { name: 'Phone A', qty: 2, price: 30000, total: 60000 },
          { name: 'Phone B', qty: 1, price: 40000, total: 40000 },
          { name: 'Accessory', qty: 5, price: 500, total: 2500 },
        ],
        total: 102500,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      // Check all items are added (looks for item numbers)
      const textCalls = mockDoc.text.mock.calls.filter(call => 
        typeof call[0] === 'string' && call[0].includes('.')
      );
      expect(textCalls.length).toBeGreaterThanOrEqual(3);
      
      mockStream.finishCallback();
      await promise;
    });

    it('should add formatted total', async () => {
      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items: [
          { name: 'Item', qty: 1, price: 12345, total: 12345 },
        ],
        total: 12345,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockDoc.fontSize).toHaveBeenCalledWith(14);
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Total:'),
        { align: 'right' }
      );
      
      mockStream.finishCallback();
      await promise;
    });

    it('should end the document', async () => {
      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items: [],
        total: 0,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockDoc.end).toHaveBeenCalled();
      
      mockStream.finishCallback();
      await promise;
    });

    it('should handle large invoice with many items', async () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        name: `Product ${i + 1}`,
        qty: (i + 1),
        price: (i + 1) * 1000,
        total: (i + 1) * (i + 1) * 1000,
      }));

      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items,
        total: items.reduce((sum, item) => sum + item.total, 0),
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockDoc.pipe).toHaveBeenCalled();
      expect(mockDoc.end).toHaveBeenCalled();
      
      mockStream.finishCallback();
      await promise;
    });

    it('should handle invoice with zero items', async () => {
      const invoice = {
        invoiceId: 'INV-EMPTY',
        date: '2024-01-15',
        items: [],
        total: 0,
      };

      const promise = generateInvoicePDF('/path/to/empty.pdf', invoice);

      expect(mockDoc.pipe).toHaveBeenCalled();
      expect(mockDoc.end).toHaveBeenCalled();
      
      mockStream.finishCallback();
      await promise;
    });

    it('should resolve when stream finishes', async () => {
      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items: [],
        total: 0,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockStream.on).toHaveBeenCalledWith('finish', expect.any(Function));

      // Resolve by calling the finish callback
      mockStream.finishCallback();
      
      const result = await promise;
      expect(result).toBeUndefined();
    });

    it('should handle special characters in invoice data', async () => {
      const invoice = {
        invoiceId: 'INV-2024-©',
        date: '2024-01-15',
        items: [
          { name: 'Product™ (Edition 2)', qty: 1, price: 999, total: 999 },
        ],
        total: 999,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockDoc.pipe).toHaveBeenCalled();
      
      mockStream.finishCallback();
      await promise;
    });

    it('should call moveDown for spacing', async () => {
      const invoice = {
        invoiceId: 'INV001',
        date: '2024-01-15',
        items: [],
        total: 0,
      };

      const promise = generateInvoicePDF('/path/to/invoice.pdf', invoice);

      expect(mockDoc.moveDown).toHaveBeenCalled();
      
      mockStream.finishCallback();
      await promise;
    });
  });
});
