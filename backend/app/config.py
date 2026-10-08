import os
from pathlib import Path

# Resolve base directories
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
SAMPLE_DIR = BASE_DIR / "sample_files"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "AI-Powered Employee & Intern Task Review System"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-enterprise-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'task_review.db'}")
    
    # AI Review Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "75.0"))
    MAX_REVISION_ATTEMPTS: int = int(os.getenv("MAX_REVISION_ATTEMPTS", "3"))
    
    # File limits
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "15"))
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".docx", ".txt", ".md", ".zip"]
    
    # Notification & Multi-Channel Delivery modes
    SMS_DEMO_MODE: bool = True
    EMAIL_DEMO_MODE: bool = True

    # Outbound Email (SMTP Configuration - Optional)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "mentor-ai@company.com")

    # Outbound SMS (Twilio Configuration - Optional)
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_FROM_PHONE: str = os.getenv("TWILIO_FROM_PHONE", "")

    # Automated Repeating Reminder Engine
    AUTO_REMINDER_INTERVAL_MINUTES: int = int(os.getenv("AUTO_REMINDER_INTERVAL_MINUTES", "10"))
    AUTO_REMINDER_ENABLED: bool = os.getenv("AUTO_REMINDER_ENABLED", "True").lower() in ("true", "1", "yes")

settings = Settings()
