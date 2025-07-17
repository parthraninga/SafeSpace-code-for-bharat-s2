import os
import joblib
import onnxruntime as ort
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, List
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import warnings

# Suppress sklearn warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", message=".*sklearn.*")

logger = logging.getLogger(__name__)

class MLManager:
    """Centralized ML model manager for SafeSpace threat detection"""
    
    def __init__(self, models_dir: str = "models"):
        self.models_dir = Path(models_dir)
        self.models_loaded = False
        
        # Model instances
        self.threat_model = None
        self.sentiment_model = None
        self.onnx_session = None
        self.threat_vectorizer = None
        self.sentiment_vectorizer = None
        
        # Model paths
        self.model_paths = {
            "threat": self.models_dir / "Threat.pkl",
            "sentiment": self.models_dir / "sentiment.pkl", 
            "context": self.models_dir / "contextClassifier.onnx"
        }
        
        # Initialize models
        self._load_models()
    
    def _load_models(self) -> bool:
        """Load all ML models"""
        try:
            logger.info("Loading ML models...")
            
            # Load threat detection model
            if self.model_paths["threat"].exists():
                try:
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore")
                        self.threat_model = joblib.load(self.model_paths["threat"])
                    logger.info("✅ Threat model loaded successfully")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to load threat model: {e}")
                    self.threat_model = None
            else:
                logger.error(f"❌ Threat model not found: {self.model_paths['threat']}")
            
            # Load sentiment analysis model
            if self.model_paths["sentiment"].exists():
                try:
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore")
                        self.sentiment_model = joblib.load(self.model_paths["sentiment"])
                    logger.info("✅ Sentiment model loaded successfully")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to load sentiment model: {e}")
                    self.sentiment_model = None
            else:
                logger.error(f"❌ Sentiment model not found: {self.model_paths['sentiment']}")
            
            # Load ONNX context classifier
            if self.model_paths["context"].exists():
                try:
                    self.onnx_session = ort.InferenceSession(
                        str(self.model_paths["context"]),
                        providers=['CPUExecutionProvider']  # Specify CPU provider
                    )
                    logger.info("✅ ONNX context classifier loaded successfully")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to load ONNX model: {e}")
                    self.onnx_session = None
            else:
                logger.error(f"❌ ONNX model not found: {self.model_paths['context']}")
            
            # Check if models are loaded
            models_available = [
                self.threat_model is not None,
                self.sentiment_model is not None,
                self.onnx_session is not None
            ]
            
            self.models_loaded = any(models_available)
            
            if self.models_loaded:
                logger.info(f"✅ ML Manager initialized with {sum(models_available)}/3 models")
            else:
                logger.warning("⚠️ No models loaded, falling back to rule-based detection")
            
            return self.models_loaded
            
        except Exception as e:
            logger.error(f"❌ Error loading models: {e}")
            self.models_loaded = False
            return False
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for model input"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.,!?-]', '', text)
        
        return text
    
    def predict_threat(self, text: str) -> Dict[str, Any]:
        """Main threat prediction using ensemble of models"""
        try:
            processed_text = self._preprocess_text(text)
            
            if not processed_text:
                return self._create_empty_prediction()
            
            predictions = {}
            confidence_scores = []
            models_used = []
            
            # 1. Threat Detection Model
            threat_confidence = 0.0
            threat_prediction = 0
            if self.threat_model is not None:
                try:
                    # Ensure we have clean text input for threat detection
                    threat_input = processed_text if isinstance(processed_text, str) else str(processed_text)
                    
                    # Handle different model prediction formats
                    raw_prediction = self.threat_model.predict([threat_input])
                    
                    # Extract prediction value - handle both single values and arrays
                    if isinstance(raw_prediction, (list, np.ndarray)):
                        if len(raw_prediction) > 0:
                            pred_val = raw_prediction[0]
                            if isinstance(pred_val, (list, np.ndarray)) and len(pred_val) > 0:
                                threat_prediction = int(pred_val[0])
                            elif isinstance(pred_val, (int, float, np.integer, np.floating)):
                                threat_prediction = int(pred_val)
                            else:
                                logger.warning(f"Unexpected threat prediction format: {type(pred_val)} - {pred_val}")
                                threat_prediction = 0
                        else:
                            threat_prediction = 0
                    elif isinstance(raw_prediction, (int, float, np.integer, np.floating)):
                        threat_prediction = int(raw_prediction)
                    else:
                        logger.warning(f"Unexpected threat prediction type: {type(raw_prediction)} - {raw_prediction}")
                        threat_prediction = 0
                    
                    # Get confidence if available
                    if hasattr(self.threat_model, 'predict_proba'):
                        threat_proba = self.threat_model.predict_proba([threat_input])[0]
                        threat_confidence = float(max(threat_proba))
                    else:
                        threat_confidence = 0.8 if threat_prediction == 1 else 0.2
                    
                    predictions["threat"] = {
                        "prediction": threat_prediction,
                        "confidence": threat_confidence
                    }
                    confidence_scores.append(threat_confidence * 0.5)  # 50% weight
                    models_used.append("threat_classifier")
                except Exception as e:
                    logger.error(f"Threat model prediction failed: {e}")
                    # Provide fallback threat detection
                    threat_keywords = ['attack', 'violence', 'emergency', 'fire', 'accident', 'threat', 'danger', 'killed', 'death']
                    fallback_threat = 1 if any(word in processed_text for word in threat_keywords) else 0
                    fallback_confidence = 0.8 if fallback_threat == 1 else 0.2
                    
                    predictions["threat"] = {
                        "prediction": fallback_threat,
                        "confidence": fallback_confidence
                    }
                    confidence_scores.append(fallback_confidence * 0.5)
                    models_used.append("fallback_threat")
            
            # 2. Sentiment Analysis Model
            sentiment_confidence = 0.0
            sentiment_prediction = 0
            if self.sentiment_model is not None:
                try:
                    # Ensure we have clean text input for sentiment analysis
                    sentiment_input = processed_text if isinstance(processed_text, str) else str(processed_text)
                    
                    # Handle different model prediction formats
                    raw_prediction = self.sentiment_model.predict([sentiment_input])
                    
                    # Extract prediction value - handle both single values and arrays
                    if isinstance(raw_prediction, (list, np.ndarray)):
                        if len(raw_prediction) > 0:
                            pred_val = raw_prediction[0]
                            if isinstance(pred_val, (list, np.ndarray)) and len(pred_val) > 0:
                                # Convert to int safely
                                try:
                                    sentiment_prediction = int(pred_val[0])
                                except (ValueError, TypeError):
                                    logger.warning(f"Could not convert to int: {pred_val[0]}")
                                    sentiment_prediction = 0
                            elif isinstance(pred_val, (int, float, np.integer, np.floating)):
                                # Convert to int safely
                                try:
                                    sentiment_prediction = int(pred_val)
                                except (ValueError, TypeError):
                                    logger.warning(f"Could not convert to int: {pred_val}")
                                    sentiment_prediction = 0
                            elif isinstance(pred_val, dict):
                                logger.info(f"Received dictionary prediction format: {pred_val}")
                                
                                # Extract label and score from dictionary
                                label = pred_val.get("label", "").lower()
                                score = pred_val.get("score", 0.0)
                                
                                # Map emotions to binary sentiment (0=negative, 1=positive)
                                negative_emotions = ["fear", "anger", "sadness", "disgust"]
                                positive_emotions = ["joy", "surprise", "love", "happiness"]
                                
                                if label in negative_emotions:
                                    sentiment_prediction = 0  # Negative
                                elif label in positive_emotions:
                                    sentiment_prediction = 1  # Positive
                                else:
                                    # Default handling for unknown labels
                                    sentiment_prediction = 0 if score < 0.5 else 1
                                
                                # Use the score from the prediction
                                sentiment_confidence = float(score)
                            else:
                                logger.warning(f"Unexpected sentiment prediction format: {type(pred_val)} - {pred_val}")
                                sentiment_prediction = 0
                        else:
                            sentiment_prediction = 0
                    elif isinstance(raw_prediction, (int, float, np.integer, np.floating)):
                        try:
                            sentiment_prediction = int(raw_prediction)
                        except (ValueError, TypeError):
                            logger.warning(f"Could not convert to int: {raw_prediction}")
                            sentiment_prediction = 0
                    else:
                        logger.warning(f"Unexpected sentiment prediction type: {type(raw_prediction)} - {raw_prediction}")
                        sentiment_prediction = 0
                    
                    # Get confidence if available
                    if hasattr(self.sentiment_model, 'predict_proba'):
                        sentiment_proba = self.sentiment_model.predict_proba([sentiment_input])[0]
                        sentiment_confidence = float(max(sentiment_proba))
                    else:
                        sentiment_confidence = 0.7 if sentiment_prediction == 0 else 0.3  # Negative sentiment = higher threat
                    
                    # Determine sentiment label
                    sentiment_label = "negative" if sentiment_prediction == 0 else "positive"
                    
                    # If we got a label from the dictionary prediction, use that instead
                    if 'label' in locals():
                        sentiment_label = label
                    
                    predictions["sentiment"] = {
                        "prediction": sentiment_prediction,
                        "confidence": sentiment_confidence,
                        "label": sentiment_label
                    }
                    # Negative sentiment contributes to threat score
                    sentiment_threat_score = (1 - sentiment_prediction) * sentiment_confidence * 0.2  # 20% weight
                    confidence_scores.append(sentiment_threat_score)
                    models_used.append("sentiment_classifier")
                except Exception as e:
                    logger.error(f"Sentiment model prediction failed: {e}")
                    # Provide fallback sentiment analysis
                    negative_words = ['attack', 'violence', 'death', 'killed', 'emergency', 'fire', 'accident', 'threat']
                    fallback_sentiment = 0 if any(word in processed_text for word in negative_words) else 1
                    predictions["sentiment"] = {
                        "prediction": fallback_sentiment,
                        "confidence": 0.6,
                        "label": "negative" if fallback_sentiment == 0 else "positive"
                    }
                    sentiment_threat_score = (1 - fallback_sentiment) * 0.6 * 0.2
                    confidence_scores.append(sentiment_threat_score)
                    models_used.append("fallback_sentiment")
            
            # 3. ONNX Context Classifier
            onnx_confidence = 0.0
            onnx_prediction = 0
            if self.onnx_session is not None:
                try:
                    # Check what inputs the ONNX model expects
                    input_names = [inp.name for inp in self.onnx_session.get_inputs()]
                    
                    if 'input_ids' in input_names and 'attention_mask' in input_names:
                        # This is likely a transformer model (BERT-like)
                        # Create simple tokenized input (basic approach)
                        tokens = processed_text.split()[:50]  # Limit to 50 tokens
                        # Simple word-to-ID mapping (this is a fallback approach)
                        input_ids = [hash(word) % 1000 + 1 for word in tokens]  # Simple hash-based IDs
                        
                        # Pad or truncate to fixed length
                        max_length = 128
                        if len(input_ids) < max_length:
                            input_ids.extend([0] * (max_length - len(input_ids)))
                        else:
                            input_ids = input_ids[:max_length]
                        
                        attention_mask = [1 if i != 0 else 0 for i in input_ids]
                        
                        # Convert to numpy arrays with correct shape
                        input_ids_array = np.array([input_ids], dtype=np.int64)
                        attention_mask_array = np.array([attention_mask], dtype=np.int64)
                        
                        inputs = {
                            'input_ids': input_ids_array,
                            'attention_mask': attention_mask_array
                        }
                        
                        onnx_output = self.onnx_session.run(None, inputs)
                        
                        # Extract prediction from output
                        if len(onnx_output) > 0 and len(onnx_output[0]) > 0:
                            # Handle different output formats
                            output = onnx_output[0][0]
                            if isinstance(output, (list, np.ndarray)) and len(output) > 1:
                                # Probability output
                                probs = output
                                onnx_prediction = int(np.argmax(probs))
                                onnx_confidence = float(max(probs))
                            else:
                                # Single value output
                                onnx_prediction = int(output > 0.5)
                                onnx_confidence = float(abs(output))
                        
                    else:
                        # Use the original simple feature approach
                        input_name = input_names[0] if input_names else 'input'
                        text_features = self._text_to_features(processed_text)
                        
                        onnx_output = self.onnx_session.run(None, {input_name: text_features})
                        onnx_prediction = int(onnx_output[0][0]) if len(onnx_output[0]) > 0 else 0
                        onnx_confidence = float(onnx_output[1][0][1]) if len(onnx_output) > 1 else 0.5
                    
                    predictions["onnx"] = {
                        "prediction": onnx_prediction,
                        "confidence": onnx_confidence
                    }
                    confidence_scores.append(onnx_confidence * 0.3)  # 30% weight
                    models_used.append("context_classifier")
                    
                except Exception as e:
                    logger.error(f"ONNX model prediction failed: {e}")
                    # Provide fallback based on keyword analysis
                    threat_keywords = ['emergency', 'attack', 'violence', 'fire', 'accident', 'threat', 'danger']
                    fallback_confidence = len([w for w in threat_keywords if w in processed_text]) / len(threat_keywords)
                    fallback_prediction = 1 if fallback_confidence > 0.3 else 0
                    
                    predictions["onnx"] = {
                        "prediction": fallback_prediction,
                        "confidence": fallback_confidence
                    }
                    confidence_scores.append(fallback_confidence * 0.3)
                    models_used.append("fallback_context")
            
            # Calculate final confidence score
            final_confidence = sum(confidence_scores) if confidence_scores else 0.0
            
            # Apply aviation content boost (as mentioned in your demo)
            aviation_keywords = ['flight', 'aircraft', 'aviation', 'airline', 'pilot', 'crash', 'airport']
            if any(keyword in processed_text for keyword in aviation_keywords):
                final_confidence = min(final_confidence + 0.1, 1.0)  # +10% boost
            
            # Determine if it's a threat
            is_threat = final_confidence >= 0.6 or threat_prediction == 1
            
            return {
                "is_threat": is_threat,
                "final_confidence": final_confidence,
                "threat_prediction": threat_prediction,
                "sentiment_analysis": predictions.get("sentiment"),
                "onnx_prediction": predictions.get("onnx"),
                "models_used": models_used,
                "raw_predictions": predictions
            }
            
        except Exception as e:
            logger.error(f"Error in threat prediction: {e}")
            return self._create_empty_prediction()
    
    def _text_to_features(self, text: str) -> np.ndarray:
        """Convert text to numerical features for ONNX model"""
        try:
            # Simple feature extraction - you may need to adjust based on your ONNX model requirements
            # This is a basic approach, you might need to match your training preprocessing
            
            # Basic text statistics
            features = [
                len(text),  # text length
                len(text.split()),  # word count
                text.count('!'),  # exclamation marks
                text.count('?'),  # question marks
                text.count('.'),  # periods
            ]
            
            # Add more features as needed for your specific ONNX model
            # You might need to use the same vectorizer that was used during training
            
            return np.array([features], dtype=np.float32)
        except Exception as e:
            logger.error(f"Error creating features: {e}")
            return np.array([[0.0, 0.0, 0.0, 0.0, 0.0]], dtype=np.float32)
    
    def _create_empty_prediction(self) -> Dict[str, Any]:
        """Create empty prediction result"""
        return {
            "is_threat": False,
            "final_confidence": 0.0,
            "threat_prediction": 0,
            "sentiment_analysis": None,
            "onnx_prediction": None,
            "models_used": [],
            "raw_predictions": {}
        }
    
    def get_status(self) -> Dict[str, Any]:
        """Get status of all models"""
        return {
            "models_loaded": self.models_loaded,
            "threat_model": self.threat_model is not None,
            "sentiment_model": self.sentiment_model is not None,
            "onnx_model": self.onnx_session is not None,
            "models_dir": str(self.models_dir),
            "model_files": {
                name: path.exists() for name, path in self.model_paths.items()
            }
        }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Analyze multiple texts in batch"""
        return [self.predict_threat(text) for text in texts]
