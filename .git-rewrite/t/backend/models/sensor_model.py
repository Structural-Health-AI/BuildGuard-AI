"""
Sensor Data Classification Model
Predicts structural health from accelerometer, strain, and temperature data
Uses RandomForest trained on real building health monitoring dataset
"""
import os
import numpy as np
import joblib
from typing import Tuple, List
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler


# Path to saved model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "saved_models", "sensor_classifier.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "saved_models", "sensor_scaler.pkl")

# Global model and scaler
_model = None
_scaler = None


def get_damage_recommendations(damage_level: str) -> List[str]:
    """Get recommendations based on damage level"""
    recommendations = {
        "healthy": [
            "Structure is in good condition",
            "Continue regular monitoring schedule",
            "Next inspection recommended in 6 months"
        ],
        "minor_damage": [
            "Minor structural anomalies detected",
            "Schedule detailed visual inspection within 2 weeks",
            "Monitor affected areas more frequently",
            "Consider non-destructive testing methods"
        ],
        "severe_damage": [
            "URGENT: Significant structural damage detected",
            "Evacuate the area immediately if occupied",
            "Contact structural engineer immediately",
            "Do not allow occupancy until professional assessment",
            "Document all observations and sensor readings"
        ]
    }
    return recommendations.get(damage_level, ["Unable to provide recommendations"])


def create_model_from_real_data():
    """Train model on real building health monitoring dataset"""
    import pandas as pd

    try:
        # Load real training data
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        csv_path = os.path.join(project_root, "data", "sensor", "building_health_monitoring_dataset.csv")

        print(f"[DEBUG] Loading real dataset from: {csv_path}")
        print(f"[DEBUG] Dataset exists: {os.path.exists(csv_path)}")

        df = pd.read_csv(csv_path)
        print(f"✓ Loaded {len(df)} real samples from dataset")

        # Extract features and labels
        # Columns: Accel_X, Accel_Y, Accel_Z, Strain, Temp, Condition Label
        X = df[['Accel_X (m/s^2)', 'Accel_Y (m/s^2)', 'Accel_Z (m/s^2)', 'Strain (με)', 'Temp (°C)']].values
        y = df['Condition Label'].values

        # Train scaler and model
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = RandomForestClassifier(n_estimators=200, random_state=42, max_depth=15, min_samples_split=5)
        model.fit(X_scaled, y)

        # Save model and scaler
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        joblib.dump(scaler, SCALER_PATH)

        print(f"✓ Model trained on {len(df)} real samples and saved")
        return model, scaler

    except Exception as e:
        print(f"✗ Failed to load real dataset: {e}")
        raise


def load_model():
    """Load the trained model and scaler"""
    global _model, _scaler

    if _model is not None and _scaler is not None:
        return _model, _scaler

    try:
        _model = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)
        print("✓ Loaded existing model from disk")
    except FileNotFoundError:
        print("Model not found, training new model on real data...")
        _model, _scaler = create_model_from_real_data()

    return _model, _scaler


def predict_sensor_health(
    accel_x: float,
    accel_y: float,
    accel_z: float,
    strain: float,
    temperature: float
) -> Tuple[str, float, List[str]]:
    """
    Predict structural health from sensor data using RandomForest trained on real data

    Args:
        accel_x: X-axis acceleration (m/s²)
        accel_y: Y-axis acceleration (m/s²)
        accel_z: Z-axis acceleration (m/s²)
        strain: Strain gauge reading (microstrain)
        temperature: Temperature (°C)

    Returns:
        Tuple of (damage_level, confidence, recommendations)
    """
    model, scaler = load_model()

    # Prepare input
    features = np.array([[accel_x, accel_y, accel_z, strain, temperature]])
    features_scaled = scaler.transform(features)

    print(f"[PREDICT DEBUG] Raw input: {features}")
    print(f"[PREDICT DEBUG] Scaled input: {features_scaled}")

    # Predict
    prediction = model.predict(features_scaled)[0]
    probabilities = model.predict_proba(features_scaled)[0]
    confidence = float(max(probabilities))

    print(f"[PREDICT DEBUG] Prediction: {prediction}, Probabilities: {probabilities}")

    # Map prediction to damage level
    damage_levels = ["healthy", "minor_damage", "severe_damage"]
    damage_level = damage_levels[prediction]

    # Get recommendations
    recommendations = get_damage_recommendations(damage_level)

    return damage_level, confidence, recommendations


# Initialize model on import
load_model()
