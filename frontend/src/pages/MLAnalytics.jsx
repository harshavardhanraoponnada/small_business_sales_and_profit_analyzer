import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/layout/Sidebar';
import './MLAnalytics.css';
import { formatNumber } from '../utils/numberFormat';

export default function MLAnalytics() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState(null);
  const [metrics, setMetrics] = useState({ sales: null, expenses: null });
  const [period, setPeriod] = useState(30);
  const [error, setError] = useState(null);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    fetchPredictions();
    fetchMetrics();
  }, [period]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/ml/predictions/summary?periods=${period}`);
      setPredictions(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const [salesRes, expensesRes] = await Promise.all([
        api.get('/ml/predictions/evaluate/sales'),
        api.get('/ml/predictions/evaluate/expenses')
      ]);
      setMetrics({
        sales: salesRes.data.metrics,
        expenses: expensesRes.data.metrics
      });
    } catch (err) {
      setMetrics({ sales: null, expenses: null });
    }
  };

  const trainModels = async () => {
    try {
      setTraining(true);
      await api.post('/ml/predictions/train');
      await fetchPredictions();
      await fetchMetrics();
    } catch (err) {
      setError('Failed to train models: ' + (err.response?.data?.message || err.message));
    } finally {
      setTraining(false);
    }
  };

  if (loading) {
    return (
      <div className="ml-analytics">
        <div className="loading-spinner">
          <Brain size={48} />
          <p>Loading AI predictions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-analytics">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchPredictions} className="btn-retry">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="ml-analytics-wrapper">
        <div className="page-header">
          <h1><Brain size={28} /> AI Insights</h1>
          <div className="header-actions">
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="period-select">
              <option value={7}>7 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
              <option value={180}>180 Days</option>
            </select>
            <button onClick={trainModels} disabled={training} className="btn-train">
              <RefreshCw size={18} className={training ? 'spin' : ''} />
              {training ? 'Training...' : 'Train Models'}
            </button>
          </div>
        </div>

        <div className="metrics-grid">
          <MetricCard 
            title="Sales Forecast" 
            data={predictions?.sales} 
            icon={<TrendingUp />} 
            color="green" 
          />
          <MetricCard 
            title="Expenses Forecast" 
            data={predictions?.expenses} 
            icon={<TrendingDown />} 
            color="red" 
          />
          <MetricCard 
            title="Profit Forecast" 
            data={predictions?.profit} 
            icon={<DollarSign />} 
            color="blue" 
          />
        </div>

        <div className="model-metrics-grid">
          <ModelMetricsCard title="Sales Model" metrics={metrics.sales} />
          <ModelMetricsCard title="Expenses Model" metrics={metrics.expenses} />
        </div>

        <div className="predictions-container">
          <PredictionChart data={predictions?.sales?.data} title="Sales Forecast (₹)" />
          <PredictionChart data={predictions?.expenses?.data} title="Expenses Forecast (₹)" />
          <PredictionChart data={predictions?.profit?.data} title="Profit Forecast (₹)" />
        </div>

        <div className="predictions-tables">
          <PredictionTable data={predictions?.sales?.data} title="Sales Predictions" />
          <PredictionTable data={predictions?.expenses?.data} title="Expenses Predictions" />
          <PredictionTable data={predictions?.profit?.data} title="Profit Predictions" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, data, icon, color }) {
  if (!data?.data || data.data.length === 0) {
    return (
      <div className={`metric-card metric-${color}`}>
        <div className="metric-icon">{icon}</div>
        <div className="metric-content">
          <h3>{title}</h3>
          <p className="metric-value">No Data</p>
        </div>
      </div>
    );
  }

  const avg = data.data.reduce((sum, d) => sum + d.forecast, 0) / data.data.length;
  const trend = ((data.data[data.data.length - 1].forecast - data.data[0].forecast) / data.data[0].forecast * 100).toFixed(1);
  
  return (
    <div className={`metric-card metric-${color}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <h3>{title}</h3>
        <p className="metric-value">₹{formatNumber(avg, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day</p>
        <p className="metric-trend" style={{ color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% trend
        </p>
        <p className="metric-accuracy">Accuracy: {data.accuracy}%</p>
      </div>
    </div>
  );
}

function PredictionChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div className="prediction-chart-card">
        <h3>{title}</h3>
        <p style={{ textAlign: 'center', color: '#999' }}>No data available</p>
      </div>
    );
  }

  return (
    <div className="prediction-chart-card">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis />
          <Tooltip 
            formatter={(value) => `₹${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
            contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="forecast" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Forecast"
            dot={false}
            isAnimationActive={false}
          />
          <Line 
            type="monotone" 
            dataKey="upper" 
            stroke="#a3e635" 
            strokeWidth={1}
            strokeDasharray="5 5"
            name="Upper Bound"
            dot={false}
            isAnimationActive={false}
          />
          <Line 
            type="monotone" 
            dataKey="lower" 
            stroke="#f87171" 
            strokeWidth={1}
            strokeDasharray="5 5"
            name="Lower Bound"
            dot={false}
            isAnimationActive={false}
          />
          {data.some(d => d.actual) && (
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Actual"
              dot={{ fill: '#8b5cf6', r: 3 }}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PredictionTable({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div className="prediction-table-card">
        <h3>{title}</h3>
        <p>No predictions available. Please ensure you have sufficient historical data.</p>
      </div>
    );
  }

  return (
    <div className="prediction-table-card">
      <h3>{title}</h3>
      <div className="table-wrapper">
        <table className="prediction-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Forecast</th>
              <th>Lower Bound</th>
              <th>Upper Bound</th>
              <th>Actual</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, idx) => (
              <tr key={idx}>
                <td>{new Date(row.date).toLocaleDateString()}</td>
                <td>₹{formatNumber(row.forecast, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>₹{formatNumber(row.lower, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>₹{formatNumber(row.upper, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{row.actual ? `₹${formatNumber(row.actual, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModelMetricsCard({ title, metrics }) {
  return (
    <div className="model-metrics-card">
      <h3>{title}</h3>
      {metrics ? (
        <div className="model-metrics-body">
          <div><span>MAPE</span><strong>{metrics.mape}%</strong></div>
          <div><span>RMSE</span><strong>{metrics.rmse}</strong></div>
          <div><span>Test Points</span><strong>{metrics.test_points}</strong></div>
        </div>
      ) : (
        <p className="model-metrics-empty">Metrics not available yet.</p>
      )}
    </div>
  );
}
