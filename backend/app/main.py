import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings, SAMPLE_DIR, UPLOAD_DIR
from app.database import engine, Base, SessionLocal
from app.routers import auth_router, task_router, submission_router, notification_router
from app.services.seed_service import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("task_review_system")

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
    yield
    # Shutdown
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

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_model": settings.GEMINI_MODEL if settings.GEMINI_API_KEY else "intelligent-mentor-engine (fallback enabled)"
    }
