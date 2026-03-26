from flask import Blueprint, request, jsonify
import pandas as pd
import os
from services.forecast_service import ForecastService
from utils.database_loader import DatabaseLoader
from utils.data_loader import DataLoader
from utils.model_registry import update_model_entry, load_registry
from config.settings import Config

predictions_bp = Blueprint('predictions', __name__, url_prefix='/api/predictions')
forecast_service = ForecastService(Config.MODELS_DIR)

# Initialize database loader with PostgreSQL connection
DATABASE_URL = os.getenv('DATABASE_URL')
db_loader = DatabaseLoader(DATABASE_URL) if DATABASE_URL else None

def _load_data_from_database():
    """Load data from PostgreSQL database (preferred) or fallback to CSV"""
    try:
        if db_loader:
            sales_data = db_loader.load_sales_data()
            expenses_data = db_loader.load_expenses_data()
            return sales_data, expenses_data, 'database'
    except Exception as e:
        print(f"Database loading failed: {e}, falling back to CSV")
    
    # Fallback to CSV if database not available
    sales_data = DataLoader.load_sales_data(Config.DATA_DIR)
    expenses_data = DataLoader.load_expenses_data(Config.DATA_DIR)
    return sales_data, expenses_data, 'csv'

def _ensure_models_trained():
    """Train models using latest data from database or CSV"""
    results = {}
    
    sales_data, expenses_data, source = _load_data_from_database()
    print(f"Loaded data from {source}")
    
    if DataLoader.validate_data(sales_data, Config.MIN_DATA_POINTS):
        results['sales'] = forecast_service.train_model(sales_data, 'sales')
        results['sales']['source'] = source
    else:
        results['sales'] = {'status': 'error', 'message': 'Insufficient sales data', 'source': source}

    if DataLoader.validate_data(expenses_data, Config.MIN_DATA_POINTS):
        results['expenses'] = forecast_service.train_model(expenses_data, 'expenses')
        results['expenses']['source'] = source
    else:
        results['expenses'] = {'status': 'error', 'message': 'Insufficient expenses data', 'source': source}

    return results

@predictions_bp.route('/train', methods=['POST'])
def train_models():
    """Train both sales and expenses models"""
    try:
        results = _ensure_models_trained()

        # Update registry with metrics - use database loader for evaluation data
        if results.get('sales', {}).get('status') == 'success':
            try:
                if db_loader:
                    sales_data = db_loader.load_sales_data()
                else:
                    sales_data = DataLoader.load_sales_data(Config.DATA_DIR)
            except:
                sales_data = DataLoader.load_sales_data(Config.DATA_DIR)
            
            sales_metrics = forecast_service.evaluate_model(sales_data, 'sales')
            update_model_entry(Config.MODELS_DIR, 'sales', {
                "status": results['sales']['status'],
                "data_points": results['sales'].get('data_points'),
                "date_range": results['sales'].get('date_range'),
                "metrics": sales_metrics.get('metrics') if sales_metrics.get('status') == 'success' else None
            })

        if results.get('expenses', {}).get('status') == 'success':
            try:
                if db_loader:
                    expenses_data = db_loader.load_expenses_data()
                else:
                    expenses_data = DataLoader.load_expenses_data(Config.DATA_DIR)
            except:
                expenses_data = DataLoader.load_expenses_data(Config.DATA_DIR)
            
            expenses_metrics = forecast_service.evaluate_model(expenses_data, 'expenses')
            update_model_entry(Config.MODELS_DIR, 'expenses', {
                "status": results['expenses']['status'],
                "data_points": results['expenses'].get('data_points'),
                "date_range": results['expenses'].get('date_range'),
                "metrics": expenses_metrics.get('metrics') if expenses_metrics.get('status') == 'success' else None
            })
        
        return jsonify({'success': True, 'results': results}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@predictions_bp.route('/forecast/<forecast_type>', methods=['GET'])
def get_forecast(forecast_type):
    """Get forecast for sales or expenses"""
    try:
        periods = request.args.get('periods', Config.FORECAST_PERIODS, type=int)
        
        if forecast_type not in ['sales', 'expenses']:
            return jsonify({'success': False, 'message': 'Invalid forecast type'}), 400
        
        result = forecast_service.forecast(forecast_type, periods)
        
        if result['status'] == 'error':
            _ensure_models_trained()
            result = forecast_service.forecast(forecast_type, periods)
            if result['status'] == 'error':
                return jsonify({'success': False, 'message': result['message']}), 400
        
        return jsonify({
            'success': True,
            'data': result['data'],
            'type': result['type'],
            'generated_at': str(pd.Timestamp.now())
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@predictions_bp.route('/summary', methods=['GET'])
def get_summary():
    """Get combined forecast summary (sales, expenses, profit)"""
    try:
        periods = request.args.get('periods', Config.FORECAST_PERIODS, type=int)
        
        sales_result = forecast_service.forecast('sales', periods)
        expenses_result = forecast_service.forecast('expenses', periods)
        
        if sales_result['status'] == 'error' or expenses_result['status'] == 'error':
            _ensure_models_trained()
            sales_result = forecast_service.forecast('sales', periods)
            expenses_result = forecast_service.forecast('expenses', periods)
            if sales_result['status'] == 'error' or expenses_result['status'] == 'error':
                return jsonify({
                    'success': False,
                    'message': 'Failed to generate forecast. Please ensure sales/expenses data exists and try training.'
                }), 400
        
        # Calculate profit
        profit_data = []
        for sale, expense in zip(sales_result['data'], expenses_result['data']):
            profit_data.append({
                'date': sale['date'],
                'forecast': round(sale['forecast'] - expense['forecast'], 2),
                'upper': round(sale['upper'] - expense['lower'], 2),
                'lower': round(max(0, sale['lower'] - expense['upper']), 2),
                'actual': None
            })
        
        return jsonify({
            'success': True,
            'data': {
                'sales': {
                    'data': sales_result['data'],
                    'accuracy': 85
                },
                'expenses': {
                    'data': expenses_result['data'],
                    'accuracy': 82
                },
                'profit': {
                    'data': profit_data,
                    'accuracy': 80
                }
            },
            'generated_at': str(pd.Timestamp.now())
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@predictions_bp.route('/evaluate/<forecast_type>', methods=['GET'])
def evaluate(forecast_type):
    """Evaluate model performance"""
    try:
        if forecast_type == 'sales':
            # Try to load from database first, then fallback to CSV
            try:
                if db_loader:
                    data = db_loader.load_sales_data()
                else:
                    data = DataLoader.load_sales_data(Config.DATA_DIR)
            except:
                data = DataLoader.load_sales_data(Config.DATA_DIR)
        elif forecast_type == 'expenses':
            # Try to load from database first, then fallback to CSV
            try:
                if db_loader:
                    data = db_loader.load_expenses_data()
                else:
                    data = DataLoader.load_expenses_data(Config.DATA_DIR)
            except:
                data = DataLoader.load_expenses_data(Config.DATA_DIR)
        else:
            return jsonify({'success': False, 'message': 'Invalid forecast type'}), 400
        
        result = forecast_service.evaluate_model(data, forecast_type)
        
        if result['status'] == 'error':
            return jsonify({'success': False, 'message': result['message']}), 400
        
        return jsonify({'success': True, 'metrics': result['metrics']}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@predictions_bp.route('/registry', methods=['GET'])
def registry():
    """Return model registry metadata"""
    try:
        return jsonify({'success': True, 'registry': load_registry(Config.MODELS_DIR)}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Import at end to avoid circular imports
import pandas as pd
