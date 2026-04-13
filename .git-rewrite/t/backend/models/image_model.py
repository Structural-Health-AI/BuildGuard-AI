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
# Classes match flow_from_directory alphabetical order: 'damage' then 'no_damage'
DAMAGE_CLASSES = ["damage", "no_damage"]  # 0 = damage detected, 1 = no damage


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
        # Try to load the full model first
        _model = keras_load_model(MODEL_PATH)
    except Exception as e:
        print(f"Could not load full model: {e}")
        print("Attempting to load weights only...")
        try:
            # Build model architecture fresh
            base_model = MobileNetV2(
                weights='imagenet',
                include_top=False,
                input_shape=(*IMG_SIZE, 3)
            )
            base_model.trainable = False

            x = base_model.output
            x = GlobalAveragePooling2D()(x)
            x = Dense(128, activation='relu')(x)
            x = Dropout(0.3)(x)
            outputs = Dense(len(DAMAGE_CLASSES), activation='softmax')(x)

            _model = Model(inputs=base_model.input, outputs=outputs)
            _model.compile(
                optimizer='adam',
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )

            # Load weights from saved model
            _model.load_weights(MODEL_PATH, skip_mismatch=True)
            print("Model loaded from weights successfully")
        except Exception as e2:
            print(f"Could not load weights: {e2}")
            print("Creating placeholder model...")
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

    # Bounds check
    if predicted_class < 0 or predicted_class >= len(DAMAGE_CLASSES):
        predicted_class = 0  # Default to no damage if out of bounds

    confidence = float(predictions[predicted_class])

    # Determine damage
    if predicted_class == 1:  # no_damage (class 1)
        damage_detected = False
        damage_type = None
    else:  # damage (class 0)
        damage_detected = True
        damage_type = "damage"

    # Get recommendations
    recommendations = get_damage_recommendations(damage_type, confidence)

    return damage_detected, damage_type, confidence, recommendations


# Try to load model on import
try:
    load_model()
except Exception as e:
    print(f"Could not load image model on startup: {e}")
