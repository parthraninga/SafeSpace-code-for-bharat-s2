from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.routes.threats import router as threats_router
from server.routes.models import router as models_router
from server.core.ml_manager import MLManager
from server.core import model_downloader
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize ML models on startup
ml_manager = MLManager()

app = FastAPI(
    title="SafeSpace AI API",
    description="AI-powered threat detection and safety analysis",
    version="2.0.0"
)

# Add ML manager to app state for dependency injection
app.state.ml_manager = ml_manager

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React app
        "http://localhost:3001",  # Node.js backend
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(threats_router, prefix="/api/threats", tags=["threats"])
app.include_router(models_router, prefix="/api/models", tags=["models"])


    
@app.get("/")
async def root():
    return {
        "message": "SafeSpace AI API is running",
        "version": "2.0.0",
        "models_status": ml_manager.get_status()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "message": "SafeSpace AI API is operational",
        "models_loaded": ml_manager.models_loaded
    }

# Make ml_manager available globally
app.state.ml_manager = ml_manager

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
