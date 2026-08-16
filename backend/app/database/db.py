import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# MySQL Database configuration with fallback to SQLite for zero-hassle local execution
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "root")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB", "churn_db")

MYSQL_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
SQLITE_URL = "sqlite:///./churn_system.db"

DATABASE_URL = os.getenv("DATABASE_URL")

engine = None
db_type = "sqlite"

# Try connecting to MySQL first if configured or fallback to SQLite
if DATABASE_URL:
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            db_type = "configured"
            print(f"Connected to database via DATABASE_URL ({db_type})")
    except Exception as e:
        print(f"Failed connecting to DATABASE_URL: {e}")
        engine = None

if engine is None:
    try:
        # Check if MySQL server is accessible and create database if needed
        base_mysql_url = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}"
        temp_engine = create_engine(base_mysql_url)
        with temp_engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DB}"))
            conn.commit()
        
        engine = create_engine(MYSQL_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            db_type = "mysql"
            print(f"Connected successfully to MySQL database '{MYSQL_DB}' on {MYSQL_HOST}:{MYSQL_PORT}")
    except Exception as e:
        print(f"MySQL connection unavailable ({e}). Falling back to SQLite local database.")
        engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
        db_type = "sqlite"
        print("Connected to SQLite database.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.database import models  # noqa
    Base.metadata.create_all(bind=engine)
    print(f"Database schema initialized successfully using {db_type.upper()}.")
