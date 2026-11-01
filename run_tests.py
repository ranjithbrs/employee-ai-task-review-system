"""
Automated Test Runner for Employee AI Task Review System (MentorAI)
Discovers and executes all backend unit, integration, and AI review test suites.
"""
import sys
import os
import time
import unittest
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

def run_all_tests():
    print("=" * 80)
    print(" [TEST RUNNER] MENTORAI AUTOMATED TEST SUITE")
    print("=" * 80)
    print(f"Working Directory: {BASE_DIR}")
    print(f"Python Executable: {sys.executable}")
    print(f"Testing Directory: {BACKEND_DIR / 'tests'}\n")

    loader = unittest.TestLoader()
    suite = loader.discover(
        start_dir=str(BACKEND_DIR / "tests"),
        pattern="test_*.py"
    )

    runner = unittest.TextTestRunner(
        verbosity=2,
        descriptions=True,
        failfast=False
    )

    start_time = time.time()
    result = runner.run(suite)
    elapsed = time.time() - start_time

    total_tests = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)
    passed = total_tests - (failures + errors)

    print("\n" + "=" * 80)
    print(" [SUMMARY] TEST EXECUTION RESULTS")
    print("=" * 80)
    print(f"Total Tests Run : {total_tests}")
    print(f"Passed          : {passed} [PASS]")
    print(f"Failures        : {failures} [FAIL]")
    print(f"Errors          : {errors} [ERROR]")
    print(f"Elapsed Time    : {elapsed:.2f} seconds")
    print("=" * 80)

    if failures == 0 and errors == 0:
        print("ALL TEST SUITES PASSED SUCCESSFULLY! (100% HEALTHY)\n")
        return 0
    else:
        print("SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.\n")
        return 1

if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
