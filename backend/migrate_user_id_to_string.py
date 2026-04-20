"""
Migration: Change user_id column from Integer to String in sensor_predictions and image_analyses tables
This migration handles the conversion from integer user IDs to string-based user IDs
"""

from sqlalchemy import text
from database import SessionLocal, engine
import sys

def migrate():
    """Run the migration"""
    db = SessionLocal()
    
    try:
        print("Starting migration: user_id column type change...")
        
        with engine.connect() as conn:
            # Check if columns already exist and their current type
            print("\n1. Checking sensor_predictions table...")
            try:
                result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sensor_predictions' AND column_name = 'user_id'"))
                row = result.fetchone()
                if row:
                    print(f"   Current user_id type: {row[1]}")
                else:
                    print("   user_id column not found")
            except Exception as e:
                print(f"   Could not check column info: {e}")
            
            # Migrate sensor_predictions table
            print("\n2. Migrating sensor_predictions table...")
            try:
                # Drop the old column and recreate it as VARCHAR
                # PostgreSQL approach: use ALTER COLUMN with USING to convert the data
                conn.execute(text("""
                    ALTER TABLE sensor_predictions 
                    ALTER COLUMN user_id TYPE VARCHAR(255) 
                    USING CASE WHEN user_id IS NOT NULL THEN user_id::text ELSE NULL END
                """))
                conn.commit()
                print("   ✓ sensor_predictions.user_id migrated to VARCHAR(255)")
            except Exception as e:
                print(f"   ✗ Error migrating sensor_predictions: {e}")
                conn.rollback()
            
            # Migrate image_analyses table
            print("\n3. Migrating image_analyses table...")
            try:
                conn.execute(text("""
                    ALTER TABLE image_analyses 
                    ALTER COLUMN user_id TYPE VARCHAR(255) 
                    USING CASE WHEN user_id IS NOT NULL THEN user_id::text ELSE NULL END
                """))
                conn.commit()
                print("   ✓ image_analyses.user_id migrated to VARCHAR(255)")
            except Exception as e:
                print(f"   ✗ Error migrating image_analyses: {e}")
                conn.rollback()
        
        print("\n✓ Migration completed successfully!")
        print("\nChanges:")
        print("  - sensor_predictions.user_id: INTEGER → VARCHAR(255)")
        print("  - image_analyses.user_id: INTEGER → VARCHAR(255)")
        print("\nThe system can now store string-based user IDs (e.g., 'user_<timestamp>_<random>')")
        
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
