# ML Service

Production-grade machine learning microservice for time series forecasting.

## Stack
- **Framework**: Flask 3.0
- **ML**: Prophet + scikit-learn
- **Python**: 3.9+

## Features
- Prophet-based forecasting for sales and expenses
- Model persistence with joblib
- Cross-validation and metrics evaluation
- RESTful API endpoints
- CORS-enabled for Node.js backend

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment
export FLASK_ENV=development
export FLASK_PORT=5001

# Production scheduler settings
export DATABASE_URL=postgresql://user:password@host:5432/database
export REPORT_SCHEDULER_TIMEZONE=Asia/Kolkata
export REPORT_SCHEDULER_INSTANCE=ml-service-1
export INSTANCE_ID=ml-service-1

# Run
python app.py
```

For production, deploy with the included `Procfile`. It uses one Gunicorn worker
because each worker can start a scheduler thread. Set `REPORT_SCHEDULER_ENABLED=false`
on every instance that should serve the API but not execute scheduled jobs.

## API Endpoints

### Train Models
```
POST /api/predictions/train
```
Train sales and expenses models on historical data.

### Get Forecast
```
GET /api/predictions/forecast/{sales|expenses}?periods=30
```
Get forecast for next N periods.

### Get Summary
```
GET /api/predictions/summary?periods=30
```
Combined forecast (sales, expenses, profit).

### Evaluate Model
```
GET /api/predictions/evaluate/{sales|expenses}
```
Get model performance metrics (MAPE, RMSE).

### Health Check
```
GET /health
```

## Structure
```
ml-service/
├── app.py              # Flask factory
├── requirements.txt    # Dependencies
├── config/
│   └── settings.py     # Configuration
├── services/
│   └── forecast_service.py  # Prophet models
├── routes/
│   └── predictions.py  # API endpoints
├── utils/
│   └── data_loader.py  # CSV reader
├── models/             # Trained models (generated)
└── trained_models/     # Persisted models
```

## Integration with Node.js Backend
ML service runs on port 5001. Node.js backend calls it:
```javascript
const mlResponse = await axios.get('http://localhost:5001/api/predictions/summary');
```
