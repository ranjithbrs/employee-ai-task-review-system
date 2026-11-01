import unittest
import sys
from pathlib import Path
from datetime import timedelta

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from tests.test_base import BaseTestCase
from app.auth import hash_password, verify_password, create_access_token

class TestAuthAndRBAC(BaseTestCase):
    def test_password_hashing_and_verification(self):
        """Validates PBKDF2 SHA-256 password hashing and secure verification."""
        raw_password = "SecurePassword2026!"
        hashed = hash_password(raw_password)
        
        self.assertNotEqual(raw_password, hashed)
        self.assertTrue("$" in hashed)
        self.assertTrue(verify_password(raw_password, hashed))
        self.assertFalse(verify_password("WrongPassword!", hashed))

    def test_access_token_generation_and_expiry(self):
        """Verifies JWT access token payload and expiration handling."""
        payload = {"sub": "123", "role": "MANAGER"}
        token = create_access_token(payload, expires_delta=timedelta(minutes=30))
        self.assertIsInstance(token, str)
        self.assertTrue(len(token) > 20)

        # Test request with expired token
        expired_token = create_access_token(payload, expires_delta=timedelta(seconds=-10))
        resp = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(resp.status_code, 401)
        self.assertIn("expired", resp.json().get("detail", "").lower())

    def test_login_success_intern(self):
        """Tests successful login for intern and token issuance."""
        resp = self.client.post("/api/auth/login", json={
            "email": "intern@demo.com",
            "password": "password123"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "intern@demo.com")
        self.assertEqual(data["user"]["role"], "INTERN")

    def test_login_success_manager(self):
        """Tests successful login for manager and token issuance."""
        resp = self.client.post("/api/auth/login", json={
            "email": "manager@demo.com",
            "password": "password123"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "manager@demo.com")
        self.assertEqual(data["user"]["role"], "MANAGER")

    def test_login_invalid_password(self):
        """Verifies 401 response when password is incorrect."""
        resp = self.client.post("/api/auth/login", json={
            "email": "intern@demo.com",
            "password": "wrongpassword"
        })
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Invalid email or password", resp.json()["detail"])

    def test_login_nonexistent_email(self):
        """Verifies 401 response when user email does not exist."""
        resp = self.client.post("/api/auth/login", json={
            "email": "unknown@company.com",
            "password": "password123"
        })
        self.assertEqual(resp.status_code, 401)

    def test_unauthenticated_protected_endpoint(self):
        """Verifies 401 response on protected endpoints when token is missing."""
        resp = self.client.get("/api/auth/me")
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Missing authentication credentials", resp.json()["detail"])

    def test_rbac_intern_blocked_from_manager_endpoints(self):
        """
        CRITICAL RBAC CHECK: Intern role must receive 403 Forbidden
        when attempting to call manager-restricted operations.
        """
        intern_headers = self.get_auth_headers("INTERN")

        # 1. Attempt to create new task
        task_payload = {
            "title": "Unauthorized Task Creation",
            "description": "Should fail with 403",
            "expected_outcome": "None",
            "evaluation_guidelines": "None",
            "deadline": "2026-11-20T12:00:00Z",
            "week_number": 3
        }
        resp1 = self.client.post("/api/tasks", json=task_payload, headers=intern_headers)
        self.assertEqual(resp1.status_code, 403)
        self.assertIn("Access denied", resp1.json()["detail"])

        # 2. Attempt to invoke manager decision override
        decision_payload = {
            "decision": "APPROVE",
            "manager_comment": "Intern trying to approve own work"
        }
        resp2 = self.client.post(f"/api/tasks/{self.task.id}/manager-decision", json=decision_payload, headers=intern_headers)
        self.assertEqual(resp2.status_code, 403)
        self.assertIn("Access denied", resp2.json()["detail"])

        # 3. Attempt to view manager metrics
        resp3 = self.client.get("/api/metrics/manager", headers=intern_headers)
        self.assertEqual(resp3.status_code, 403)

    def test_rbac_manager_access_granted(self):
        """Verifies manager can successfully access manager-restricted endpoints."""
        manager_headers = self.get_auth_headers("MANAGER")
        resp = self.client.get("/api/metrics/manager", headers=manager_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("active_tasks", data)
        self.assertIn("total_interns", data)

    def test_demo_switch_endpoint(self):
        """Verifies role switching utility endpoint."""
        resp_intern = self.client.post("/api/auth/demo-switch/INTERN")
        self.assertEqual(resp_intern.status_code, 200)
        self.assertEqual(resp_intern.json()["user"]["role"], "INTERN")

        resp_mgr = self.client.post("/api/auth/demo-switch/MANAGER")
        self.assertEqual(resp_mgr.status_code, 200)
        self.assertEqual(resp_mgr.json()["user"]["role"], "MANAGER")

        # Invalid role should return 400
        resp_bad = self.client.post("/api/auth/demo-switch/ADMIN")
        self.assertEqual(resp_bad.status_code, 400)

if __name__ == "__main__":
    unittest.main()
