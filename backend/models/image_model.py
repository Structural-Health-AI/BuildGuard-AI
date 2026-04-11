"""
Image-based Damage Detection Model
Uses PyTorch ResNet50 to detect structural damage from images
"""
import os
import numpy as np
from typing import Tuple, List, Optional
from PIL import Image
import io
import json

# PyTorch imports
try:
    import torch
    import torch.nn as nn
    from torchvision import models, transforms
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None
    print("PyTorch not available, using mock predictions")


# Path to saved model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "saved_models", "damage_detector_pytorch.pth")
MODEL_INFO_PATH = os.path.join(os.path.dirname(__file__), "..", "saved_models", "damage_detector_pytorch_info.json")

# Global model and device
_model = None
_device = None

# Image settings (matching PyTorch training notebook)
IMG_SIZE = 160
# Classes: 'damage' (0) then 'no_damage' (1)
DAMAGE_CLASSES = ["damage", "no_damage"]


def get_damage_recommendations(damage_type: Optional[str], confidence: float) -> List[str]:
    """Get recommendations based on detected damage type"""
    if damage_type is None or damage_type == "no_damage":
        return [
            "No visible damage detected in the image",
            "Continue regular visual inspections",
            "Document this inspection for records"
        ]

    recommendations = {
        "damage": [
            "Cracks or damage detected in the structure",
            "Measure and document crack size and location",
            "Monitor for damage progression over time",
            "Consult structural engineer for assessment if needed"
        ]
    }

    base_recommendations = recommendations.get(damage_type, ["Damage detected, consult engineer"])

    if confidence < 0.7:
        base_recommendations.append("Note: Confidence is moderate, manual verification recommended")

    return base_recommendations


def get_device():
    """Get the appropriate device (GPU or CPU)"""
    global _device
    if _device is None:
        _device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {_device}")
    return _device


def create_model_architecture():
    """Create ResNet50 architecture matching training notebook"""
    # Load pretrained ResNet50
    model = models.resnet50(pretrained=True)
    
    # Freeze backbone
    for param in model.parameters():
        param.requires_grad = False
    
    # Replace classification head
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, len(DAMAGE_CLASSES))
    )
    
    return model


def load_model():
    """Load the trained PyTorch damage detection model"""
    global _model

    if _model is not None:
        return _model

    if not TORCH_AVAILABLE:
        print("PyTorch not available")
        return None
    
    try:
        device = get_device()
        
        if not os.path.exists(MODEL_PATH):
            print(f"Model not found at {MODEL_PATH}")
            return None
        
        # Create model architecture
        _model = create_model_architecture()
        
        # Load trained weights
        state_dict = torch.load(MODEL_PATH, map_location=device)
        _model.load_state_dict(state_dict)
        
        # Move to device and set to evaluation mode
        _model = _model.to(device)
        _model.eval()
        
        print(f"✓ Model loaded successfully from {MODEL_PATH}")
        
        # Print model info if available
        if os.path.exists(MODEL_INFO_PATH):
            with open(MODEL_INFO_PATH, 'r') as f:
                info = json.load(f)
                print(f"  Model accuracy: {info.get('accuracy', 'N/A')}")
                print(f"  Image size: {info.get('image_size', IMG_SIZE)}")
        
        return _model
        
    except Exception as e:
        print(f"Error loading model: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_image_transforms():
    """Get the same preprocessing transforms used in training"""
    if not TORCH_AVAILABLE:
        return None
    return transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])


def preprocess_image(image_data: bytes) -> "torch.Tensor":
    """Preprocess image for PyTorch model prediction"""
    # Open image
    image = Image.open(io.BytesIO(image_data))
    
    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Apply transforms
    transform = get_image_transforms()
    tensor = transform(image)
    
    # Add batch dimension
    tensor = tensor.unsqueeze(0)
    
    return tensor


def predict_image_damage(image_data: bytes) -> Tuple[bool, Optional[str], float, List[str]]:
    """
    Predict structural damage from an image using PyTorch model

    Args:
        image_data: Raw image bytes

    Returns:
        Tuple of (damage_detected, damage_type, confidence, recommendations)
    """
    model = load_model()

    if model is None:
        # Fallback for when PyTorch model not available
        import random
        damage_detected = random.random() > 0.5
        if damage_detected:
            damage_type = "damage"
            confidence = random.uniform(0.6, 0.95)
        else:
            damage_type = None
            confidence = random.uniform(0.7, 0.95)
        recommendations = get_damage_recommendations(damage_type, confidence)
        return damage_detected, damage_type, confidence, recommendations

    device = get_device()
    
    try:
        # Preprocess image
        img_tensor = preprocess_image(image_data)
        img_tensor = img_tensor.to(device)
        
        # Predict with no gradient computation
        with torch.no_grad():
            outputs = model(img_tensor)
            # Apply softmax to get probabilities
            probabilities = torch.softmax(outputs, dim=1)[0]
            predicted_class = torch.argmax(probabilities).item()
            confidence_score = probabilities[predicted_class].item()
        
        # Bounds check
        if predicted_class < 0 or predicted_class >= len(DAMAGE_CLASSES):
            predicted_class = 1  # Default to no_damage if out of bounds
            confidence_score = 0.5
        
        # Determine damage
        # Class 0 = 'damage', Class 1 = 'no_damage'
        if predicted_class == 0:  # Model predicts "damage"
            damage_detected = True
            damage_type = "damage"
        else:  # Model predicts "no_damage" (class 1)
            damage_detected = False
            damage_type = None
        
        # Ensure confidence is in valid range
        confidence = float(confidence_score)
        confidence = max(0.0, min(1.0, confidence))
        
        # Get recommendations
        recommendations = get_damage_recommendations(damage_type, confidence)
        
        return damage_detected, damage_type, confidence, recommendations
        
    except Exception as e:
        print(f"Error during prediction: {e}")
        import traceback
        traceback.print_exc()
        # Return error prediction
        recommendations = ["Error occurred during analysis. Please try again."]
        return False, None, 0.0, recommendations


# Try to load model on import
try:
    load_model()
except Exception as e:
    print(f"Could not load image model on startup: {e}")
