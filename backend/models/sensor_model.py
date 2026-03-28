"""
Sensor Data Classification Model
Predicts structural health from accelerometer, strain, and temperature data
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


def create_dummy_model():
    """Train model on actual dataset"""
    import pandas as pd

    try:
        # Load actual training data - go up 2 levels from models/ to project root
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        csv_path = os.path.join(project_root, "data", "sensor", "building_health_monitoring_dataset.csv")
        print(f"[DEBUG] Attempting to load CSV from: {csv_path}")
        print(f"[DEBUG] CSV exists: {os.path.exists(csv_path)}")
        df = pd.read_csv(csv_path)
        print(f"[DEBUG] Successfully loaded {len(df)} samples from CSV")

        # Extract features and labels
        X = df.iloc[:, 1:6].values  # Accel_X, Y, Z, Strain, Temp
        y = df['Condition Label'].values

        # Train scaler and model
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = RandomForestClassifier(n_estimators=150, random_state=42, max_depth=10)
        model.fit(X_scaled, y)

        # Save model and scaler
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        joblib.dump(scaler, SCALER_PATH)

        print(f"✓ Model trained on {len(df)} real samples")
        return model, scaler

    except Exception as e:
        print(f"Failed to load dataset: {e}. Using fallback synthetic data...")
        return create_fallback_model()


def create_fallback_model():
    """Fallback synthetic model if dataset not available"""
    np.random.seed(42)
    n_samples = 1000

    # Based on actual data ranges
    # Healthy: low strain around 100
    healthy_data = np.column_stack([
        np.random.normal(0.013, 0.4, n_samples),  # accel_x: mean 0.013, normalized
        np.random.normal(0.019, 0.4, n_samples),  # accel_y: mean 0.019
        np.random.normal(9.77, 0.1, n_samples),   # accel_z
        np.random.normal(100, 20, n_samples),     # strain: mean 100
        np.random.normal(24.5, 3, n_samples),     # temperature
    ])

    # Minor damage: moderate acceleration, strain around 127
    minor_data = np.column_stack([
        np.random.normal(0.24, 0.4, n_samples),   # accel_x: mean 0.24
        np.random.normal(0.041, 0.4, n_samples),  # accel_y: mean 0.041
        np.random.normal(9.75, 0.12, n_samples),
        np.random.normal(127, 25, n_samples),     # strain: mean 127
        np.random.normal(24.5, 3, n_samples),
    ])

    # Severe damage: higher acceleration, strain around 160
    severe_data = np.column_stack([
        np.random.normal(0.421, 0.45, n_samples), # accel_x: mean 0.421
        np.random.normal(-0.016, 0.35, n_samples),# accel_y: mean -0.016
        np.random.normal(9.73, 0.15, n_samples),
        np.random.normal(160, 30, n_samples),     # strain: mean 160
        np.random.normal(24.5, 3, n_samples),
    ])

    X = np.vstack([healthy_data, minor_data, severe_data])
    y = np.array([0] * n_samples + [1] * n_samples + [2] * n_samples)

    indices = np.random.permutation(len(X))
    X = X[indices]
    y = y[indices]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = RandomForestClassifier(n_estimators=150, random_state=42, max_depth=10)
    model.fit(X_scaled, y)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    return model, scaler


def load_model():
    """Load the trained model and scaler"""
    global _model, _scaler

    if _model is not None and _scaler is not None:
        return _model, _scaler

    try:
        _model = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)
    except FileNotFoundError:
        print("Model not found, creating dummy model for testing...")
        _model, _scaler = create_dummy_model()

    return _model, _scaler


def predict_sensor_health(
    accel_x: float,
    accel_y: float,
    accel_z: float,
    strain: float,
    temperature: float
) -> Tuple[str, float, List[str]]:
    """
    Predict structural health from sensor data

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
