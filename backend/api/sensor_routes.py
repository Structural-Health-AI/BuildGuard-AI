"""
Sensor Analysis API Routes
Endpoints for sensor-based structural health prediction
"""
import sqlite3
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address

from schemas.schemas import SensorDataInput, SensorPredictionResponse, DamageLevel
from models.sensor_model import predict_sensor_health

router = APIRouter()
DATABASE_PATH = "buildguard.db"
limiter = Limiter(key_func=get_remote_address)


@router.post("/predict", response_model=SensorPredictionResponse)
@limiter.limit("20/minute")
async def predict_from_sensors(request: Request, data: SensorDataInput):
    """
    Analyze sensor data and predict structural health

    - **accel_x, accel_y, accel_z**: Accelerometer readings (m/s²)
    - **strain**: Strain gauge reading (microstrain)
    - **temperature**: Temperature (°C)
    
    **Rate Limit:** 20 requests per minute per IP
    """
    try:
        # Get prediction from model
        damage_level, confidence, recommendations = predict_sensor_health(
            accel_x=data.accel_x,
            accel_y=data.accel_y,
            accel_z=data.accel_z,
            strain=data.strain,
            temperature=data.temperature
        )

        # Save to database
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO sensor_predictions
            (accel_x, accel_y, accel_z, strain, temperature, building_name, location,
             damage_level, confidence, recommendations)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.accel_x, data.accel_y, data.accel_z, data.strain, data.temperature,
            data.building_name, data.location, damage_level, confidence,
            json.dumps(recommendations)
        ))

        prediction_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return SensorPredictionResponse(
            id=prediction_id,
            damage_level=DamageLevel(damage_level),
            confidence=confidence,
            timestamp=datetime.now(),
            recommendations=recommendations,
            input_data=data
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/history", response_model=List[dict])
async def get_sensor_history(limit: int = 50):
    """Get history of sensor predictions"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, accel_x, accel_y, accel_z, strain, temperature,
               building_name, location, damage_level, confidence,
               recommendations, created_at
        FROM sensor_predictions
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        item = dict(row)
        item['recommendations'] = json.loads(item['recommendations']) if item['recommendations'] else []
        results.append(item)

    return results


@router.get("/{prediction_id}")
async def get_sensor_prediction(prediction_id: int):
    """Get a specific sensor prediction by ID"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM sensor_predictions WHERE id = ?
    """, (prediction_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Prediction not found")

    result = dict(row)
    result['recommendations'] = json.loads(result['recommendations']) if result['recommendations'] else []

    return result


@router.delete("/{prediction_id}")
async def delete_sensor_prediction(prediction_id: int):
    """Delete a sensor prediction"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM sensor_predictions WHERE id = ?", (prediction_id,))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Prediction not found")

    conn.commit()
    conn.close()

    return {"message": "Prediction deleted successfully"}
