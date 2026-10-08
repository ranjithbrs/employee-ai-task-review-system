from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    tasks = relationship("Task", back_populates="program", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False) # "MANAGER" or "INTERN"
    phone = Column(String(30), nullable=True, default="+15550192834")
    avatar = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    assigned_tasks = relationship("Task", foreign_keys="Task.intern_id", back_populates="intern")
    managed_tasks = relationship("Task", foreign_keys="Task.manager_id", back_populates="manager")
    submissions = relationship("Submission", back_populates="intern")
    notifications = relationship("Notification", back_populates="recipient")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    title = Column(String(250), nullable=False)
    description = Column(Text, nullable=False)
    expected_outcome = Column(Text, nullable=True)
    evaluation_guidelines = Column(Text, nullable=True)
    ai_task_understanding = Column(Text, nullable=True) # AI synthesized understanding of the task
    week_number = Column(Integer, default=1)
    deadline = Column(DateTime, nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    intern_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="PENDING_SUBMISSION", index=True)
    # Statuses: PENDING_SUBMISSION, UNDER_REVIEW, NEEDS_REVISION, APPROVED, HUMAN_REVIEW_REQUIRED, OVERDUE
    max_revisions = Column(Integer, default=3)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    program = relationship("Program", back_populates="tasks")
    intern = relationship("User", foreign_keys=[intern_id], back_populates="assigned_tasks")
    manager = relationship("User", foreign_keys=[manager_id], back_populates="managed_tasks")
    submissions = relationship("Submission", back_populates="task", cascade="all, delete-orphan", order_by="Submission.version.desc()")
    notifications = relationship("Notification", back_populates="task", cascade="all, delete-orphan")
    history_events = relationship("ReviewHistory", back_populates="task", cascade="all, delete-orphan", order_by="ReviewHistory.created_at.desc()")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    intern_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    version = Column(Integer, default=1)
    submission_type = Column(String(30), default="FILE") # "FILE", "ZIP", "LINK", "TEXT"
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    repo_link = Column(String(500), nullable=True)
    submitted_text = Column(Text, nullable=True)
    extracted_content = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=utc_now)
    status = Column(String(50), default="UNDER_REVIEW") # UNDER_REVIEW, NEEDS_REVISION, APPROVED, HUMAN_REVIEW_REQUIRED

    task = relationship("Task", back_populates="submissions")
    intern = relationship("User", back_populates="submissions")
    ai_review = relationship("AIReview", back_populates="submission", uselist=False, cascade="all, delete-orphan")

class AIReview(Base):
    __tablename__ = "ai_reviews"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), unique=True, nullable=False)
    overall_score = Column(Float, nullable=False) # 0 to 100
    confidence_score = Column(Float, nullable=False) # 0 to 100
    recommendation = Column(String(50), nullable=False) # "APPROVED", "NEEDS_REVISION", "HUMAN_REVIEW_REQUIRED"
    overall_assessment = Column(Text, nullable=False) # Short human-style evaluation
    mentor_feedback = Column(Text, nullable=False) # Natural paragraph like human mentor
    
    # Structured JSON lists
    strengths_json = Column(Text, default="[]")
    weaknesses_json = Column(Text, default="[]") # Areas for improvement
    issues_json = Column(Text, default="[]") # Concrete errors found with evidence
    suggestions_json = Column(Text, default="[]") # Actionable recommendations
    
    # Continuous Improvement tracking (comparing with previous submission)
    previous_score = Column(Float, nullable=True)
    score_change = Column(Float, nullable=True) # e.g. +16
    improvement_summary = Column(Text, nullable=True) # AI narrative comparing v1 to v2
    previous_issues_status_json = Column(Text, default="[]") # list of {issue: str, status: "RESOLVED"|"PENDING", note: str}

    reviewed_at = Column(DateTime, default=utc_now)
    model_used = Column(String(100), default="gemini-2.5-flash")

    submission = relationship("Submission", back_populates="ai_review")

    # Helper properties for JSON columns
    @property
    def strengths(self):
        try:
            return json.loads(self.strengths_json) if self.strengths_json else []
        except Exception:
            return []

    @strengths.setter
    def strengths(self, val):
        self.strengths_json = json.dumps(val)

    @property
    def weaknesses(self):
        try:
            return json.loads(self.weaknesses_json) if self.weaknesses_json else []
        except Exception:
            return []

    @weaknesses.setter
    def weaknesses(self, val):
        self.weaknesses_json = json.dumps(val)

    @property
    def issues(self):
        try:
            return json.loads(self.issues_json) if self.issues_json else []
        except Exception:
            return []

    @issues.setter
    def issues(self, val):
        self.issues_json = json.dumps(val)

    @property
    def suggestions(self):
        try:
            return json.loads(self.suggestions_json) if self.suggestions_json else []
        except Exception:
            return []

    @suggestions.setter
    def suggestions(self, val):
        self.suggestions_json = json.dumps(val)

    @property
    def previous_issues_status(self):
        try:
            return json.loads(self.previous_issues_status_json) if self.previous_issues_status_json else []
        except Exception:
            return []

    @previous_issues_status.setter
    def previous_issues_status(self, val):
        self.previous_issues_status_json = json.dumps(val)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False) # NEW_TASK, REVISION_REQUESTED, TASK_APPROVED, DEADLINE_APPROACHING
    channel = Column(String(20), default="IN_APP") # IN_APP, EMAIL, SMS
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="UNREAD")
    sent_at = Column(DateTime, default=utc_now)

    task = relationship("Task", back_populates="notifications")
    recipient = relationship("User", back_populates="notifications")

class ReviewHistory(Base):
    __tablename__ = "review_history"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    event_type = Column(String(50), nullable=False)
    # CREATED, SUBMITTED, AI_REVIEWED, REVISION_REQUESTED, APPROVED, MANUAL_OVERRIDE, HUMAN_REVIEW_FLAGGED
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=utc_now)

    task = relationship("Task", back_populates="history_events")
