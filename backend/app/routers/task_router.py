from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Task, Program, Submission, AIReview, ReviewHistory
from app.schemas import (
    TaskCreate, TaskUpdate, TaskResponse, TaskDetailResponse,
    ManagerDashboardMetrics, InternDashboardMetrics, InternshipProgressResponse,
    ManagerDecisionRequest
)
from app.auth import get_current_user, require_role
from app.services.ai_service import ai_review_service
from app.services.notification_service import notification_service

router = APIRouter(tags=["Tasks"])

@router.get("/tasks", response_model=List[TaskResponse])
def get_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task)
    if current_user.role == "INTERN":
        query = query.filter(Task.intern_id == current_user.id)
    # If manager, can see all tasks or those they manage
    if status_filter:
        query = query.filter(Task.status == status_filter)

    tasks = query.order_by(Task.week_number.asc(), Task.deadline.asc()).all()

    # Enrich with latest submission info
    result = []
    for t in tasks:
        subs = t.submissions
        latest_sub = subs[0] if subs else None
        latest_score = latest_sub.ai_review.overall_score if (latest_sub and latest_sub.ai_review) else None
        resp = TaskResponse(
            id=t.id,
            program_id=t.program_id,
            title=t.title,
            description=t.description,
            expected_outcome=t.expected_outcome,
            evaluation_guidelines=t.evaluation_guidelines,
            ai_task_understanding=t.ai_task_understanding,
            week_number=t.week_number,
            deadline=t.deadline,
            manager_id=t.manager_id,
            intern_id=t.intern_id,
            status=t.status,
            max_revisions=t.max_revisions,
            created_at=t.created_at,
            updated_at=t.updated_at,
            intern=t.intern,
            manager=t.manager,
            submissions_count=len(subs),
            latest_score=latest_score,
            latest_version=latest_sub.version if latest_sub else 0
        )
        result.append(resp)
    return result

@router.post("/tasks", response_model=TaskDetailResponse)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(require_role(["MANAGER"])),
    db: Session = Depends(get_db)
):
    # Determine intern
    intern = None
    if payload.intern_id:
        intern = db.query(User).filter(User.id == payload.intern_id, User.role == "INTERN").first()
    elif payload.intern_email:
        intern = db.query(User).filter(User.email == payload.intern_email.lower().strip(), User.role == "INTERN").first()

    if not intern:
        intern = db.query(User).filter(User.role == "INTERN").first()
        if not intern:
            raise HTTPException(status_code=400, detail="No intern found to assign task to.")

    # Determine default program
    program_id = payload.program_id
    if not program_id:
        default_prog = db.query(Program).first()
        program_id = default_prog.id if default_prog else None

    # Synthesize AI Task Understanding
    ai_understanding = ai_review_service.generate_task_understanding(
        title=payload.title,
        description=payload.description,
        expected_outcome=payload.expected_outcome,
        evaluation_guidelines=payload.evaluation_guidelines
    )

    new_task = Task(
        program_id=program_id,
        title=payload.title,
        description=payload.description,
        expected_outcome=payload.expected_outcome,
        evaluation_guidelines=payload.evaluation_guidelines,
        ai_task_understanding=ai_understanding,
        week_number=payload.week_number,
        deadline=payload.deadline,
        manager_id=current_user.id,
        intern_id=intern.id,
        status="PENDING_SUBMISSION",
        max_revisions=payload.max_revisions
    )
    db.add(new_task)
    db.flush()

    # Log history event
    db.add(ReviewHistory(
        task_id=new_task.id,
        actor_id=current_user.id,
        event_type="CREATED",
        title="Task Created & Assigned",
        description=f"Manager {current_user.name} created task '{new_task.title}' and assigned it to {intern.name}."
    ))

    # Send notification
    notification_service.notify_task_assigned(db, new_task, intern)

    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/tasks/{task_id}", response_model=TaskDetailResponse)
def get_task_detail(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    subs = task.submissions
    latest_sub = subs[0] if subs else None
    latest_score = latest_sub.ai_review.overall_score if (latest_sub and latest_sub.ai_review) else None

    resp = TaskDetailResponse(
        id=task.id,
        program_id=task.program_id,
        title=task.title,
        description=task.description,
        expected_outcome=task.expected_outcome,
        evaluation_guidelines=task.evaluation_guidelines,
        ai_task_understanding=task.ai_task_understanding,
        week_number=task.week_number,
        deadline=task.deadline,
        manager_id=task.manager_id,
        intern_id=task.intern_id,
        status=task.status,
        max_revisions=task.max_revisions,
        created_at=task.created_at,
        updated_at=task.updated_at,
        intern=task.intern,
        manager=task.manager,
        submissions_count=len(subs),
        latest_score=latest_score,
        latest_version=latest_sub.version if latest_sub else 0,
        submissions=subs,
        history_events=task.history_events
    )
    return resp

@router.post("/tasks/{task_id}/manager-decision", response_model=TaskDetailResponse)
def manager_decision(
    task_id: int,
    payload: ManagerDecisionRequest,
    current_user: User = Depends(require_role(["MANAGER"])),
    db: Session = Depends(get_db)
):
    """
    Manager manual decision/override:
    - Approves work
    - Requests revision with human mentor notes
    - Overrides AI score
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    decision = payload.decision.upper()
    intern = task.intern

    if decision == "APPROVE":
        task.status = "APPROVED"
        event_title = "Manager Manual Approval"
        desc = f"Manager {current_user.name} approved the task. Comment: {payload.manager_comment}"
        notification_service.notify_task_approved(db, task, intern, 95.0)

    elif decision == "REQUEST_REVISION":
        task.status = "NEEDS_REVISION"
        event_title = "Manager Requested Revision"
        desc = f"Manager {current_user.name} requested revision. Feedback: {payload.manager_comment}"
        notification_service.notify_revision_requested(db, task, intern, 70.0, payload.manager_comment)

    elif decision == "OVERRIDE_SCORE":
        if payload.override_score is None:
            raise HTTPException(status_code=400, detail="override_score is required for OVERRIDE_SCORE action")
        event_title = f"Manager Overrode Score to {payload.override_score}"
        desc = f"Manager {current_user.name} adjusted score to {payload.override_score}. Reason: {payload.manager_comment}"
        if task.submissions and task.submissions[0].ai_review:
            task.submissions[0].ai_review.overall_score = payload.override_score
            if payload.override_score >= 85:
                task.status = "APPROVED"
                task.submissions[0].status = "APPROVED"

    else:
        raise HTTPException(status_code=400, detail=f"Unknown decision type '{decision}'")

    db.add(ReviewHistory(
        task_id=task.id,
        actor_id=current_user.id,
        event_type="MANUAL_OVERRIDE",
        title=event_title,
        description=desc
    ))

    db.commit()
    db.refresh(task)
    return get_task_detail(task.id, current_user, db)

@router.get("/metrics/manager", response_model=ManagerDashboardMetrics)
def get_manager_metrics(
    current_user: User = Depends(require_role(["MANAGER"])),
    db: Session = Depends(get_db)
):
    total_interns = db.query(User).filter(User.role == "INTERN").count()
    active_tasks = db.query(Task).filter(Task.status.in_(["PENDING_SUBMISSION", "UNDER_REVIEW", "NEEDS_REVISION", "HUMAN_REVIEW_REQUIRED"])).count()
    pending_reviews = db.query(Task).filter(Task.status == "UNDER_REVIEW").count()
    tasks_requiring_revision = db.query(Task).filter(Task.status == "NEEDS_REVISION").count()
    completed_tasks = db.query(Task).filter(Task.status == "APPROVED").count()

    avg_score = db.query(func.avg(AIReview.overall_score)).scalar() or 0.0

    return ManagerDashboardMetrics(
        total_interns=total_interns,
        active_tasks=active_tasks,
        pending_reviews=pending_reviews,
        tasks_requiring_revision=tasks_requiring_revision,
        completed_tasks=completed_tasks,
        average_review_score=round(float(avg_score), 1)
    )

@router.get("/metrics/intern", response_model=InternDashboardMetrics)
def get_intern_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    intern_id = current_user.id
    total_assigned = db.query(Task).filter(Task.intern_id == intern_id).count()
    pending = db.query(Task).filter(Task.intern_id == intern_id, Task.status == "PENDING_SUBMISSION").count()
    in_progress = db.query(Task).filter(Task.intern_id == intern_id, Task.status.in_(["PENDING_SUBMISSION", "UNDER_REVIEW"])).count()
    needs_revision = db.query(Task).filter(Task.intern_id == intern_id, Task.status == "NEEDS_REVISION").count()
    approved = db.query(Task).filter(Task.intern_id == intern_id, Task.status == "APPROVED").count()
    now = datetime.now(timezone.utc)
    overdue = db.query(Task).filter(Task.intern_id == intern_id, Task.deadline < now, Task.status != "APPROVED").count()

    # Calculate average score for intern's reviews
    scores = db.query(AIReview.overall_score).join(Submission).filter(Submission.intern_id == intern_id).all()
    avg_score = sum([s[0] for s in scores]) / len(scores) if scores else 0.0

    return InternDashboardMetrics(
        total_assigned=total_assigned,
        pending=pending,
        in_progress=in_progress,
        needs_revision=needs_revision,
        approved=approved,
        overdue=overdue,
        average_score=round(float(avg_score), 1)
    )

@router.get("/program/progress", response_model=InternshipProgressResponse)
def get_program_progress(db: Session = Depends(get_db)):
    """Provides overall progress of the 4-week internship program."""
    prog = db.query(Program).first()
    if not prog:
        raise HTTPException(status_code=404, detail="No active program found.")

    tasks = db.query(Task).filter(Task.program_id == prog.id).all()
    total = len(tasks)
    completed = len([t for t in tasks if t.status == "APPROVED"])
    pending = total - completed
    progress_pct = round((completed / total) * 100.0, 1) if total > 0 else 0.0

    avg_score = db.query(func.avg(AIReview.overall_score)).scalar() or 84.0

    return InternshipProgressResponse(
        program_title=prog.title,
        start_date=prog.start_date,
        end_date=prog.end_date,
        total_tasks=total,
        completed_tasks=completed,
        pending_tasks=pending,
        progress_percentage=progress_pct,
        average_review_score=round(float(avg_score), 1),
        current_week=2
    )

@router.post("/reminders/trigger")
def trigger_automated_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes an automated recurring reminder scan:
    Sends repeat Email, SMS, and In-App notifications for all tasks awaiting revision or pending submission.
    """
    result = notification_service.check_and_send_repeating_reminders(db)
    return result
