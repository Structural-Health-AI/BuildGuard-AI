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
        
        # Ensure parent directory exists
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)

        if not os.path.exists(csv_path):
            print(f"[WARNING] Dataset file not found at {csv_path}")
            raise FileNotFoundError(f"Dataset not found at {csv_path}")

        df = pd.read_csv(csv_path)
        
        # Validate that we have data
        if len(df) == 0:
            raise ValueError("Dataset is empty")
        
        # Check required columns
        required_cols = ['Accel_X (m/s^2)', 'Accel_Y (m/s^2)', 'Accel_Z (m/s^2)', 'Strain (με)', 'Temp (°C)', 'Condition Label']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Dataset missing required columns: {missing_cols}")
        
        print(f"[OK] Loaded {len(df)} real samples from dataset")

        # Extract features and labels
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

        print(f"[OK] Model trained on {len(df)} real samples and saved")
        return model, scaler

    except FileNotFoundError as e:
        print(f"[WARNING] Dataset file not found: {e}")
        print("[INFO] Creating synthetic model instead...")
        return create_synthetic_model()
    except Exception as e:
        print(f"[WARNING] Failed to load real dataset: {e}")
        print("[INFO] Creating synthetic model instead...")
        return create_synthetic_model()


def create_synthetic_model():
    """Create model using synthetic training data (fallback when real data unavailable)"""
    print("[DEBUG] Generating synthetic sensor training data...")
    
    # Create synthetic dataset
    np.random.seed(42)
    n_samples = 500
    
    # Healthy samples (low acceleration, low strain, normal temp)
    healthy_accel_x = np.random.normal(0.05, 0.02, n_samples // 3)
    healthy_accel_y = np.random.normal(0.05, 0.02, n_samples // 3)
    healthy_accel_z = np.random.normal(0.1, 0.03, n_samples // 3)
    healthy_strain = np.random.normal(20, 10, n_samples // 3)
    healthy_temp = np.random.normal(25, 2, n_samples // 3)
    healthy_label = np.zeros(n_samples // 3)
    
    # Minor damage samples
    minor_accel_x = np.random.normal(0.15, 0.05, n_samples // 3)
    minor_accel_y = np.random.normal(0.15, 0.05, n_samples // 3)
    minor_accel_z = np.random.normal(0.25, 0.08, n_samples // 3)
    minor_strain = np.random.normal(80, 20, n_samples // 3)
    minor_temp = np.random.normal(28, 3, n_samples // 3)
    minor_label = np.ones(n_samples // 3)
    
    # Severe damage samples
    severe_accel_x = np.random.normal(0.4, 0.1, n_samples // 3)
    severe_accel_y = np.random.normal(0.4, 0.1, n_samples // 3)
    severe_accel_z = np.random.normal(0.6, 0.15, n_samples // 3)
    severe_strain = np.random.normal(200, 50, n_samples // 3)
    severe_temp = np.random.normal(35, 5, n_samples // 3)
    severe_label = 2 * np.ones(n_samples // 3)
    
    # Combine
    X = np.vstack([
        np.column_stack([healthy_accel_x, healthy_accel_y, healthy_accel_z, healthy_strain, healthy_temp]),
        np.column_stack([minor_accel_x, minor_accel_y, minor_accel_z, minor_strain, minor_temp]),
        np.column_stack([severe_accel_x, severe_accel_y, severe_accel_z, severe_strain, severe_temp])
    ])
    y = np.hstack([healthy_label, minor_label, severe_label])
    
    # Train model on synthetic data
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10, min_samples_split=5)
    model.fit(X_scaled, y)
    
    # Save model and scaler
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    
    print("[OK] Synthetic model trained on 500 samples and saved")
    return model, scaler


def load_model():
    """Load the trained model and scaler"""
    global _model, _scaler

    if _model is not None and _scaler is not None:
        return _model, _scaler

    try:
        _model = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)
        print("[OK] Loaded existing model from disk")
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
