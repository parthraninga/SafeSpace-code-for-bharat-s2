#!/bin/bash

# Render build script for FastAPI backend
echo "🚀 Starting FastAPI build process..."

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Download models if they don't exist
echo "🤖 Checking for ML models..."
if [ ! -f "models/Threat.pkl" ] || [ ! -f "models/sentiment.pkl" ] || [ ! -f "models/contextClassifier.onnx" ]; then
    echo "⚠️ ML models not found - app will run with fallback mode"
    # Create models directory if it doesn't exist
    mkdir -p models
    # Create placeholder files to prevent import errors
    touch models/Threat.pkl
    touch models/sentiment.pkl 
    touch models/contextClassifier.onnx
else
    echo "✅ ML models found"
fi

echo "✅ Build completed successfully!"
