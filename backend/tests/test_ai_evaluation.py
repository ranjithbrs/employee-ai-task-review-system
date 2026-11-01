import unittest
import sys
from pathlib import Path
import asyncio

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from tests.test_base import BaseTestCase
from app.config import SAMPLE_DIR
from app.services.doc_service import doc_service
from app.services.ai_service import ai_review_service

class TestAITaskEvaluationAndConsistency(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.v1_pdf_path = SAMPLE_DIR / "employee_api_v1_incomplete.pdf"
        self.v2_pdf_path = SAMPLE_DIR / "employee_api_v2_improved.pdf"
        self.v1_zip_path = SAMPLE_DIR / "employee_api_v1_code.zip"
        self.v2_zip_path = SAMPLE_DIR / "employee_api_v2_code.zip"

    def test_document_extraction_from_real_samples(self):
        """Verifies text extraction from real PDF and ZIP files."""
        # 1. Test PDF extraction
        self.assertTrue(self.v1_pdf_path.exists(), f"Sample file not found: {self.v1_pdf_path}")
        text_v1, meta_v1 = doc_service.extract_text_from_file(self.v1_pdf_path)
        self.assertIn("Employee REST API", text_v1)
        self.assertIn("validation pending", text_v1.lower())
        self.assertEqual(meta_v1["format"], ".pdf")

        # 2. Test ZIP extraction
        self.assertTrue(self.v1_zip_path.exists(), f"Sample file not found: {self.v1_zip_path}")
        text_zip, meta_zip = doc_service.extract_text_from_file(self.v1_zip_path)
        self.assertIn("class Employee", text_zip)
        self.assertEqual(meta_zip["format"], ".zip")
        self.assertGreater(meta_zip["files_in_archive"], 0)

    def test_ai_evaluation_real_v1_incomplete_pdf(self):
        """
        Tests evaluation of real v1 incomplete PDF:
        - Must score ~72%
        - Must recommend NEEDS_REVISION
        - Must detect missing input validation & exception handling
        """
        text_v1, _ = doc_service.extract_text_from_file(self.v1_pdf_path)

        result = asyncio.run(
            ai_review_service.review_submission(
                task_title="Build Employee REST API",
                task_description="Create CRUD REST API with validation and database integration.",
                expected_outcome="Production ready Spring Boot REST service.",
                evaluation_guidelines="- REST endpoints with CRUD\n- Input validation\n- Exception handling",
                submission_content=text_v1,
                submission_type="FILE",
                file_name="employee_api_v1_incomplete.pdf",
                version=1
            )
        )

        self.assertEqual(result.score, 72.0)
        self.assertEqual(result.recommendation, "NEEDS_REVISION")
        self.assertFalse(result.human_review_required)
        self.assertGreater(len(result.issues), 0)
        self.assertGreater(len(result.strengths), 0)
        self.assertGreater(len(result.suggestions), 0)
        self.assertIn("validation", result.mentor_feedback.lower())

    def test_ai_evaluation_real_v2_improved_pdf(self):
        """
        Tests evaluation of real v2 improved PDF:
        - Must score ~88% (+16 pts)
        - Must recommend APPROVED
        - Must mark previous issues as RESOLVED
        - Must populate continuous improvement narrative
        """
        text_v2, _ = doc_service.extract_text_from_file(self.v2_pdf_path)

        prev_review = {
            "score": 72.0,
            "issues": ["Missing input validation", "Inconsistent exception handling"],
            "areas_for_improvement": ["Add Jakarta validation", "Add global exception handler"]
        }

        result = asyncio.run(
            ai_review_service.review_submission(
                task_title="Build Employee REST API",
                task_description="Create CRUD REST API with validation and database integration.",
                expected_outcome="Production ready Spring Boot REST service.",
                evaluation_guidelines="- REST endpoints with CRUD\n- Input validation\n- Exception handling",
                submission_content=text_v2,
                submission_type="FILE",
                file_name="employee_api_v2_improved.pdf",
                version=2,
                previous_review_data=prev_review
            )
        )

        self.assertEqual(result.score, 88.0)
        self.assertEqual(result.recommendation, "APPROVED")
        self.assertEqual(len(result.issues), 0) # Zero blocking issues!
        self.assertIsNotNone(result.improvement_summary)
        self.assertIn("resolved", result.improvement_summary.lower())
        self.assertGreater(len(result.previous_issues_status), 0)

        for item in result.previous_issues_status:
            self.assertEqual(item["status"], "RESOLVED")

    def test_ai_evaluation_real_code_zip_archives(self):
        """Verifies evaluation against real multi-file code ZIP archives."""
        # 1. v1 ZIP (incomplete)
        text_zip1, _ = doc_service.extract_text_from_file(self.v1_zip_path)
        res_zip1 = asyncio.run(
            ai_review_service.review_submission(
                task_title="Build Employee REST API",
                task_description="CRUD with validation",
                expected_outcome="REST API",
                evaluation_guidelines="CRUD, validation, error handling",
                submission_content=text_zip1,
                submission_type="ZIP",
                file_name="employee_api_v1_code.zip",
                version=1
            )
        )
        self.assertEqual(res_zip1.recommendation, "NEEDS_REVISION")
        self.assertEqual(res_zip1.score, 72.0)

        # 2. v2 ZIP (improved)
        text_zip2, _ = doc_service.extract_text_from_file(self.v2_zip_path)
        res_zip2 = asyncio.run(
            ai_review_service.review_submission(
                task_title="Build Employee REST API",
                task_description="CRUD with validation",
                expected_outcome="REST API",
                evaluation_guidelines="CRUD, validation, error handling",
                submission_content=text_zip2,
                submission_type="ZIP",
                file_name="employee_api_v2_code.zip",
                version=2,
                previous_review_data={"score": 72.0, "issues": ["Validation missing"]}
            )
        )
        self.assertEqual(res_zip2.recommendation, "APPROVED")
        self.assertEqual(res_zip2.score, 88.0)

    def test_feedback_consistency_and_determinism(self):
        """
        VALIDATION CHECK: Ensures deterministic results across multiple evaluations of identical submissions.
        """
        text_v1, _ = doc_service.extract_text_from_file(self.v1_pdf_path)

        runs = []
        for _ in range(3):
            res = asyncio.run(
                ai_review_service.review_submission(
                    task_title="Build Employee REST API",
                    task_description="CRUD with validation",
                    expected_outcome="REST API",
                    evaluation_guidelines="CRUD, validation, error handling",
                    submission_content=text_v1,
                    submission_type="FILE",
                    file_name="employee_api_v1_incomplete.pdf",
                    version=1
                )
            )
            runs.append(res)

        # All 3 runs must produce identical scores, recommendations, and issues
        self.assertEqual(runs[0].score, runs[1].score)
        self.assertEqual(runs[1].score, runs[2].score)
        self.assertEqual(runs[0].recommendation, runs[1].recommendation)
        self.assertEqual(runs[0].issues, runs[1].issues)
        self.assertEqual(runs[0].confidence, runs[1].confidence)

    def test_trivial_or_empty_submission_handling(self):
        """Verifies low score and revision request for empty or negligible deliverables."""
        res = asyncio.run(
            ai_review_service.review_submission(
                task_title="Build Employee REST API",
                task_description="CRUD with validation",
                expected_outcome="REST API",
                evaluation_guidelines="CRUD, validation, error handling",
                submission_content="Just starting on this.",
                submission_type="TEXT",
                file_name="notes.txt",
                version=1
            )
        )

        self.assertEqual(res.score, 20.0)
        self.assertEqual(res.recommendation, "NEEDS_REVISION")
        self.assertIn("empty or unreadable", res.issues[0].lower())

        self.assertEqual(res.score, 20.0)
        self.assertEqual(res.recommendation, "NEEDS_REVISION")
        self.assertIn("empty or unreadable", res.issues[0].lower())

    def test_confidence_threshold_and_human_review_flag(self):
        """Verifies that confidence below threshold triggers HUMAN_REVIEW_REQUIRED."""
        from app.schemas import AIReviewStructuredResult
        low_conf_result = AIReviewStructuredResult(
            score=70.0,
            confidence=60.0, # Below 75.0 threshold
            recommendation="NEEDS_REVISION",
            human_review_required=False,
            overall_assessment="Ambiguous submission.",
            strengths=[],
            areas_for_improvement=[],
            issues=["Ambiguous structure"],
            suggestions=[],
            mentor_feedback="Please verify.",
            model_used="test"
        )
        processed = ai_review_service._post_process_review(low_conf_result)
        self.assertTrue(processed.human_review_required)
        self.assertEqual(processed.recommendation, "HUMAN_REVIEW_REQUIRED")

if __name__ == "__main__":
    unittest.main()
