"""
Database migration: Add user_id column to tables and ensure image_analyses table exists
Adds nullable user_id columns to sensor_predictions and image_analyses tables
to support both authenticated and anonymous users.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine

def migrate():
    """Run migration to add user_id columns and create tables"""
    with engine.connect() as connection:
        try:
            # Add user_id to sensor_predictions if it doesn't exist
            print("Checking sensor_predictions table...")
            try:
                result = connection.execute(
                    text("""
                        SELECT column_name FROM information_schema.columns 
                        WHERE table_name='sensor_predictions' AND column_name='user_id'
                    """)
                )
                
                if not result.fetchone():
                    print("Adding user_id column to sensor_predictions...")
                    connection.execute(text("""
                        ALTER TABLE sensor_predictions 
                        ADD COLUMN user_id INTEGER
                    """))
                    connection.commit()
                    print("✅ Added user_id to sensor_predictions")
                else:
                    print("✅ user_id already exists in sensor_predictions")
            except Exception as e:
                print(f"⚠️  sensor_predictions: {e}")

            # Check if image_analyses table exists
            print("\nChecking image_analyses table...")
            try:
                result = connection.execute(
                    text("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_name = 'image_analyses'
                        )
                    """)
                )
                table_exists = result.scalar()
                
                if not table_exists:
                    print("Creating image_analyses table...")
                    connection.execute(text("""
                        CREATE TABLE image_analyses (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER,
                            session_id VARCHAR(255),
                            image_path VARCHAR(500) NOT NULL,
                            damage_detected INTEGER NOT NULL DEFAULT 0,
                            damage_type VARCHAR(100),
                            confidence FLOAT NOT NULL,
                            recommendations JSON,
                            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                    connection.execute(text("CREATE INDEX idx_image_analyses_user_id ON image_analyses(user_id)"))
                    connection.execute(text("CREATE INDEX idx_image_analyses_session_id ON image_analyses(session_id)"))
                    connection.commit()
                    print("✅ Created image_analyses table")
                else:
                    print("✅ image_analyses table already exists")
                    
                    # Add user_id column if it doesn't exist
                    result = connection.execute(
                        text("""
                            SELECT column_name FROM information_schema.columns 
                            WHERE table_name='image_analyses' AND column_name='user_id'
                        """)
                    )
                    
                    if not result.fetchone():
                        print("Adding user_id column to image_analyses...")
                        connection.execute(text("""
                            ALTER TABLE image_analyses 
                            ADD COLUMN user_id INTEGER
                        """))
                        connection.commit()
                        print("✅ Added user_id to image_analyses")
                    else:
                        print("✅ user_id already exists in image_analyses")
                        
            except Exception as e:
                print(f"⚠️  image_analyses table error: {e}")

            print("\n✅ Migration completed!")
            
        except Exception as e:
            print(f"❌ Unexpected migration error: {e}")
            connection.rollback()
            raise

if __name__ == "__main__":
    migrate()
