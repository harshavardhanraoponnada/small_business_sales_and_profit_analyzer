/**
 * Unit Tests: Invoice Service
 * Tests invoice.service.js PDF generation functionality
 */

jest.mock('pdfkit');
jest.mock('fs');
jest.mock('path');

describe('Invoice Service', () => {
  let invoiceService;
  let mockDocumentStream;
  let mockFileStream;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs.createWriteStream
    mockFileStream = {
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    };

    require('fs').createWriteStream = jest.fn(() => mockFileStream);

    // Mock PDFDocument
    const PDFDocument = require('pdfkit');
    mockDocumentStream = {
      pipe: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };

    PDFDocument.mockImplementation(() => mockDocumentStream);

    // Mock path.join
    require('path').join = jest.fn((...args) => args.join('/'));

    // Clear require cache and re-import
    delete require.cache[require.resolve('../../services/invoice.service')];
    invoiceService = require('../../services/invoice.service');
  });

  describe('generateInvoice', () => {
    it('should generate invoice PDF with correct path', () => {
      const result = invoiceService.generateInvoice({
        invoiceId: 'INV001',
        item: { name: 'Product A', selling_price: 100 },
        itemType: 'product',
        quantity: 2,
        total: 200,
      });

      expect(result).toContain('INV001.pdf');
      expect(require('fs').createWriteStream).toHaveBeenCalled();
    });

    it('should pipe PDF document to file stream', () => {
      invoiceService.generateInvoice({
        invoiceId: 'INV002',
        item: { name: 'Product B', selling_price: 50 },
        itemType: 'product',
        quantity: 1,
        total: 50,
      });

      expect(mockDocumentStream.pipe).toHaveBeenCalledWith(mockFileStream);
    });

    it('should write header with company name', () => {
      invoiceService.generateInvoice({
        invoiceId: 'INV003',
        item: { name: 'Product C', selling_price: 75 },
        itemType: 'product',
        quantity: 1,
        total: 75,
      });

      expect(mockDocumentStream.fontSize).toHaveBeenCalledWith(18);
      expect(mockDocumentStream.text).toHaveBeenCalledWith('Harsha Mobile World', expect.any(Object));
    });

    it('should include invoice ID and date', () => {
      invoiceService.generateInvoice({
        invoiceId: 'INV004',
        item: { name: 'Product D', selling_price: 200 },
        itemType: 'product',
        quantity: 1,
        total: 200,
      });

      expect(mockDocumentStream.text).toHaveBeenCalledWith(expect.stringContaining('Invoice No: INV004'));
    });

    it('should handle variant items correctly', () => {
      invoiceService.generateInvoice({
        invoiceId: 'INV005',
        item: { variant_name: 'Galaxy S21 Black', selling_price: 999 },
        itemType: 'variant',
        quantity: 1,
        total: 999,
      });

      expect(mockDocumentStream.text).toHaveBeenCalledWith(expect.stringContaining('Variant'));
      expect(mockDocumentStream.text).toHaveBeenCalledWith(expect.stringContaining('Galaxy S21 Black'));
    });

    it('should format currency using number formatter', () => {
      invoiceService.generateInvoice({
        invoiceId: 'INV006',
        item: { name: 'Expensive Item', selling_price: 10000 },
        itemType: 'product',
        quantity: 1,
        total: 10000,
      });

      // Should call text with formatted number (₹ symbol expected from formatNumber)
      expect(mockDocumentStream.text).toHaveBeenCalled();
    });

    it('should include quantity and unit price', () => {
      invoiceService.generateInvoice({
        invoiceId: 'INV007',
        item: { name: 'Bulk Item', selling_price: 50 },
        itemType: 'product',
        quantity: 10,
        total: 500,
      });

      expect(mockDocumentStream.text).toHaveBeenCalledWith(expect.stringContaining('Quantity: 10'));
      expect(mockDocumentStream.text).toHaveBeenCalledWith(expect.stringContaining('Unit Price'));
    });

    it('should display total amount on the right', () => {
      invoiceService.generateInvoice({
        invoiceId: 'INV008',
        item: { name: 'Product', selling_price: 123 },
        itemType: 'product',
        quantity: 2,
        total: 246,
      });

      expect(mockDocumentStream.fontSize).toHaveBeenCalledWith(14);
      expect(mockDocumentStream.text).toHaveBeenCalledWith(
        expect.stringContaining('Total Amount'),
        expect.objectContaining({ align: 'right' })
      );
    });

    it('should finalize the PDF document', () => {
      invoiceService.generateInvoice({
        invoiceId: 'INV009',
        item: { name: 'Final Product', selling_price: 99 },
        itemType: 'product',
        quantity: 1,
        total: 99,
      });

      expect(mockDocumentStream.end).toHaveBeenCalled();
    });
  });
});
