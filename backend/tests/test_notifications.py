import unittest
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from tests.test_base import BaseTestCase
from app.services.notification_service import notification_service

class TestNotificationSystem(BaseTestCase):
    def test_notification_creation_and_channel_filtering(self):
        """Verifies multi-channel notification persistence and channel filtering."""
        intern_headers = self.get_auth_headers("INTERN")

        # Create notifications across IN_APP, EMAIL, SMS
        notification_service.send_notification(
            db=self.db,
            recipient_id=self.intern.id,
            type="NEW_TASK",
            title="Milestone Assigned",
            message="Please begin working on Week 2 deliverable.",
            task_id=self.task.id,
            channels=["IN_APP", "EMAIL", "SMS"]
        )

        # 1. Fetch all notifications
        resp_all = self.client.get("/api/notifications", headers=intern_headers)
        self.assertEqual(resp_all.status_code, 200)
        notifs = resp_all.json()
        self.assertEqual(len(notifs), 3)

        # 2. Filter by EMAIL channel
        resp_email = self.client.get("/api/notifications?channel=EMAIL", headers=intern_headers)
        self.assertEqual(resp_email.status_code, 200)
        email_notifs = resp_email.json()
        self.assertEqual(len(email_notifs), 1)
        self.assertEqual(email_notifs[0]["channel"], "EMAIL")

        # 3. Filter by SMS channel
        resp_sms = self.client.get("/api/notifications?channel=SMS", headers=intern_headers)
        self.assertEqual(resp_sms.status_code, 200)
        sms_notifs = resp_sms.json()
        self.assertEqual(len(sms_notifs), 1)
        self.assertEqual(sms_notifs[0]["channel"], "SMS")

    def test_mark_notification_as_read(self):
        """Verifies marking individual and bulk notifications as READ."""
        intern_headers = self.get_auth_headers("INTERN")

        # Create a test notification
        created = notification_service.send_notification(
            db=self.db,
            recipient_id=self.intern.id,
            type="REVISION_REQUESTED",
            title="Revision Needed",
            message="Check feedback.",
            task_id=self.task.id,
            channels=["IN_APP"]
        )
        notif_id = created[0].id

        # Mark single notification as READ
        resp_read = self.client.put(f"/api/notifications/{notif_id}/read", headers=intern_headers)
        self.assertEqual(resp_read.status_code, 200)
        self.assertEqual(resp_read.json()["status"], "READ")

        # Mark all read
        resp_all = self.client.put("/api/notifications/read-all", headers=intern_headers)
        self.assertEqual(resp_all.status_code, 200)
        self.assertIn("marked as read", resp_all.json()["message"].lower())

    def test_repeating_reminder_engine(self):
        """Verifies automated recurring reminder scan for pending/revision tasks."""
        mgr_headers = self.get_auth_headers("MANAGER")
        intern_headers = self.get_auth_headers("INTERN")

        # self.task is currently in PENDING_SUBMISSION
        resp = self.client.post("/api/tasks/reminders/trigger", headers=mgr_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertGreaterEqual(data["reminders_dispatched_count"], 1)

        # Verify intern received the automated reminders across channels
        resp_notifs = self.client.get("/api/notifications", headers=intern_headers)
        self.assertEqual(resp_notifs.status_code, 200)
        notif_list = resp_notifs.json()
        reminder_notifs = [n for n in notif_list if "reminder" in n["title"].lower()]
        self.assertGreaterEqual(len(reminder_notifs), 3) # IN_APP, EMAIL, SMS

if __name__ == "__main__":
    unittest.main()
