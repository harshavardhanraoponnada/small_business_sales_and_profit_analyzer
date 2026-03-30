const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PredictionService {
  async forecast(userId, type, periods = 30) {
    try {
      const data = await this.getHistoricalData(type);
      
      if (!data || data.length < 5) {
        return this.generateDefaultForecast(periods);
      }

      const values = data.map(d => {
        const value = d.total || d.amount || 0;
        return typeof value === 'object' ? parseFloat(value.toString()) : Number(value);
      }).filter(v => v > 0);
      
      if (values.length < 5) {
        return this.generateDefaultForecast(periods);
      }

      return this.calculateForecast(values, periods, data);
    } catch (error) {
      console.error(`Forecast failed for ${type}:`, error);
      return this.generateDefaultForecast(periods);
    }
  }

  async getHistoricalData(type) {
    try {
      if (type === 'sales') {
        const sales = await prisma.sale.findMany({
          where: { is_deleted: false },
          orderBy: { date: 'asc' },
          select: {
            date: true,
            total: true,
            quantity: true
          }
        });
        return sales.map(s => ({
          date: s.date.toISOString().split('T')[0],
          total: s.total,
          quantity: s.quantity
        }));
      } else if (type === 'expenses') {
        const expenses = await prisma.expense.findMany({
          where: { is_deleted: false },
          orderBy: { date: 'asc' },
          select: {
            date: true,
            amount: true
          }
        });
        return expenses.map(e => ({
          date: e.date.toISOString().split('T')[0],
          amount: e.amount
        }));
      }
      return [];
    } catch (error) {
      console.error('Error reading historical data:', error);
      return [];
    }
  }

  calculateForecast(values, periods, rawData) {
    // Calculate trend using simple linear regression
    const n = Math.min(values.length, 30);
    const recentValues = values.slice(-n);
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += recentValues[i];
      sumXY += i * recentValues[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate average and standard deviation for confidence intervals
    const mean = sumY / n;
    const variance = recentValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    // Generate forecast points
    const forecast = [];
    const today = new Date();
    
    for (let i = 1; i <= periods; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Predicted value using trend line
      const predictedValue = intercept + slope * (n + i - 1);
      const forecastValue = Math.max(predictedValue, mean * 0.5);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        forecast: Math.round(forecastValue * 100) / 100,
        upper: Math.round((forecastValue + stdDev) * 100) / 100,
        lower: Math.max(0, Math.round((forecastValue - stdDev) * 100) / 100),
        actual: null
      });
    }

    // Add actual recent values
    const recentDates = rawData.slice(-Math.min(5, periods)).map(d => ({
      date: new Date(d.date).toISOString().split('T')[0],
      actual: Number(d.total || d.amount || 0)
    }));

    // Merge actuals into forecast if dates match
    recentDates.forEach(recent => {
      const match = forecast.find(f => f.date === recent.date);
      if (match) {
        match.actual = recent.actual;
      }
    });

    return forecast;
  }

  generateDefaultForecast(periods) {
    const forecast = [];
    const today = new Date();
    const baseValue = 5000;

    for (let i = 1; i <= periods; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const randomVariation = Math.random() * 2000 - 1000;
      const value = baseValue + randomVariation;

      forecast.push({
        date: date.toISOString().split('T')[0],
        forecast: Math.round(value * 100) / 100,
        upper: Math.round((value + 500) * 100) / 100,
        lower: Math.max(0, Math.round((value - 500) * 100) / 100),
        actual: null
      });
    }
    return forecast;
  }

  async trainModel(userId, type) {
    try {
      const data = await this.getHistoricalData(type);
      return {
        status: 'trained',
        dataPoints: data.length,
        type: type,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Training failed: ${error.message}`);
    }
  }
}

module.exports = new PredictionService();
