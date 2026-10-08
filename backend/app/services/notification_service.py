import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models import Notification, User, Task

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_notification(
        db: Session,
        recipient_id: int,
        type: str,
        title: str,
        message: str,
        task_id: Optional[int] = None,
        channels: list[str] = ["IN_APP", "EMAIL", "SMS"]
    ):
        """
        Creates notifications across channels.
        In hackathon demo mode, notifications are persisted in the database
        and tagged so they can be viewed in the UI Notification Center.
        """
        created = []
        for ch in channels:
            notif = Notification(
                recipient_id=recipient_id,
                task_id=task_id,
                type=type,
                channel=ch,
                title=title if ch == "IN_APP" else f"[{ch} NOTIFICATION] {title}",
                message=message,
                status="UNREAD",
                sent_at=datetime.now(timezone.utc)
            )
            db.add(notif)
            created.append(notif)

        db.commit()
        return created

    @staticmethod
    def notify_task_assigned(db: Session, task: Task, intern: User):
        """Notifies intern when a new task is assigned."""
        title = f"New Task Assigned: {task.title}"
        msg = (
            f"Hello {intern.name}, you have been assigned '{task.title}'. "
            f"Expected deadline: {task.deadline.strftime('%b %d, %Y')}. "
            f"Please review the task guidelines and submit your deliverables when ready."
        )
        return NotificationService.send_notification(
            db=db,
            recipient_id=intern.id,
            type="NEW_TASK",
            title=title,
            message=msg,
            task_id=task.id,
            channels=["IN_APP", "EMAIL"]
        )

    @staticmethod
    def notify_revision_requested(db: Session, task: Task, intern: User, score: float, feedback_summary: str):
        """Notifies intern when AI requests revision."""
        title = f"Revision Requested: {task.title} (Score: {score:.0f}/100)"
        msg = (
            f"Hello {intern.name}, the AI mentor reviewed your submission for '{task.title}' and requested a revision. "
            f"Mentor Feedback: \"{feedback_summary}\". "
            f"Please address the suggestions and resubmit your improved work."
        )
        return NotificationService.send_notification(
            db=db,
            recipient_id=intern.id,
            type="REVISION_REQUESTED",
            title=title,
            message=msg,
            task_id=task.id,
            channels=["IN_APP", "EMAIL", "SMS"]
        )

    @staticmethod
    def notify_task_approved(db: Session, task: Task, intern: User, score: float):
        """Notifies intern and manager when task is approved."""
        # Notify intern
        intern_title = f"Task Approved! 🎉 {task.title} (Score: {score:.0f}/100)"
        intern_msg = (
            f"Congratulations {intern.name}! Your submission for '{task.title}' has been approved with a score of {score:.0f}/100. "
            f"Your internship progress has been updated."
        )
        NotificationService.send_notification(
            db=db,
            recipient_id=intern.id,
            type="TASK_APPROVED",
            title=intern_title,
            message=intern_msg,
            task_id=task.id,
            channels=["IN_APP", "EMAIL"]
        )

        # Notify manager
        mgr_title = f"Task Completed & Approved: {task.title}"
        mgr_msg = f"Intern {intern.name} successfully completed '{task.title}' with a verified score of {score:.0f}/100."
        NotificationService.send_notification(
            db=db,
            recipient_id=task.manager_id,
            type="TASK_APPROVED",
            title=mgr_title,
            message=mgr_msg,
            task_id=task.id,
            channels=["IN_APP", "EMAIL"]
        )

    @staticmethod
    def notify_human_review_required(db: Session, task: Task, manager: User, intern: User, reason: str):
        """Notifies manager when a submission requires human intervention."""
        title = f"⚠️ Human Review Required: {task.title}"
        msg = (
            f"Manager attention required: Intern {intern.name}'s submission on '{task.title}' requires human judgment. "
            f"Reason: {reason}. Please review the submission and make the final decision."
        )
        return NotificationService.send_notification(
            db=db,
            recipient_id=manager.id,
            type="HUMAN_REVIEW_REQUIRED",
            title=title,
            message=msg,
            task_id=task.id,
            channels=["IN_APP", "EMAIL"]
        )

notification_service = NotificationService()
