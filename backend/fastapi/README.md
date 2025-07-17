# SafeSpace FastAPI Backend

## Overview
FastAPI backend service for threat intelligence and safety recommendations with ML-enhanced categorization.

## Current Status
✅ **WORKING** - Server running successfully on http://localhost:8000

### Features
- ✅ **Threat Detection API** - `/api/threats` endpoint working
- ✅ **ML Model Integration** - NB-SVM threat classifier loaded and working
- ✅ **News API Integration** - Fetching real news data
- ✅ **Health Check** - `/health` endpoint available
- ✅ **API Documentation** - Available at `/docs`
- ⚠️ **AI Advice Generation** - Working with fallback (OpenRouter API key needed)
- ⚠️ **ONNX Model** - Optional, not currently available

### API Endpoints
- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/test` - Test endpoint  
- `GET /api/threats?city={city}` - Get threats for specific city
- `GET /api/threats/{id}` - Get threat details
- `GET /api/models/status` - ML model status
- `POST /api/models/download` - Download ML models

## Quick Start

### 1. Install Dependencies
```bash
cd backend/fastapi
pip install -r requirements.txt
```

### 2. Start Server
```bash
# Option 1: Direct Python
python run.py

# Option 2: Windows Batch File
start_fastapi.bat

# Option 3: Manual uvicorn
uvicorn server.main:app --host 0.0.0.0 --port 8000
```

### 3. Test API
- Health Check: http://localhost:8000/health
- API Docs: http://localhost:8000/docs
- Test Threats: http://localhost:8000/api/threats?city=Delhi

## Directory Structure
```
fastapi/
├── run.py                    # Main startup script
├── start_fastapi.bat        # Windows startup script
├── requirements.txt         # Python dependencies
├── models/                  # ML models directory
│   ├── threat.pkl          # ✅ NB-SVM threat classifier
│   ├── sentiment.pkl       # Additional model
│   └── model_info.txt      # Model documentation
├── server/                 # Main application code
│   ├── main.py            # FastAPI app configuration
│   ├── routes/
│   │   └── api.py         # ✅ API endpoints
│   └── utils/
│       ├── model_loader.py # ✅ ML model management
│       └── solution.py     # AI advice generation
└── venv/                   # Virtual environment
```

## Recent Fixes Applied
1. ✅ **Fixed Model Loading Paths** - Corrected relative paths for model files
2. ✅ **Robust Error Handling** - Server continues running even if optional models fail
3. ✅ **Optional Dependencies** - ONNX and transformers are now optional
4. ✅ **CORS Configuration** - Added support for both React (3000) and Node.js (3001)
5. ✅ **Proper Startup Script** - Fixed directory and import issues

## Integration Status
- ✅ **Frontend Integration** - API endpoints accessible from React frontend
- ✅ **Node.js Backend** - CORS configured for authentication backend
- ✅ **ML Pipeline** - Threat classification working with existing model
- ✅ **News API** - Real-time news fetching operational

## Performance
- **Startup Time**: ~2-3 seconds
- **Response Time**: ~2-5 seconds per threat query
- **Memory Usage**: ~50-100MB
- **Timeout Protection**: 5-8 seconds with fallback data

## Next Steps
1. **Optional**: Add OpenRouter API key for enhanced AI advice
2. **Optional**: Add ONNX model for improved threat detection
3. **Optional**: Implement caching for better performance
4. **Optional**: Add more sophisticated threat categorization

## Troubleshooting
- If server fails to start, check `pip install -r requirements.txt`
- If models fail to load, they will use fallback threat detection
- API will return mock data if external services are unavailable
- Check logs for detailed error information
