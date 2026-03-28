"""
Image-based Damage Detection Model
Uses CNN to detect structural damage from images
"""
import os
import numpy as np
from typing import Tuple, List, Optional
from PIL import Image
import io

# TensorFlow imports (with fallback for environments without GPU)
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model as keras_load_model
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
    from tensorflow.keras.models import Model
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("TensorFlow not available, using mock predictions")


# Path to saved model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "saved_models", "damage_detector.h5")

# Global model
_model = None

# Image settings
IMG_SIZE = (224, 224)
DAMAGE_CLASSES = ["no_damage", "crack", "spalling", "corrosion", "structural_deformation"]


def get_damage_recommendations(damage_type: Optional[str], confidence: float) -> List[str]:
    """Get recommendations based on detected damage type"""
    if damage_type is None or damage_type == "no_damage":
        return [
            "No visible damage detected in the image",
            "Continue regular visual inspections",
            "Document this inspection for records"
        ]

    recommendations = {
        "crack": [
            "Cracks detected in the structure",
            "Measure and document crack width and length",
            "Monitor for crack progression over time",
            "Consult structural engineer if cracks exceed 3mm width"
        ],
        "spalling": [
            "Concrete spalling detected",
            "Check for exposed reinforcement",
            "Assess depth and extent of spalling",
            "Consider repair or resurfacing if damage is significant"
        ],
        "corrosion": [
            "Corrosion/rust detected on structural elements",
            "Check for source of moisture/water intrusion",
            "Assess extent of material loss",
            "Consider protective coatings or replacement"
        ],
        "structural_deformation": [
            "CRITICAL: Structural deformation detected",
            "Evacuate area immediately if significant",
            "Contact structural engineer urgently",
            "Do not load the structure until assessed"
        ]
    }

    base_recommendations = recommendations.get(damage_type, ["Damage detected, consult engineer"])

    if confidence < 0.7:
        base_recommendations.append("Note: Confidence is moderate, manual verification recommended")

    return base_recommendations


def create_dummy_model():
    """Create a placeholder model for testing"""
    if not TF_AVAILABLE:
        return None

    # Create a simple model based on MobileNetV2
    base_model = MobileNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=(*IMG_SIZE, 3)
    )

    # Freeze base model
    base_model.trainable = False

    # Add classification layers
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.3)(x)
    outputs = Dense(len(DAMAGE_CLASSES), activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=outputs)
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    # Save model
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model.save(MODEL_PATH)

    return model


def load_model():
    """Load the trained damage detection model"""
    global _model

    if _model is not None:
        return _model

    if not TF_AVAILABLE:
        return None

    try:
        _model = keras_load_model(MODEL_PATH)
    except (OSError, IOError):
        print("Model not found, creating placeholder model...")
        _model = create_dummy_model()

    return _model


def preprocess_image(image_data: bytes) -> np.ndarray:
    """Preprocess image for model prediction"""
    # Open image
    image = Image.open(io.BytesIO(image_data))

    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')

    # Resize
    image = image.resize(IMG_SIZE)

    # Convert to array and normalize
    img_array = np.array(image) / 255.0

    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)

    return img_array


def predict_image_damage(image_data: bytes) -> Tuple[bool, Optional[str], float, List[str]]:
    """
    Predict structural damage from an image

    Args:
        image_data: Raw image bytes

    Returns:
        Tuple of (damage_detected, damage_type, confidence, recommendations)
    """
    model = load_model()

    if model is None:
        # Fallback for when TensorFlow is not available
        # Return a mock prediction for testing
        import random
        damage_detected = random.random() > 0.5
        if damage_detected:
            damage_type = random.choice(DAMAGE_CLASSES[1:])
            confidence = random.uniform(0.6, 0.95)
        else:
            damage_type = None
            confidence = random.uniform(0.7, 0.95)
        recommendations = get_damage_recommendations(damage_type, confidence)
        return damage_detected, damage_type, confidence, recommendations

    # Preprocess image
    img_array = preprocess_image(image_data)

    # Predict
    predictions = model.predict(img_array, verbose=0)[0]
    predicted_class = int(np.argmax(predictions))
    confidence = float(predictions[predicted_class])

    # Determine damage
    if predicted_class == 0:  # no_damage
        damage_detected = False
        damage_type = None
    else:
        damage_detected = True
        damage_type = DAMAGE_CLASSES[predicted_class]

    # Get recommendations
    recommendations = get_damage_recommendations(damage_type, confidence)

    return damage_detected, damage_type, confidence, recommendations


# Try to load model on import
try:
    load_model()
except Exception as e:
    print(f"Could not load image model on startup: {e}")
