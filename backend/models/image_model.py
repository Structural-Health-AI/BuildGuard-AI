"""
Image-based Damage Detection Model
Uses PyTorch ResNet50 to detect structural damage from images
Includes multi-scale tiling for detecting small cracks in large areas
"""
import os
import numpy as np
from typing import Tuple, List, Optional, Dict
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
TILE_SIZE = 160  # Size of tiles for multi-scale detection
TILE_OVERLAP = 0.2  # 20% overlap between tiles
# Classes: 'damage' (0) then 'no_damage' (1)
DAMAGE_CLASSES = ["damage", "no_damage"]


def get_damage_recommendations(damage_type: Optional[str], confidence: float, has_small_cracks: bool = False) -> List[str]:
    """Get recommendations based on detected damage type"""
    if damage_type is None or damage_type == "no_damage":
        recommendations = [
            "No visible damage detected in the image",
            "Continue regular visual inspections",
            "Document this inspection for records"
        ]
        if has_small_cracks:
            recommendations.insert(0, "Minor surface cracks detected - monitor for progression")
        return recommendations

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
    
    if has_small_cracks:
        base_recommendations.insert(1, "Small cracks detected in image tiles - review detailed regions")

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


def _get_image_tiles(image: Image.Image, tile_size: int = TILE_SIZE, overlap_ratio: float = TILE_OVERLAP) -> List[Tuple[Image.Image, int, int]]:
    """
    Split image into overlapping tiles for multi-scale detection
    
    Returns:
        List of (tile_image, x_offset, y_offset) tuples
    """
    tiles = []
    stride = int(tile_size * (1 - overlap_ratio))
    
    width, height = image.size
    
    y = 0
    while y < height:
        x = 0
        while x < width:
            # Calculate tile bounds
            x_end = min(x + tile_size, width)
            y_end = min(y + tile_size, height)
            
            # Pad tile if at edge
            if x_end - x < tile_size or y_end - y < tile_size:
                # Create padded tile
                tile = Image.new('RGB', (tile_size, tile_size), (128, 128, 128))
                crop = image.crop((x, y, x_end, y_end))
                tile.paste(crop, (0, 0))
            else:
                tile = image.crop((x, y, x_end, y_end))
            
            tiles.append((tile, x, y))
            x += stride
        
        y += stride
    
    return tiles


def _predict_tile(model: nn.Module, tile: Image.Image, device: torch.device) -> float:
    """
    Predict damage probability for a single tile
    
    Returns:
        Probability of damage (0-1)
    """
    transform = get_image_transforms()
    tile_tensor = transform(tile).unsqueeze(0).to(device)
    
    with torch.no_grad():
        outputs = model(tile_tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]
        # Return probability of class 0 (damage)
        damage_prob = probabilities[0].item()
    
    return damage_prob


def predict_image_damage_multiscale(image_data: bytes, damage_threshold: float = 0.5) -> Tuple[bool, Optional[str], float, List[str], Dict]:
    """
    Predict structural damage using multi-scale tiling for better small-crack detection
    
    Args:
        image_data: Raw image bytes
        damage_threshold: Confidence threshold for damage classification
    
    Returns:
        Tuple of (damage_detected, damage_type, confidence, recommendations, details)
        details dict contains:
            - tile_predictions: List of {x, y, damage_prob, is_damage}
            - small_cracks_detected: bool (cracks in some tiles but not overall)
            - num_tiles: total tiles analyzed
            - damaged_tiles: number of tiles with damage
    """
    model = load_model()
    device = get_device()
    
    if model is None:
        return _get_fallback_prediction()
    
    try:
        # Open and process image
        image = Image.open(io.BytesIO(image_data))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Get full image prediction
        img_tensor = preprocess_image(image_data)
        img_tensor = img_tensor.to(device)
        
        with torch.no_grad():
            outputs = model(img_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
            full_damage_prob = probabilities[0].item()
            full_pred_class = torch.argmax(probabilities).item()
        
        # Get tile predictions for detailed analysis
        tiles = _get_image_tiles(image, TILE_SIZE, TILE_OVERLAP)
        tile_predictions = []
        damaged_tile_count = 0
        
        for tile, x, y in tiles:
            tile_damage_prob = _predict_tile(model, tile, device)
            is_tile_damage = tile_damage_prob >= damage_threshold
            
            tile_predictions.append({
                'x': int(x),
                'y': int(y),
                'damage_prob': float(tile_damage_prob),
                'is_damage': bool(is_tile_damage)
            })
            
            if is_tile_damage:
                damaged_tile_count += 1
        
        # Determine if there are small cracks (some tiles damaged but full image not classified as damage)
        has_small_cracks = damaged_tile_count > 0 and full_pred_class == 1  # Has damaged tiles but full image = no_damage
        
        # If tiles detected damage but full image doesn't, upgrade to damage
        if has_small_cracks and damaged_tile_count >= 2:  # At least 2 tiles with damage
            damage_detected = True
            damage_type = "damage"
            confidence = 0.75  # Medium confidence for small crack detection
        else:
            damage_detected = full_pred_class == 0
            damage_type = "damage" if damage_detected else None
            confidence = full_damage_prob if damage_detected else probabilities[1].item()
        
        recommendations = get_damage_recommendations(damage_type, confidence, has_small_cracks)
        
        details = {
            'tile_predictions': tile_predictions,
            'small_cracks_detected': has_small_cracks,
            'num_tiles': len(tiles),
            'damaged_tiles': damaged_tile_count,
            'full_image_damage_prob': float(full_damage_prob)
        }
        
        return damage_detected, damage_type, confidence, recommendations, details
        
    except Exception as e:
        print(f"Error in multi-scale prediction: {e}")
        import traceback
        traceback.print_exc()
        return _get_fallback_prediction()


def _get_fallback_prediction():
    """Fallback prediction when model unavailable"""
    import random
    damage_detected = random.random() > 0.5
    if damage_detected:
        damage_type = "damage"
        confidence = random.uniform(0.6, 0.95)
    else:
        damage_type = None
        confidence = random.uniform(0.7, 0.95)
    recommendations = get_damage_recommendations(damage_type, confidence)
    details = {
        'tile_predictions': [],
        'small_cracks_detected': False,
        'num_tiles': 0,
        'damaged_tiles': 0,
        'full_image_damage_prob': confidence if damage_detected else 1 - confidence
    }
    return damage_detected, damage_type, confidence, recommendations, details


def predict_image_damage(image_data: bytes) -> Tuple[bool, Optional[str], float, List[str]]:
    """
    Predict structural damage from an image using PyTorch model with multi-scale detection

    Args:
        image_data: Raw image bytes

    Returns:
        Tuple of (damage_detected, damage_type, confidence, recommendations)
    """
    damage_detected, damage_type, confidence, recommendations, _ = predict_image_damage_multiscale(image_data)
    return damage_detected, damage_type, confidence, recommendations


# Try to load model on import
try:
    load_model()
except Exception as e:
    print(f"Could not load image model on startup: {e}")
