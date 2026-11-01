import unittest
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Flag testing environment
os.environ["TESTING"] = "1"
os.environ["GEMINI_API_KEY"] = ""

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.models import User, Program, Task
from app.auth import hash_password, create_access_token
from app.config import settings
from app.services.ai_service import ai_review_service

# Ensure tests run deterministically and offline without network timeouts
settings.GEMINI_API_KEY = ""
ai_review_service.api_key = ""

class BaseTestCase(unittest.TestCase):
    engine = None
    TestingSessionLocal = None

    @classmethod
    def setUpClass(cls):
        # Configure in-memory SQLite database with StaticPool for test isolation
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            future=True
        )
        Base.metadata.create_all(bind=cls.engine)
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=cls.engine, future=True
        )

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)

    def setUp(self):
        self.db = self.TestingSessionLocal()

        # Clean all tables before seeding each test
        for table in reversed(Base.metadata.sorted_tables):
            self.db.execute(table.delete())
        self.db.commit()

        # Override FastAPI get_db dependency
        def override_get_db():
            db = self.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        # Seed initial test entities
        self._seed_test_data()

    def tearDown(self):
        self.db.close()
        app.dependency_overrides.clear()

    def _seed_test_data(self):
        # 1. Create Manager
        self.manager = User(
            name="Sarah Connor",
            email="manager@demo.com",
            password_hash=hash_password("password123"),
            role="MANAGER",
            phone="+15550192834"
        )
        self.db.add(self.manager)

        # 2. Create Intern
        self.intern = User(
            name="Alex Chen",
            email="intern@demo.com",
            password_hash=hash_password("password123"),
            role="INTERN",
            phone="+15550192835"
        )
        self.db.add(self.intern)
        self.db.flush()

        # 3. Create Program
        now = datetime.now(timezone.utc)
        self.program = Program(
            title="Software Development Internship 2026",
            description="Intensive 4-week full stack engineering program.",
            start_date=now - timedelta(days=14),
            end_date=now + timedelta(days=14)
        )
        self.db.add(self.program)
        self.db.flush()

        # 4. Create Sample Task
        self.task = Task(
            program_id=self.program.id,
            title="Build Employee REST API",
            description="Create complete CRUD endpoints with database persistence.",
            expected_outcome="Functional REST API with Spring Boot or FastAPI.",
            evaluation_guidelines="- REST endpoints with CRUD\n- Input validation\n- Exception handling\n- Documentation",
            ai_task_understanding="Objective: Build Employee REST API with CRUD and validation.",
            week_number=2,
            deadline=now + timedelta(days=5),
            manager_id=self.manager.id,
            intern_id=self.intern.id,
            status="PENDING_SUBMISSION",
            max_revisions=3
        )
        self.db.add(self.task)
        self.db.commit()
        self.db.refresh(self.task)

        # Pre-generate auth tokens
        self.intern_token = create_access_token({"sub": str(self.intern.id), "role": self.intern.role})
        self.manager_token = create_access_token({"sub": str(self.manager.id), "role": self.manager.role})

    def get_auth_headers(self, role: str = "INTERN") -> dict:
        token = self.manager_token if role.upper() == "MANAGER" else self.intern_token
        return {"Authorization": f"Bearer {token}"}
