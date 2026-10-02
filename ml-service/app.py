from flask import Flask
from flask_cors import CORS
from config.settings import config
from routes.predictions import predictions_bp
from routes import reports as reports_routes
from routes.reports import reports_bp
from services.scheduler_service import SchedulerService
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Global scheduler instance
scheduler = None

def create_app(config_name='development'):
    """Application factory"""
    global scheduler
    
    app = Flask(__name__)
    
    # Load config
    app.config.from_object(config[config_name])
    
    # Enable CORS
    cors_origins = os.getenv('CORS_ORIGINS', '').strip()
    if cors_origins:
        CORS(app, resources={r"/*": {"origins": [origin.strip() for origin in cors_origins.split(',') if origin.strip()]}})
    else:
        CORS(app)
    
    # Create directories
    os.makedirs(app.config['MODELS_DIR'], exist_ok=True)
    os.makedirs(app.config['REPORTS_DIR'], exist_ok=True)
    
    # Initialize scheduler
    scheduler = SchedulerService()
    reports_routes.scheduler = scheduler
    if scheduler.should_run:
        scheduler.start_scheduler()
    
    # Register blueprints
    app.register_blueprint(predictions_bp)
    app.register_blueprint(reports_bp)
    
    return app


app = create_app(os.getenv('FLASK_ENV', 'production'))

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    debug_mode = os.getenv('FLASK_DEBUG') == '1' or bool(app.config.get('DEBUG', False))
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
