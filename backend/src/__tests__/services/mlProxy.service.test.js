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

  describe('proxyRequest - HTTP Bridge', () => {
    it('should forward GET requests to ML service', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'predictions' }),
      });

      await mlProxyController.getSummary(
        { query: { periods: 30 } },
        mockResponse
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/summary'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: 'predictions' });
    });

    it('should forward POST requests to ML service', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Training started' }),
      });

      await mlProxyController.trainModels({}, mockResponse);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/train'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: '{}',
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should pass query parameters to ML service', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ forecast: [] }),
      });

      await mlProxyController.getSummary(
        { query: { periods: 60 } },
        mockResponse
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('periods=60'),
        expect.any(Object)
      );
    });

    it('should handle errors from ML service', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'ML service error' }),
      });

      await mlProxyController.getSummary(
        { query: { periods: 30 } },
        mockResponse
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'ML service error' })
      );
    });

    it('should gracefully handle network errors', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockRejectedValue(new Error('Network timeout'));

      await mlProxyController.getSummary(
        { query: { periods: 30 } },
        mockResponse
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('ML service error'),
        })
      );
    });
  });

  describe('getSummary', () => {
    it('should fetch predictions summary from ML service', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          summary: 'Sales summary forecast',
          confidence: 0.92,
        }),
      });

      await mlProxyController.getSummary(
        { query: { periods: 30 } },
        mockResponse
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/summary'),
        expect.any(Object)
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Sales summary forecast',
        })
      );
    });

    it('should use default periods if not specified', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ summary: [] }),
      });

      await mlProxyController.getSummary(
        { query: {} },
        mockResponse
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('periods=30'), // default
        expect.any(Object)
      );
    });
  });

  describe('getForecast', () => {
    it('should fetch forecast for specific type', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          type: 'sales',
          forecast: [100, 110, 120],
          confidence: 0.85,
        }),
      });

      await mlProxyController.getForecast(
        {
          params: { type: 'sales' },
          query: { periods: 30 },
        },
        mockResponse
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/forecast/sales'),
        expect.any(Object)
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sales',
        })
      );
    });

    it('should handle forecast types (sales, expense, revenue)', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ forecast: [] }),
      });

      const types = ['sales', 'expense', 'revenue'];

      for (const type of types) {
        await mlProxyController.getForecast(
          {
            params: { type },
            query: { periods: 60 },
          },
          mockResponse
        );

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/predictions/forecast/${type}`),
          expect.any(Object)
        );
      }
    });
  });

  describe('trainModels', () => {
    it('should trigger model training on ML service', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Training completed',
          models_trained: 3,
        }),
      });

      await mlProxyController.trainModels({}, mockResponse);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/train'),
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Training completed',
        })
      );
    });
  });

  describe('evaluateModel', () => {
    it('should fetch model evaluation results', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          type: 'sales',
          mae: 125.5,
          rmse: 165.3,
          accuracy: 0.92,
        }),
      });

      await mlProxyController.evaluateModel(
        { params: { type: 'sales' } },
        mockResponse
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/evaluate/sales'),
        expect.any(Object)
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accuracy: 0.92,
        })
      );
    });

    it('should use ML_SERVICE_URL from environment', async () => {
      process.env.ML_SERVICE_URL = 'http://ml-service:6000';

      // Re-import the module to pick up new env var
      delete require.cache[require.resolve('../../controllers/mlProxy.controller')];
      mlProxyController = require('../../controllers/mlProxy.controller');

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      });

      await mlProxyController.getSummary(
        { query: { periods: 30 } },
        mockResponse
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('http://ml-service:6000'),
        expect.any(Object)
      );

      // Cleanup
      delete process.env.ML_SERVICE_URL;
    });
  });
});
