import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "medbook_super_secret_jwt_key_2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "medbook_super_secret_jwt_key_2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Primary DB URL (MySQL by default)
    MYSQL_DB_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost/medbook_db")
    
    # We test MySQL availability, if fail fallback to sqlite for zero-friction local execution
    SQLALCHEMY_DATABASE_URI = MYSQL_DB_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    USE_LLM = os.getenv("USE_LLM", "false").lower() == "true"
