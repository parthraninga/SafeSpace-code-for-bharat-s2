import os
import gdown

# Define model file paths and Google Drive file IDs
MODEL_PATHS = {
    "Threat.pkl": ("models/Threat.pkl", "1RDyVDXdROwKCSM_5WSRefMMd3XcFQ1Jh"),
    "sentiment.pkl": ("models/sentiment.pkl", "1Gr20nO4Av1--2eYNtcogcNud5QV5HdDi"),
    "contextClassifier.onnx": ("models/contextClassifier.onnx", "1FwcWZ2WCVGm-c9ObUHCCvOLROIpgXzmo")
}

# Ensure models/ directory exists
os.makedirs("models", exist_ok=True)

# Download missing files
for name, (path, file_id) in MODEL_PATHS.items():
    if not os.path.exists(path):
        print(f"🔽 Downloading {name}...")
        url = f"https://drive.google.com/uc?id={file_id}"
        gdown.download(url, path, quiet=False)
    else:
        print(f"✅ {name} already exists.")
