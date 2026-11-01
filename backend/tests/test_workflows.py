import unittest
import sys
from pathlib import Path
import io

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from tests.test_base import BaseTestCase

class TestEmployeeAndMentorWorkflows(BaseTestCase):
    def test_employee_complete_submission_and_revision_workflow(self):
        """
        Tests the complete Employee workflow:
        1. View assigned tasks & program progress
        2. Submit v1 deliverable -> AI review gives NEEDS_REVISION (score 72)
        3. Submit v2 revision -> AI review compares versions, scores 88 (+16 pts), approves work
        4. Verifies continuous improvement tracking & notifications
        """
        intern_headers = self.get_auth_headers("INTERN")

        # 1. View assigned tasks
        resp_tasks = self.client.get("/api/tasks", headers=intern_headers)
        self.assertEqual(resp_tasks.status_code, 200)
        tasks = resp_tasks.json()
        self.assertGreaterEqual(len(tasks), 1)
        target_task = tasks[0]
        task_id = target_task["id"]

        # 2. Inspect task details
        resp_detail = self.client.get(f"/api/tasks/{task_id}", headers=intern_headers)
        self.assertEqual(resp_detail.status_code, 200)
        detail = resp_detail.json()
        self.assertIn("ai_task_understanding", detail)
        self.assertEqual(detail["status"], "PENDING_SUBMISSION")

        # 3. Submit Version 1 (Incomplete: CRUD endpoints present, but no input validation or exception handling)
        v1_text = (
            "Implementation of Employee REST API:\n"
            "@GetMapping('/api/employees'), @PostMapping('/api/employees')\n"
            "JpaRepository<Employee, Long> database persistence layer.\n"
            "Note: DTO mapping is basic. Comprehensive validation pending for next version."
        )
        resp_sub_v1 = self.client.post(
            f"/api/tasks/{task_id}/submit",
            data={
                "submission_type": "TEXT",
                "submitted_text": v1_text
            },
            headers=intern_headers
        )
        self.assertEqual(resp_sub_v1.status_code, 200)
        v1_data = resp_sub_v1.json()
        self.assertEqual(v1_data["version"], 1)
        self.assertEqual(v1_data["status"], "NEEDS_REVISION")
        self.assertIsNotNone(v1_data["ai_review"])
        self.assertEqual(v1_data["ai_review"]["overall_score"], 72.0)
        self.assertGreater(len(v1_data["ai_review"]["issues"]), 0)
        self.assertIn("validation", v1_data["ai_review"]["mentor_feedback"].lower())

        # Verify task status updated
        task_after_v1 = self.client.get(f"/api/tasks/{task_id}", headers=intern_headers).json()
        self.assertEqual(task_after_v1["status"], "NEEDS_REVISION")
        self.assertEqual(task_after_v1["latest_score"], 72.0)

        # 4. Submit Version 2 (Improved: Added Jakarta Validation + Centralized GlobalExceptionHandler)
        v2_text = (
            "Version 2 Revised Implementation of Employee REST API:\n"
            "@GetMapping, @PostMapping, @PutMapping, @DeleteMapping CRUD operations.\n"
            "JpaRepository persistence layer.\n"
            "Jakarta Validation: Added @Valid, @NotNull, and @Email constraints on EmployeeDTO.\n"
            "Centralized Exception Handling: Added @ControllerAdvice and GlobalExceptionHandler for uniform error responses."
        )
        resp_sub_v2 = self.client.post(
            f"/api/tasks/{task_id}/submit",
            data={
                "submission_type": "TEXT",
                "submitted_text": v2_text
            },
            headers=intern_headers
        )
        self.assertEqual(resp_sub_v2.status_code, 200)
        v2_data = resp_sub_v2.json()
        self.assertEqual(v2_data["version"], 2)
        self.assertEqual(v2_data["status"], "APPROVED")
        self.assertIsNotNone(v2_data["ai_review"])
        self.assertEqual(v2_data["ai_review"]["overall_score"], 88.0)

        # 5. Verify Continuous Improvement Tracking
        ai_rev2 = v2_data["ai_review"]
        self.assertIsNotNone(ai_rev2["improvement_summary"])
        self.assertEqual(ai_rev2["previous_score"], 72.0)
        self.assertEqual(ai_rev2["score_change"], 16.0)
        self.assertGreater(len(ai_rev2["previous_issues_status"]), 0)
        for issue_status in ai_rev2["previous_issues_status"]:
            self.assertEqual(issue_status["status"], "RESOLVED")

        # Verify final task state
        final_task = self.client.get(f"/api/tasks/{task_id}", headers=intern_headers).json()
        self.assertEqual(final_task["status"], "APPROVED")
        self.assertEqual(final_task["latest_score"], 88.0)
        self.assertEqual(len(final_task["submissions"]), 2)

    def test_manager_complete_supervision_and_override_workflow(self):
        """
        Tests the complete Manager / Mentor workflow:
        1. View manager dashboard metrics
        2. Create and assign a new milestone task (with automated AI task understanding)
        3. Supervise intern task progress & submissions
        4. Execute manager decision overrides (Approve, Request Revision, Override Score)
        5. Verify audit history tracking (ReviewHistory events)
        6. Trigger automated repeating reminder engine
        """
        mgr_headers = self.get_auth_headers("MANAGER")
        intern_headers = self.get_auth_headers("INTERN")

        # 1. View initial metrics
        resp_metrics = self.client.get("/api/metrics/manager", headers=mgr_headers)
        self.assertEqual(resp_metrics.status_code, 200)
        metrics = resp_metrics.json()
        self.assertIn("active_tasks", metrics)
        self.assertIn("completed_tasks", metrics)

        # 2. Manager creates a new milestone task
        new_task_payload = {
            "title": "Cloud Infrastructure & Docker Deployment",
            "description": "Containerize the Spring Boot application and create production Docker compose manifests.",
            "expected_outcome": "Multi-stage Dockerfile and docker-compose.yml with health checks.",
            "evaluation_guidelines": "- Multi-stage Docker build\n- Non-root container user\n- Health checks\n- Env configuration",
            "deadline": "2026-11-25T18:00:00Z",
            "week_number": 4,
            "intern_id": self.intern.id,
            "max_revisions": 3
        }
        resp_create = self.client.post("/api/tasks", json=new_task_payload, headers=mgr_headers)
        self.assertEqual(resp_create.status_code, 200)
        created_task = resp_create.json()
        created_task_id = created_task["id"]
        self.assertEqual(created_task["title"], new_task_payload["title"])
        self.assertIn("Objective:", created_task["ai_task_understanding"])

        # 3. Intern submits work to the new task
        sub_resp = self.client.post(
            f"/api/tasks/{created_task_id}/submit",
            data={
                "submission_type": "TEXT",
                "submitted_text": "Dockerfile with multi-stage build, non-root user appuser, and docker-compose.yml configuration."
            },
            headers=intern_headers
        )
        self.assertEqual(sub_resp.status_code, 200)

        # 4. Manager requests revision with human mentor notes
        resp_rev = self.client.post(
            f"/api/tasks/{created_task_id}/manager-decision",
            json={
                "decision": "REQUEST_REVISION",
                "manager_comment": "Please add explicit HEALTHCHECK instruction in the Dockerfile."
            },
            headers=mgr_headers
        )
        self.assertEqual(resp_rev.status_code, 200)
        self.assertEqual(resp_rev.json()["status"], "NEEDS_REVISION")

        # 5. Manager overrides score
        resp_override = self.client.post(
            f"/api/tasks/{created_task_id}/manager-decision",
            json={
                "decision": "OVERRIDE_SCORE",
                "override_score": 92.0,
                "manager_comment": "Verified health check manually. Excellent docker structure."
            },
            headers=mgr_headers
        )
        self.assertEqual(resp_override.status_code, 200)
        self.assertEqual(resp_override.json()["status"], "APPROVED")

        # 6. Verify audit history trail
        task_detail = self.client.get(f"/api/tasks/{created_task_id}", headers=mgr_headers).json()
        events = task_detail["history_events"]
        self.assertGreaterEqual(len(events), 2)
        event_types = [e["event_type"] for e in events]
        self.assertIn("CREATED", event_types)
        self.assertIn("MANUAL_OVERRIDE", event_types)

        # 7. Trigger automated repeating reminder scan
        resp_reminder = self.client.post("/api/tasks/reminders/trigger", headers=mgr_headers)
        self.assertEqual(resp_reminder.status_code, 200)
        self.assertEqual(resp_reminder.json()["status"], "success")

if __name__ == "__main__":
    unittest.main()
