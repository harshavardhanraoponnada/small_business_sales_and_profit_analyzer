/**
 * Unit Tests: ML Proxy Controller
 * Tests mlProxy.controller.js HTTP bridge functionality to Flask service
 */

global.fetch = jest.fn();

describe('ML Proxy Controller', () => {
  let mlProxyController;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    delete require.cache[require.resolve('../../controllers/mlProxy.controller')];
    mlProxyController = require('../../controllers/mlProxy.controller');
  });

  describe('getSummary - Predictions API', () => {
    it('should fetch summary predictions from ML service', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'summary predictions' }),
      });

      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockReq = { query: { periods: 30 } };

      await mlProxyController.getSummary(mockReq, mockRes);

      expect(global.fetch).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle default periods parameter', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'predictions' }),
      });

      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockReq = { query: {} };

      await mlProxyController.getSummary(mockReq, mockRes);

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('getForecast - Forecast API', () => {
    it('should fetch forecast from ML service', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ forecast: 'data' }),
      });

      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockReq = { params: { type: 'sales' }, query: { periods: 30 } };

      await mlProxyController.getForecast(mockReq, mockRes);

      expect(global.fetch).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('trainModels - Training API', () => {
    it('should send POST request to train models', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Training started' }),
      });

      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockReq = { body: {} };

      await mlProxyController.trainModels(mockReq, mockRes);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/train'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('evaluateModel - Evaluation API', () => {
    it('should evaluate model for specific type', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ accuracy: 0.95 }),
      });

      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockReq = { params: { type: 'sales' } };

      await mlProxyController.evaluateModel(mockReq, mockRes);

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle ML service errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Service unavailable' }),
      });

      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockReq = { query: { periods: 30 } };

      await mlProxyController.getSummary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockReq = { query: { periods: 30 } };

      await mlProxyController.getSummary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('ML service error')
        })
      );
    });
  });
});
