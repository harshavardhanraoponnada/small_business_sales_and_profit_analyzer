import os
from datetime import timedelta

class Config:
    """Base configuration"""
    DEBUG = False
    TESTING = False
    
    # Flask
    JSON_SORT_KEYS = False
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODELS_DIR = os.path.join(BASE_DIR, 'trained_models')
    DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), 'backend', 'src', 'data')
    REPORTS_DIR = os.path.join(BASE_DIR, 'generated_reports')
    SCHEDULES_FILE = os.path.join(BASE_DIR, 'schedules.json')
    
    # Model settings
    MIN_DATA_POINTS = 10
    FORECAST_PERIODS = 30
    TRAIN_TEST_SPLIT = 0.8
    CV_FOLDS = 5
    
    # Report settings
    REPORT_RETENTION_DAYS = 7
    MAX_REPORT_SIZE_MB = 50
    SUPPORTED_FORMATS = ['pdf', 'xlsx']
    SUPPORTED_FREQUENCIES = ['daily', 'weekly', 'monthly']

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    FLASK_ENV = 'development'
    PORT = 5001

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    FLASK_ENV = 'production'
    PORT = 5001

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    FLASK_ENV = 'testing'
    PORT = 5002

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
