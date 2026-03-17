const PredictionService = require('./predictionService');
const ModelTrainer = require('./modelTrainer');

class MLService {
  async getPredictions(userId, type, periods = 30) {
    try {
      const predictions = await PredictionService.forecast(userId, type, periods);
      return predictions;
    } catch (error) {
      throw new Error(`ML Service Error: ${error.message}`);
    }
  }

  async trainModels(userId) {
    try {
      const results = await ModelTrainer.trainAll(userId);
      return results;
    } catch (error) {
      throw new Error(`Model Training Error: ${error.message}`);
    }
  }

  async getModelMetrics(userId) {
    try {
      const metrics = await ModelTrainer.getMetrics(userId);
      return metrics;
    } catch (error) {
      throw new Error(`Metrics Error: ${error.message}`);
    }
  }
}

module.exports = new MLService();
