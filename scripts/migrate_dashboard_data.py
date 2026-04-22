#!/usr/bin/env python3
"""
Migration script to fix dashboard data - assign user_id to orphaned analyses
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
from datetime import datetime

settings = get_settings()
engine = create_engine(settings.database_url)
Session = sessionmaker(bind=engine)
db = Session()

try:
    print("=== MIGRATION: Assign user_id to orphaned analyses ===\n")
    
    # Get the first/primary user (assuming demo user)
    user = db.query(User).first()
    if not user:
        print("ERROR: No user found in database!")
        sys.exit(1)
    
    user_id_str = str(user.id)
    print(f"Using user: {user.email} (id: {user.id})\n")
    
    # Migrate sensor predictions
    orphaned_sensors = db.query(SensorPrediction).filter(
        SensorPrediction.user_id == None
    ).all()
    
    print(f"Found {len(orphaned_sensors)} sensor predictions without user_id")
    for sensor in orphaned_sensors:
        sensor.user_id = user_id_str
    db.commit()
    print(f"✓ Migrated {len(orphaned_sensors)} sensor predictions\n")
    
    # Migrate image analyses
    orphaned_images = db.query(ImageAnalysis).filter(
        ImageAnalysis.user_id == None
    ).all()
    
    print(f"Found {len(orphaned_images)} image analyses without user_id")
    for image in orphaned_images:
        image.user_id = user_id_str
    db.commit()
    print(f"✓ Migrated {len(orphaned_images)} image analyses\n")
    
    # Migrate reports
    orphaned_reports = db.query(Report).filter(
        Report.user_id == None
    ).all()
    
    print(f"Found {len(orphaned_reports)} reports without user_id")
    for report in orphaned_reports:
        report.user_id = user_id_str
    db.commit()
    print(f"✓ Migrated {len(orphaned_reports)} reports\n")
    
    # Verify migration
    print("=== VERIFICATION ===\n")
    total_sensor = db.query(SensorPrediction).filter(SensorPrediction.user_id == user_id_str).count()
    total_image = db.query(ImageAnalysis).filter(ImageAnalysis.user_id == user_id_str).count()
    total_reports = db.query(Report).filter(Report.user_id == user_id_str).count()
    
    print(f"User {user.email} now has:")
    print(f"  - {total_sensor} sensor predictions")
    print(f"  - {total_image} image analyses")
    print(f"  - {total_reports} reports")
    
    healthy = db.query(SensorPrediction).filter(
        SensorPrediction.user_id == user_id_str,
        SensorPrediction.damage_level == "healthy"
    ).count()
    
    minor = db.query(SensorPrediction).filter(
        SensorPrediction.user_id == user_id_str,
        SensorPrediction.damage_level == "minor_damage"
    ).count()
    
    severe = db.query(SensorPrediction).filter(
        SensorPrediction.user_id == user_id_str,
        SensorPrediction.damage_level == "severe_damage"
    ).count()
    
    image_damage = db.query(ImageAnalysis).filter(
        ImageAnalysis.user_id == user_id_str,
        ImageAnalysis.damage_detected == 1
    ).count()
    
    print(f"\nDamage Summary:")
    print(f"  - Healthy: {healthy}")
    print(f"  - Minor Damage: {minor}")
    print(f"  - Severe Damage: {severe}")
    print(f"  - Image Damage: {image_damage}")
    
    print(f"\n✅ Migration completed successfully!")

except Exception as e:
    print(f"ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

finally:
    db.close()
