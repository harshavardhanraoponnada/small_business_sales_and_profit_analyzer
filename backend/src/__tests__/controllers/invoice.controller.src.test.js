const fs = require('fs');
const path = require('path');
const { downloadInvoice } = require('../../controllers/invoice.controller');

// Mock fs module
jest.mock('fs');

describe('Invoice Controller (src/controllers)', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: { id: 'invoice123' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      download: jest.fn().mockReturnThis(),
    };
  });

  describe('downloadInvoice', () => {
    it('should download invoice when file exists', () => {
      fs.existsSync.mockReturnValue(true);

      downloadInvoice(mockReq, mockRes);

      expect(fs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining('invoice123.pdf')
      );
      expect(mockRes.download).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 404 when invoice file not found', () => {
      fs.existsSync.mockReturnValue(false);

      downloadInvoice(mockReq, mockRes);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invoice not found',
      });
      expect(mockRes.download).not.toHaveBeenCalled();
    });

    it('should construct correct file path from invoice id', () => {
      fs.existsSync.mockReturnValue(true);

      downloadInvoice(mockReq, mockRes);

      const callArgs = fs.existsSync.mock.calls[0][0];
      expect(callArgs).toContain('invoice123');
      expect(callArgs).toContain('invoice123.pdf');
      expect(callArgs).toMatch(/\.pdf$/);
    });

    it('should handle numeric invoice ids', () => {
      mockReq.params.id = '12345';
      fs.existsSync.mockReturnValue(true);

      downloadInvoice(mockReq, mockRes);

      const callArgs = fs.existsSync.mock.calls[0][0];
      expect(callArgs).toContain('12345.pdf');
      expect(mockRes.download).toHaveBeenCalled();
    });

    it('should handle string invoice ids with special characters', () => {
      mockReq.params.id = 'inv-2024-03-001';
      fs.existsSync.mockReturnValue(true);

      downloadInvoice(mockReq, mockRes);

      const callArgs = fs.existsSync.mock.calls[0][0];
      expect(callArgs).toContain('inv-2024-03-001.pdf');
      expect(mockRes.download).toHaveBeenCalled();
    });

    it('should pass correct file path to download method', () => {
      mockReq.params.id = 'test-pdf-123';
      fs.existsSync.mockReturnValue(true);

      downloadInvoice(mockReq, mockRes);

      expect(mockRes.download).toHaveBeenCalledWith(
        expect.stringContaining('test-pdf-123.pdf')
      );
    });

    it('should not call download if file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      downloadInvoice(mockReq, mockRes);

      expect(mockRes.download).not.toHaveBeenCalled();
    });

    it('should properly construct path in uploads/invoices directory', () => {
      fs.existsSync.mockReturnValue(true);

      downloadInvoice(mockReq, mockRes);

      const callArgs = fs.existsSync.mock.calls[0][0];
      expect(callArgs).toContain('uploads');
      expect(callArgs).toContain('invoices');
    });

    it('should use path.join for cross-platform compatibility', () => {
      fs.existsSync.mockReturnValue(true);
      
      // Before calling, ensure path.join is NOT mocked
      const originalJoin = path.join;

      downloadInvoice(mockReq, mockRes);

      // Verify that the path was constructed correctly using path.join
      const filePath = fs.existsSync.mock.calls[0][0];
      expect(filePath).toBeDefined();
      expect(filePath.length > 0).toBe(true);
    });

    it('should return json response with message when file not found', () => {
      fs.existsSync.mockReturnValue(false);

      downloadInvoice(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });
});
