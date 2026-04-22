#!/usr/bin/env python3
"""
Debug script to check if dashboard data is being saved correctly
"""
import sys
import os
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)
os.chdir(backend_path)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.user_model import User, SensorPrediction, ImageAnalysis, Report
from core.config import get_settings

settings = get_settings()

# Create engine
engine = create_engine(settings.database_url)
Session = sessionmaker(bind=engine)
db = Session()

try:
    print("=== USERS ===")
    users = db.query(User).all()
    for user in users:
        print(f"ID: {user.id} (type: {type(user.id).__name__}), Email: {user.email}")
    
    print("\n=== SENSOR PREDICTIONS ===")
    sensor_preds = db.query(SensorPrediction).all()
    print(f"Total: {len(sensor_preds)}")
    for pred in sensor_preds[:5]:  # Show first 5
        print(f"ID: {pred.id}, user_id: {pred.user_id} (type: {type(pred.user_id).__name__}), damage_level: {pred.damage_level}, created_at: {pred.created_at}")
    
    print("\n=== IMAGE ANALYSES ===")
    image_analyses = db.query(ImageAnalysis).all()
    print(f"Total: {len(image_analyses)}")
    for img in image_analyses[:5]:  # Show first 5
        print(f"ID: {img.id}, user_id: {img.user_id} (type: {type(img.user_id).__name__}), damage_detected: {img.damage_detected}, created_at: {img.created_at}")
    
    print("\n=== REPORTS ===")
    reports = db.query(Report).all()
    print(f"Total: {len(reports)}")
    for rpt in reports[:5]:  # Show first 5
        print(f"ID: {rpt.id}, user_id: {rpt.user_id}, building_name: {rpt.building_name}, created_at: {rpt.created_at}")
    
    print("\n=== TEST DASHBOARD QUERY FOR FIRST USER ===")
    if users:
        test_user = users[0]
        user_id_str = str(test_user.id)
        print(f"Testing with user: {test_user.email}, id: {test_user.id}, id_str: {user_id_str}")
        
        total_sensor = db.query(SensorPrediction).filter(SensorPrediction.user_id == user_id_str).count()
        total_image = db.query(ImageAnalysis).filter(ImageAnalysis.user_id == user_id_str).count()
        
        print(f"Sensor predictions for this user: {total_sensor}")
        print(f"Image analyses for this user: {total_image}")
        
        healthy = db.query(SensorPrediction).filter(
            SensorPrediction.user_id == user_id_str,
            SensorPrediction.damage_level == "healthy"
        ).count()
        
        print(f"Healthy status count: {healthy}")

finally:
    db.close()
