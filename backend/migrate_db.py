"""
Migrate data from SQLite to PostgreSQL (Supabase)
"""
import pandas as pd
from sqlalchemy import create_engine, text
from core.config import settings

# Source: SQLite
sqlite_path = "./buildguard.db"
sqlite_engine = create_engine(f"sqlite:///{sqlite_path}")

# Destination: PostgreSQL (from .env)
postgres_engine = create_engine(settings.database_url)

try:
    # Get all table names from SQLite (excluding internal tables)
    with sqlite_engine.connect() as conn:
        tables = [row[0] for row in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()]
    
    # Filter out sqlite internal tables
    tables = [t for t in tables if not t.startswith('sqlite_')]
    
    if not tables:
        print("❌ No tables found in SQLite database")
    else:
        print(f"📊 Found {len(tables)} tables: {tables}")
        
        for table in tables:
            try:
                # Read data from SQLite using pandas
                df = pd.read_sql_table(table, sqlite_engine)
                
                if len(df) > 0:
                    # Write to PostgreSQL, replacing existing data
                    df.to_sql(table, postgres_engine, if_exists='replace', index=False)
                    print(f"✅ Migrated {len(df)} rows from {table}")
                else:
                    print(f"⏭️  {table} is empty, skipping")
            except Exception as table_error:
                print(f"⚠️  Error migrating {table}: {table_error}")
        
        print("\n✅ Migration complete!")
        
except Exception as e:
    print(f"❌ Migration failed: {e}")
    import traceback
    traceback.print_exc()
finally:
    sqlite_engine.dispose()
    postgres_engine.dispose()
