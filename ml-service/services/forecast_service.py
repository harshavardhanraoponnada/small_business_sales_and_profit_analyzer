import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error
from datetime import datetime
import os
import joblib

class ForecastService:
    """Handle forecasting with Prophet"""
    
    def __init__(self, models_dir):
        self.models_dir = models_dir
        os.makedirs(models_dir, exist_ok=True)
        self.models = {}
    
    def train_model(self, df, forecast_type):
        """Train Prophet model on historical data"""
        try:
            if len(df) < 10:
                raise ValueError(f"Insufficient data: {len(df)} points, need at least 10")

            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                interval_width=0.95,
                changepoint_prior_scale=0.05
            )

            model.fit(df)
            self.models[forecast_type] = model
            
            # Save model
            model_path = os.path.join(self.models_dir, f'{forecast_type}_model.pkl')
            joblib.dump(model, model_path)
            
            return {
                'status': 'success',
                'message': f'Model trained for {forecast_type}',
                'data_points': len(df),
                'date_range': f"{df['ds'].min().date()} to {df['ds'].max().date()}"
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def forecast(self, forecast_type, periods=30):
        """Generate forecast for given periods"""
        try:
            if forecast_type not in self.models:
                model_path = os.path.join(self.models_dir, f'{forecast_type}_model.pkl')
                if os.path.exists(model_path):
                    self.models[forecast_type] = joblib.load(model_path)
                else:
                    return {
                        'status': 'error',
                        'message': f'Model not found for {forecast_type}. Train first.'
                    }

            model = self.models[forecast_type]
            future = model.make_future_dataframe(periods=periods, freq='D')
            forecast_df = model.predict(future)

            # Take the last N rows as future forecast
            forecast_df = forecast_df.tail(periods).copy()

            forecast_data = []
            for _, row in forecast_df.iterrows():
                forecast_data.append({
                    'date': row['ds'].strftime('%Y-%m-%d'),
                    'forecast': round(max(0, row['yhat']), 2),
                    'upper': round(max(0, row['yhat_upper']), 2),
                    'lower': round(max(0, row['yhat_lower']), 2),
                    'actual': None
                })
            
            return {
                'status': 'success',
                'data': forecast_data,
                'type': forecast_type
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def evaluate_model(self, df, forecast_type, test_size=0.2):
        """Evaluate model performance using train/test split"""
        try:
            if len(df) < 20:
                return {'status': 'error', 'message': 'Insufficient data for evaluation'}

            split_point = int(len(df) * (1 - test_size))
            train_df = df.iloc[:split_point]
            test_df = df.iloc[split_point:]

            model = Prophet(yearly_seasonality=True, weekly_seasonality=True)
            model.fit(train_df)

            future = model.make_future_dataframe(periods=len(test_df), freq='D')
            forecast_df = model.predict(future)
            forecast_df = forecast_df.tail(len(test_df))

            y_true = test_df['y'].values
            y_pred = forecast_df['yhat'].values
            
            mape = mean_absolute_percentage_error(y_true, y_pred)
            rmse = np.sqrt(mean_squared_error(y_true, y_pred))
            
            return {
                'status': 'success',
                'metrics': {
                    'mape': round(mape * 100, 2),
                    'rmse': round(rmse, 2),
                    'test_points': len(test_df)
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }
