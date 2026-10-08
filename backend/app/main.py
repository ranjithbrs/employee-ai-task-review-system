import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings, SAMPLE_DIR, UPLOAD_DIR
from app.database import engine, Base, SessionLocal
from app.routers import auth_router, task_router, submission_router, notification_router
from app.services.seed_service import seed_database
from app.services.notification_service import notification_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("task_review_system")

async def reminder_background_loop():
    """Periodically executes automated recurring reminder scans in the background."""
    while True:
        try:
            await asyncio.sleep(settings.AUTO_REMINDER_INTERVAL_MINUTES * 60)
            if settings.AUTO_REMINDER_ENABLED:
                logger.info("Executing periodic automated reminder check...")
                db = SessionLocal()
                try:
                    res = notification_service.check_and_send_repeating_reminders(db)
                    logger.info(f"Automated reminder check complete: {res.get('reminders_dispatched_count', 0)} dispatched.")
                finally:
                    db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning(f"Error in background reminder loop: {e}")
            await asyncio.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed demo data
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Seeding initial demo data and sample test files...")
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("Demo data verified.")
    finally:
        db.close()

    # Start background reminder loop
    reminder_task = asyncio.create_task(reminder_background_loop())

    yield

    # Shutdown
    reminder_task.cancel()
    logger.info("Application shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Continuous Internship Task Review System API",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development/hackathon, allow all frontend ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers under /api
app.include_router(auth_router.router, prefix="/api")
app.include_router(task_router.router, prefix="/api")
app.include_router(submission_router.router, prefix="/api")
app.include_router(notification_router.router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/api/health",
        "message": "MentorAI API is running. Access interactive docs at /docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_model": settings.GEMINI_MODEL if settings.GEMINI_API_KEY else "intelligent-mentor-engine (fallback enabled)"
    }
