import os
import sys
import uvicorn
from pathlib import Path

# Change to the current directory and add to Python path
current_dir = Path(__file__).parent
os.chdir(current_dir)
sys.path.insert(0, str(current_dir))

print("🚀 Starting SafeSpace AI API...")
print("📍 Models directory:", current_dir / "models")
print("🌐 Server will be available at: http://localhost:8000")
print("📖 API Documentation: http://localhost:8000/docs")
print("🔗 Health Check: http://localhost:8000/health")
print("🧠 ML Models Status: http://localhost:8000/api/models/status")
print("🎯 Threat Analysis: http://localhost:8000/api/threats/demo")
print("\n" + "="*60)

if __name__ == "__main__":
    try:
        uvicorn.run(
            "server.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,  # Enable reload for development
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("Make sure you have installed the requirements:")
        print("pip install -r requirements.txt")
