"""
Sensor Analysis API Routes
Endpoints for sensor-based structural health prediction
"""
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from schemas.schemas import SensorDataInput, SensorPredictionResponse, DamageLevel
from models.sensor_model import predict_sensor_health
from models.user_model import User, SensorPrediction
from core.config import get_settings
from database import get_db
from api.dependencies import get_current_user

router = APIRouter()
settings = get_settings()

limiter = Limiter(key_func=get_remote_address)


@router.post("/predict", response_model=SensorPredictionResponse)
@limiter.limit("20/minute")
async def predict_from_sensors(
    request: Request,
    data: SensorDataInput,
    session_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze sensor data and predict structural health

    - **accel_x, accel_y, accel_z**: Accelerometer readings (m/s²)
    - **strain**: Strain gauge reading (microstrain)
    - **temperature**: Temperature (°C)
    - **session_id**: (Optional) User session ID for per-user analytics
    
    **Rate Limit:** 20 requests per minute per IP
    """
    try:
        # Get session_id from query parameter if not in body
        if not session_id:
            session_id = request.query_params.get("session_id")
        
        # Get prediction from model
        damage_level, confidence, recommendations = predict_sensor_health(
            accel_x=data.accel_x,
            accel_y=data.accel_y,
            accel_z=data.accel_z,
            strain=data.strain,
            temperature=data.temperature
        )

        # Save to database using SQLAlchemy ORM
        db_prediction = SensorPrediction(
            user_id=current_user.id,
            session_id=session_id,
            accel_x=data.accel_x,
            accel_y=data.accel_y,
            accel_z=data.accel_z,
            strain=data.strain,
            temperature=data.temperature,
            building_name=data.building_name,
            location=data.location,
            damage_level=damage_level,
            confidence=confidence,
            recommendations=recommendations
        )
        
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)

        return SensorPredictionResponse(
            id=db_prediction.id,
            damage_level=DamageLevel(damage_level),
            confidence=confidence,
            timestamp=datetime.now(),
            recommendations=recommendations,
            input_data=data
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/history", response_model=List[dict])
async def get_sensor_history(limit: int = 50, db: Session = Depends(get_db)):
    """Get history of sensor predictions"""
    predictions = db.query(SensorPrediction).order_by(
        SensorPrediction.created_at.desc()
    ).limit(limit).all()

    results = []
    for pred in predictions:
        results.append({
            "id": pred.id,
            "session_id": pred.session_id,
            "accel_x": pred.accel_x,
            "accel_y": pred.accel_y,
            "accel_z": pred.accel_z,
            "strain": pred.strain,
            "temperature": pred.temperature,
            "building_name": pred.building_name,
            "location": pred.location,
            "damage_level": pred.damage_level,
            "confidence": pred.confidence,
            "recommendations": pred.recommendations or [],
            "created_at": pred.created_at
        })

    return results


@router.get("/{prediction_id}")
async def get_sensor_prediction(prediction_id: int, db: Session = Depends(get_db)):
    """Get a specific sensor prediction by ID"""
    prediction = db.query(SensorPrediction).filter(
        SensorPrediction.id == prediction_id
    ).first()

@router.get("/{prediction_id}")
async def get_sensor_prediction(prediction_id: int, db: Session = Depends(get_db)):
    """Get a specific sensor prediction by ID"""
    prediction = db.query(SensorPrediction).filter(
        SensorPrediction.id == prediction_id
    ).first()

    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    return {
        "id": prediction.id,
        "session_id": prediction.session_id,
        "accel_x": prediction.accel_x,
        "accel_y": prediction.accel_y,
        "accel_z": prediction.accel_z,
        "strain": prediction.strain,
        "temperature": prediction.temperature,
        "building_name": prediction.building_name,
        "location": prediction.location,
        "damage_level": prediction.damage_level,
        "confidence": prediction.confidence,
        "recommendations": prediction.recommendations or [],
        "created_at": prediction.created_at
    }


@router.delete("/{prediction_id}")
async def delete_sensor_prediction(prediction_id: int, db: Session = Depends(get_db)):
    """Delete a sensor prediction"""
    prediction = db.query(SensorPrediction).filter(
        SensorPrediction.id == prediction_id
    ).first()

    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    db.delete(prediction)
    db.commit()

    return {"message": "Prediction deleted successfully"}
