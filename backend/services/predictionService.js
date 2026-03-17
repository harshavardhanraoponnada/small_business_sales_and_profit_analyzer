const prophet = require('prophet-js');
const Database = require('../models/database');
const DataProcessor = require('../utils/dataProcessor');
const fs = require('fs').promises;
const path = require('path');

class PredictionService {
  constructor() {
    this.modelsCache = new Map();
    this.modelPath = path.join(__dirname, '../models/trained');
  }

  async getHistoricalData(userId, type) {
    try {
      let data = [];
      if (type === 'sales') {
        data = await Database.getSalesData(userId);
      } else if (type === 'expenses') {
        data = await Database.getExpensesData(userId);
      }
      return DataProcessor.formatForProphet(data);
    } catch (error) {
      throw new Error(`Failed to fetch ${type} data: ${error.message}`);
    }
  }

  async trainModel(userId, type) {
    try {
      const historicalData = await this.getHistoricalData(userId, type);
      
      if (historicalData.length < 10) {
        throw new Error(`Insufficient data for ${type} forecasting. Need at least 10 data points.`);
      }

      const m = new prophet.Prophet({
        interval_width: 0.95,
        yearly_seasonality: true,
        weekly_seasonality: true,
        daily_seasonality: false,
        seasonality_mode: 'additive'
      });

      m.add_regressor('trend');
      m.fit(historicalData);

      const modelKey = `${userId}_${type}`;
      this.modelsCache.set(modelKey, m);

      return { status: 'trained', type, dataPoints: historicalData.length };
    } catch (error) {
      throw new Error(`Model training failed for ${type}: ${error.message}`);
    }
  }

  async forecastSales(userId, periods = 30) {
    try {
      const modelKey = `${userId}_sales`;
      let model = this.modelsCache.get(modelKey);

      if (!model) {
        await this.trainModel(userId, 'sales');
        model = this.modelsCache.get(modelKey);
      }

      const future = model.make_future_dataframe({ periods });
      const forecast = model.predict(future);

      return this.formatForecastResponse(forecast, periods);
    } catch (error) {
      throw new Error(`Sales forecast failed: ${error.message}`);
    }
  }

  async forecastExpenses(userId, periods = 30) {
    try {
      const modelKey = `${userId}_expenses`;
      let model = this.modelsCache.get(modelKey);

      if (!model) {
        await this.trainModel(userId, 'expenses');
        model = this.modelsCache.get(modelKey);
      }

      const future = model.make_future_dataframe({ periods });
      const forecast = model.predict(future);

      return this.formatForecastResponse(forecast, periods);
    } catch (error) {
      throw new Error(`Expenses forecast failed: ${error.message}`);
    }
  }

  async forecastProfit(userId, periods = 30) {
    try {
      const salesForecast = await this.forecastSales(userId, periods);
      const expensesForecast = await this.forecastExpenses(userId, periods);

      const profitForecast = salesForecast.map((sale, index) => ({
        date: sale.date,
        forecast: sale.forecast - expensesForecast[index].forecast,
        lower: sale.lower - expensesForecast[index].upper,
        upper: sale.upper - expensesForecast[index].lower,
        actual: sale.actual ? sale.actual - expensesForecast[index].actual : null
      }));

      return profitForecast;
    } catch (error) {
      throw new Error(`Profit forecast failed: ${error.message}`);
    }
  }

  async getAllPredictions(userId) {
    try {
      const [sales, expenses, profit] = await Promise.all([
        this.forecastSales(userId, 30),
        this.forecastExpenses(userId, 30),
        this.forecastProfit(userId, 30)
      ]);

      return {
        sales: { data: sales, accuracy: this.calculateAccuracy(sales) },
        expenses: { data: expenses, accuracy: this.calculateAccuracy(expenses) },
        profit: { data: profit, accuracy: this.calculateAccuracy(profit) }
      };
    } catch (error) {
      throw new Error(`Failed to get all predictions: ${error.message}`);
    }
  }

  async trainAllModels(userId) {
    try {
      const results = await Promise.all([
        this.trainModel(userId, 'sales'),
        this.trainModel(userId, 'expenses')
      ]);
      return results;
    } catch (error) {
      throw new Error(`Failed to train all models: ${error.message}`);
    }
  }

  formatForecastResponse(forecast, periods) {
    return forecast.slice(-periods).map(row => ({
      date: row.ds,
      forecast: Math.round(row.yhat * 100) / 100,
      upper: Math.round(row.yhat_upper * 100) / 100,
      lower: Math.round(row.yhat_lower * 100) / 100,
      actual: row.y || null
    }));
  }

  calculateAccuracy(forecast) {
    const actuals = forecast.filter(f => f.actual !== null);
    if (actuals.length === 0) return 0;

    const mape = actuals.reduce((sum, f) => {
      return sum + Math.abs((f.actual - f.forecast) / f.actual);
    }, 0) / actuals.length;

    return Math.round((1 - mape) * 100);
  }
}

module.exports = new PredictionService();
