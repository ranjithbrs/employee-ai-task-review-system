import unittest
import sys
from pathlib import Path
import io

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from tests.test_base import BaseTestCase

class TestAPIErrorHandling(BaseTestCase):
    def test_unsupported_file_extension_rejection(self):
        """Verifies 400 Bad Request when uploading unsupported file formats (.exe, .sh, etc.)."""
        intern_headers = self.get_auth_headers("INTERN")
        bad_file = ("script.exe", io.BytesIO(b"binary executable content"), "application/octet-stream")

        resp = self.client.post(
            f"/api/tasks/{self.task.id}/submit",
            files={"file": bad_file},
            data={"submission_type": "FILE"},
            headers=intern_headers
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Unsupported file format", resp.json()["detail"])
        self.assertIn(".exe", resp.json()["detail"])

    def test_empty_submission_handling(self):
        """Verifies 200 with low score or 400 when submitting no file and no notes."""
        intern_headers = self.get_auth_headers("INTERN")
        resp = self.client.post(
            f"/api/tasks/{self.task.id}/submit",
            data={"submission_type": "TEXT"},
            headers=intern_headers
        )
        # Empty text submission gets analyzed and flagged as empty (score 20, NEEDS_REVISION)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "NEEDS_REVISION")
        self.assertEqual(data["ai_review"]["overall_score"], 20.0)

    def test_nonexistent_task_queries(self):
        """Verifies 404 Not Found when referencing non-existent task IDs."""
        intern_headers = self.get_auth_headers("INTERN")
        mgr_headers = self.get_auth_headers("MANAGER")

        # 1. Detail query
        resp1 = self.client.get("/api/tasks/999999", headers=intern_headers)
        self.assertEqual(resp1.status_code, 404)
        self.assertIn("not found", resp1.json()["detail"].lower())

        # 2. Submission to non-existent task
        resp2 = self.client.post(
            "/api/tasks/999999/submit",
            data={"submission_type": "TEXT", "submitted_text": "Code here"},
            headers=intern_headers
        )
        self.assertEqual(resp2.status_code, 404)

        # 3. Manager decision on non-existent task
        resp3 = self.client.post(
            "/api/tasks/999999/manager-decision",
            json={"decision": "APPROVE", "manager_comment": "Approved"},
            headers=mgr_headers
        )
        self.assertEqual(resp3.status_code, 404)

    def test_manager_decision_invalid_action(self):
        """Verifies 400 Bad Request when providing unrecognized decision types."""
        mgr_headers = self.get_auth_headers("MANAGER")
        resp = self.client.post(
            f"/api/tasks/{self.task.id}/manager-decision",
            json={"decision": "EXPEL_INTERN", "manager_comment": "Invalid decision type"},
            headers=mgr_headers
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Unknown decision type", resp.json()["detail"])

    def test_manager_override_score_without_value(self):
        """Verifies 400 Bad Request when OVERRIDE_SCORE is requested without override_score."""
        mgr_headers = self.get_auth_headers("MANAGER")
        resp = self.client.post(
            f"/api/tasks/{self.task.id}/manager-decision",
            json={"decision": "OVERRIDE_SCORE", "manager_comment": "Missing score value"},
            headers=mgr_headers
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("override_score is required", resp.json()["detail"])

    def test_sample_file_download_404(self):
        """Verifies 404 Not Found when requesting non-existent sample files."""
        resp = self.client.get("/api/sample-files/does_not_exist_file.pdf")
        self.assertEqual(resp.status_code, 404)

    def test_task_creation_schema_validation(self):
        """Verifies 422 Unprocessable Entity when required fields are missing during task creation."""
        mgr_headers = self.get_auth_headers("MANAGER")
        resp = self.client.post("/api/tasks", json={}, headers=mgr_headers)
        self.assertEqual(resp.status_code, 422)

    def test_malformed_auth_header(self):
        """Verifies 401 Unauthorized on corrupted bearer token."""
        resp = self.client.get("/api/auth/me", headers={"Authorization": "Bearer this_is_not_a_valid_jwt_token"})
        self.assertEqual(resp.status_code, 401)

if __name__ == "__main__":
    unittest.main()
