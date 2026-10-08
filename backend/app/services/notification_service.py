import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from typing import Optional
import httpx
from sqlalchemy.orm import Session
from app.models import Notification, User, Task
from app.config import settings

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def _send_real_email(to_email: str, subject: str, body: str):
        """Dispatches actual outbound SMTP email if credentials are provided in settings."""
        if not (settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD):
            return
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM_EMAIL
            msg["To"] = to_email

            part1 = MIMEText(body, "plain")
            html = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <h2 style="color: #4f46e5; margin: 0; font-size: 20px;">⚡ MentorAI Review Alert</h2>
                </div>
                <h3 style="color: #0f172a; margin-top: 12px; margin-bottom: 12px;">{subject}</h3>
                <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 6px; margin: 16px 0;">
                    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0;">{body}</p>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automated continuous review notification from the Employee AI Task Review System.</p>
            </div>
            """
            part2 = MIMEText(html, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=8) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            logger.info(f"Outbound SMTP email sent successfully to {to_email}")
        except Exception as e:
            logger.warning(f"Outbound SMTP email dispatch skipped/failed: {e}")

    @staticmethod
    def _send_real_sms(to_phone: str, body: str):
        """Dispatches actual outbound SMS via Twilio if credentials are provided in settings."""
        if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_PHONE):
            return
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            data = {
                "From": settings.TWILIO_FROM_PHONE,
                "To": to_phone,
                "Body": f"[MentorAI] {body}"
            }
            resp = httpx.post(
                url,
                data=data,
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                timeout=8
            )
            if resp.status_code in (200, 201):
                logger.info(f"Outbound Twilio SMS dispatched successfully to {to_phone}")
            else:
                logger.warning(f"Twilio SMS returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.warning(f"Outbound Twilio SMS dispatch skipped/failed: {e}")

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
        Persists in database for UI notification center, and triggers real external
        SMTP / Twilio dispatch if keys are configured.
        """
        recipient = db.query(User).filter(User.id == recipient_id).first()
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

            # Trigger real external outbound if available
            if recipient:
                if ch == "EMAIL" and recipient.email:
                    NotificationService._send_real_email(recipient.email, title, message)
                elif ch == "SMS" and recipient.phone:
                    NotificationService._send_real_sms(recipient.phone, message)

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

    @staticmethod
    def check_and_send_repeating_reminders(db: Session):
        """
        Automated Repeating Reminder Engine:
        Iterates through all incomplete tasks (NEEDS_REVISION or PENDING_SUBMISSION)
        and sends repeating Email, SMS, and In-App notifications until the task is APPROVED.
        """
        pending_tasks = db.query(Task).filter(
            Task.status.in_(["NEEDS_REVISION", "PENDING_SUBMISSION", "UNDER_REVIEW"])
        ).all()

        reminders_dispatched = []

        for task in pending_tasks:
            intern = db.query(User).filter(User.id == task.intern_id).first()
            if not intern:
                continue

            # Count previous reminders sent for this specific task
            prior_count = db.query(Notification).filter(
                Notification.recipient_id == intern.id,
                Notification.task_id == task.id,
                Notification.type.in_(["REVISION_REMINDER", "PENDING_REMINDER"])
            ).count()

            reminder_number = (prior_count // 3) + 1  # 3 channels per dispatch

            if task.status == "NEEDS_REVISION":
                title = f"🔁 Automated Reminder #{reminder_number}: Revision Pending for '{task.title}'"
                msg = (
                    f"Hello {intern.name}, this is an automated follow-up reminder. "
                    f"Your deliverable for '{task.title}' is currently awaiting revision based on AI mentor feedback. "
                    f"Please review the feedback, update your code or document, and submit your updated version to complete the task."
                )
                NotificationService.send_notification(
                    db=db,
                    recipient_id=intern.id,
                    type="REVISION_REMINDER",
                    title=title,
                    message=msg,
                    task_id=task.id,
                    channels=["IN_APP", "EMAIL", "SMS"]
                )
                reminders_dispatched.append({
                    "task_id": task.id,
                    "task_title": task.title,
                    "intern_name": intern.name,
                    "status": task.status,
                    "reminder_number": reminder_number,
                    "channels": ["IN_APP", "EMAIL", "SMS"]
                })

            elif task.status == "PENDING_SUBMISSION":
                title = f"⏰ Automated Reminder #{reminder_number}: '{task.title}' Awaiting Submission"
                msg = (
                    f"Hello {intern.name}, milestone '{task.title}' (Week {task.week_number}) has not been submitted yet. "
                    f"Deadline: {task.deadline.strftime('%b %d, %Y')}. "
                    f"Please upload your work for instant automated AI review."
                )
                NotificationService.send_notification(
                    db=db,
                    recipient_id=intern.id,
                    type="PENDING_REMINDER",
                    title=title,
                    message=msg,
                    task_id=task.id,
                    channels=["IN_APP", "EMAIL", "SMS"]
                )
                reminders_dispatched.append({
                    "task_id": task.id,
                    "task_title": task.title,
                    "intern_name": intern.name,
                    "status": task.status,
                    "reminder_number": reminder_number,
                    "channels": ["IN_APP", "EMAIL", "SMS"]
                })

        return {
            "status": "success",
            "checked_tasks_count": len(pending_tasks),
            "reminders_dispatched_count": len(reminders_dispatched),
            "dispatched_details": reminders_dispatched
        }

notification_service = NotificationService()
