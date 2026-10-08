from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    role: str # "MANAGER" or "INTERN"
    phone: Optional[str] = None
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Program Schemas
class ProgramResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    start_date: datetime
    end_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class InternshipProgressResponse(BaseModel):
    program_title: str
    start_date: datetime
    end_date: datetime
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    progress_percentage: float
    average_review_score: float
    current_week: int

# AI Review Models
class PreviousIssueStatusItem(BaseModel):
    issue: str
    status: str # "RESOLVED" (check) or "PENDING" (cross)
    note: str

class AIReviewResponse(BaseModel):
    id: int
    submission_id: int
    overall_score: float
    confidence_score: float
    recommendation: str # "APPROVED", "NEEDS_REVISION", "HUMAN_REVIEW_REQUIRED"
    overall_assessment: str
    mentor_feedback: str
    strengths: List[str]
    weaknesses: List[str]
    issues: List[str]
    suggestions: List[str]
    previous_score: Optional[float] = None
    score_change: Optional[float] = None
    improvement_summary: Optional[str] = None
    previous_issues_status: List[dict] = []
    reviewed_at: datetime
    model_used: str

    class Config:
        from_attributes = True

class AIReviewStructuredResult(BaseModel):
    score: float = Field(..., ge=0.0, le=100.0)
    confidence: float = Field(..., ge=0.0, le=100.0)
    recommendation: str # "APPROVED", "NEEDS_REVISION", "HUMAN_REVIEW_REQUIRED"
    human_review_required: bool = False
    overall_assessment: str
    strengths: List[str]
    areas_for_improvement: List[str]
    issues: List[str]
    suggestions: List[str]
    mentor_feedback: str
    improvement_summary: Optional[str] = None
    previous_issues_status: List[dict] = []
    model_used: str = "gemini-2.5-flash"

# Submission Schemas
class SubmissionResponse(BaseModel):
    id: int
    task_id: int
    intern_id: int
    version: int
    submission_type: str
    file_name: Optional[str] = None
    file_size_bytes: int = 0
    repo_link: Optional[str] = None
    submitted_text: Optional[str] = None
    submitted_at: datetime
    status: str
    ai_review: Optional[AIReviewResponse] = None

    class Config:
        from_attributes = True

class ReviewHistoryResponse(BaseModel):
    id: int
    task_id: int
    submission_id: Optional[int] = None
    actor_id: Optional[int] = None
    event_type: str
    title: str
    description: str
    metadata_json: Optional[str] = "{}"
    created_at: datetime

    class Config:
        from_attributes = True

# Task Schemas
class TaskCreate(BaseModel):
    program_id: Optional[int] = None
    title: str
    description: str
    expected_outcome: str
    evaluation_guidelines: str
    deadline: datetime
    week_number: int = 1
    intern_id: Optional[int] = None
    intern_email: Optional[str] = None
    max_revisions: int = 3

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    expected_outcome: Optional[str] = None
    evaluation_guidelines: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    program_id: Optional[int]
    title: str
    description: str
    expected_outcome: Optional[str]
    evaluation_guidelines: Optional[str]
    ai_task_understanding: Optional[str]
    week_number: int
    deadline: datetime
    manager_id: int
    intern_id: int
    status: str
    max_revisions: int
    created_at: datetime
    updated_at: datetime
    intern: Optional[UserResponse] = None
    manager: Optional[UserResponse] = None
    submissions_count: int = 0
    latest_score: Optional[float] = None
    latest_version: int = 0

    class Config:
        from_attributes = True

class TaskDetailResponse(TaskResponse):
    submissions: List[SubmissionResponse] = []
    history_events: List[ReviewHistoryResponse] = []

class ManagerDashboardMetrics(BaseModel):
    total_interns: int
    active_tasks: int
    pending_reviews: int
    tasks_requiring_revision: int
    completed_tasks: int
    average_review_score: float

class InternDashboardMetrics(BaseModel):
    total_assigned: int
    pending: int
    in_progress: int
    needs_revision: int
    approved: int
    overdue: int
    average_score: float

class ManagerDecisionRequest(BaseModel):
    decision: str # "APPROVE", "REQUEST_REVISION", "OVERRIDE_SCORE"
    override_score: Optional[float] = None
    manager_comment: str

class NotificationResponse(BaseModel):
    id: int
    task_id: Optional[int]
    recipient_id: int
    type: str
    channel: str # IN_APP, EMAIL, SMS
    title: str
    message: str
    status: str
    sent_at: datetime

    class Config:
        from_attributes = True
