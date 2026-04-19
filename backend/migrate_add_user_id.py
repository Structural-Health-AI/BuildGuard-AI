"""
Database migration to add user_id column to tables
Run this once to add user tracking to existing data

Usage:
    python migrate_add_user_id.py
"""
import sqlite3
import os
from pathlib import Path

DATABASE_PATH = "buildguard.db"


def migrate_add_user_id_columns():
    """Add user_id columns to sensor_predictions, image_analyses, and reports tables"""
    
    if not os.path.exists(DATABASE_PATH):
        print(f"Database not found at {DATABASE_PATH}")
        return False
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        print("Starting migration: Adding user_id columns...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(sensor_predictions)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "user_id" not in columns:
            print("Adding user_id to sensor_predictions...")
            cursor.execute("""
                ALTER TABLE sensor_predictions 
                ADD COLUMN user_id INTEGER DEFAULT NULL
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_sensor_predictions_user_id 
                ON sensor_predictions(user_id)
            """)
        else:
            print("user_id already exists in sensor_predictions")
        
        # Check image_analyses table
        cursor.execute("PRAGMA table_info(image_analyses)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "user_id" not in columns:
            print("Adding user_id to image_analyses...")
            cursor.execute("""
                ALTER TABLE image_analyses 
                ADD COLUMN user_id INTEGER DEFAULT NULL
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_image_analyses_user_id 
                ON image_analyses(user_id)
            """)
        else:
            print("user_id already exists in image_analyses")
        
        # Check reports table
        cursor.execute("PRAGMA table_info(reports)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "user_id" not in columns:
            print("Adding user_id to reports...")
            cursor.execute("""
                ALTER TABLE reports 
                ADD COLUMN user_id INTEGER DEFAULT NULL
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_reports_user_id 
                ON reports(user_id)
            """)
        else:
            print("user_id already exists in reports")
        
        conn.commit()
        print("✓ Migration completed successfully!")
        return True
        
    except sqlite3.OperationalError as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    success = migrate_add_user_id_columns()
    exit(0 if success else 1)
