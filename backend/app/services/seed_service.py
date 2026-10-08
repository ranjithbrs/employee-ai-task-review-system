import os
import io
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.config import settings, SAMPLE_DIR
from app.auth import hash_password
from app.models import (
    User, Program, Task, Submission, AIReview, ReviewHistory, Notification
)
from app.services.ai_service import ai_review_service

def generate_sample_report_pdf(filename: str, title: str, has_validation: bool, has_exceptions: bool, has_docs: bool):
    """Generates a realistic technical submission report in PDF format."""
    file_path = SAMPLE_DIR / filename
    c = canvas.Canvas(str(file_path), pagesize=letter)
    width, height = letter

    # Title & Header
    c.setFont("Helvetica-Bold", 18)
    c.drawString(54, height - 54, title)
    c.setFont("Helvetica", 10)
    c.drawString(54, height - 72, f"Author: Alex Chen (Intern) | Date: October 2026 | Submission Version: {'v2 (Improved)' if has_validation else 'v1 (Initial)'}")
    c.setLineWidth(1)
    c.line(54, height - 80, width - 54, height - 80)

    y = height - 110
    c.setFont("Helvetica-Bold", 13)
    c.drawString(54, y, "1. Executive Summary & Architecture Overview")
    y -= 18
    c.setFont("Helvetica", 10)
    c.drawString(54, y, "This submission delivers an enterprise Employee REST API built with Spring Boot and SQLite.")
    y -= 14
    c.drawString(54, y, "The system implements complete CRUD persistence, service isolation, and relational mappings.")
    
    y -= 25
    c.setFont("Helvetica-Bold", 13)
    c.drawString(54, y, "2. CRUD Operations & REST Endpoints")
    y -= 18
    c.setFont("Helvetica", 10)
    c.drawString(54, y, "• GET /api/v1/employees - Retrieves all active employee records.")
    y -= 14
    c.drawString(54, y, "• GET /api/v1/employees/{id} - Fetches detailed record by ID.")
    y -= 14
    c.drawString(54, y, "• POST /api/v1/employees - Creates employee with department and salary fields.")
    y -= 14
    c.drawString(54, y, "• PUT /api/v1/employees/{id} - Updates employee details.")
    y -= 14
    c.drawString(54, y, "• DELETE /api/v1/employees/{id} - Soft deletes employee record.")

    y -= 25
    c.setFont("Helvetica-Bold", 13)
    c.drawString(54, y, "3. Database Integration & Entity Schema")
    y -= 18
    c.setFont("Helvetica", 10)
    c.drawString(54, y, "Configured Spring Data JPA with @Entity Employee and JpaRepository<Employee, Long>.")
    y -= 14
    c.drawString(54, y, "Includes primary key generation, indexed email column, and SQL schema migrations.")

    y -= 25
    c.setFont("Helvetica-Bold", 13)
    c.drawString(54, y, "4. Input Validation & Request Constraints")
    y -= 18
    c.setFont("Helvetica", 10)
    if has_validation:
        c.drawString(54, y, "Implemented Jakarta Validation with @Valid, @NotNull, @NotBlank, and @Email on EmployeeDTO.")
        y -= 14
        c.drawString(54, y, "Ensures salary > 0, email follows standard RFC regex, and department name is mandatory.")
    else:
        c.drawString(54, y, "[NOTE: Basic DTO mapping present. Comprehensive email/regex validation pending for v2.]")

    y -= 25
    c.setFont("Helvetica-Bold", 13)
    c.drawString(54, y, "5. Centralized Error & Exception Handling")
    y -= 18
    c.setFont("Helvetica", 10)
    if has_exceptions:
        c.drawString(54, y, "Added @ControllerAdvice GlobalExceptionHandler catching ResourceNotFoundException and")
        y -= 14
        c.drawString(54, y, "MethodArgumentNotValidException, returning standardized JSON ErrorResponse with timestamp.")
    else:
        c.drawString(54, y, "[NOTE: Standard runtime try/catch in controller without centralized ControllerAdvice.]")

    y -= 25
    c.setFont("Helvetica-Bold", 13)
    c.drawString(54, y, "6. Documentation & Setup Instructions")
    y -= 18
    c.setFont("Helvetica", 10)
    if has_docs:
        c.drawString(54, y, "Complete README provided with curl commands, Swagger/OpenAPI endpoint mappings,")
        y -= 14
        c.drawString(54, y, "and local execution commands: mvn spring-boot:run.")
    else:
        c.drawString(54, y, "Basic project readme with repository setup.")

    c.save()
    return file_path

def generate_sample_zip(filename: str, has_validation: bool, has_exceptions: bool):
    """Generates a sample Java project zip archive for code review testing."""
    file_path = SAMPLE_DIR / filename
    
    validation_code = """
    @NotNull(message = "Name cannot be null")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;

    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email must be a valid format")
    private String email;
    """ if has_validation else """
    private String name;
    private String email;
    """

    exception_code = """
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(404, ex.getMessage()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(400, "Validation failed"));
    }
}
""" if has_exceptions else "// Exception handling in standard try/catch"

    readme_content = """# Employee REST API Project
## Endpoints
- GET /api/v1/employees - List all
- POST /api/v1/employees - Create new
- PUT /api/v1/employees/{id} - Update
- DELETE /api/v1/employees/{id} - Delete
""" + ("\n## Validation & Error Handling\nCentralized validation and exception handling enabled.\n" if has_validation else "")

    with zipfile.ZipFile(file_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("src/main/java/com/demo/controller/EmployeeController.java", f"""package com.demo.controller;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {{
    @GetMapping
    public List<Employee> getAll() {{ return List.of(); }}
    @PostMapping
    public Employee create(@RequestBody EmployeeDTO dto) {{ return new Employee(); }}
}}
""")
        zf.writestr("src/main/java/com/demo/dto/EmployeeDTO.java", f"""package com.demo.dto;
public class EmployeeDTO {{
{validation_code}
}}
""")
        zf.writestr("src/main/java/com/demo/exception/GlobalExceptionHandler.java", exception_code)
        zf.writestr("README.md", readme_content)

    return file_path

def seed_database(db: Session):
    """Idempotently seeds demo users, program, tasks, and initial review state."""
    # Ensure sample test files exist on disk
    generate_sample_report_pdf(
        filename="employee_api_v1_incomplete.pdf",
        title="Employee REST API Project Report (Initial v1)",
        has_validation=False,
        has_exceptions=False,
        has_docs=False
    )
    generate_sample_report_pdf(
        filename="employee_api_v2_improved.pdf",
        title="Employee REST API Project Report (Revised v2)",
        has_validation=True,
        has_exceptions=True,
        has_docs=True
    )
    generate_sample_zip(
        filename="employee_api_v1_code.zip",
        has_validation=False,
        has_exceptions=False
    )
    generate_sample_zip(
        filename="employee_api_v2_code.zip",
        has_validation=True,
        has_exceptions=True
    )

    # 1. Seed Manager
    manager = db.query(User).filter(User.email == "manager@demo.com").first()
    if not manager:
        manager = User(
            name="Sarah Jenkins",
            email="manager@demo.com",
            password_hash=hash_password("password123"),
            role="MANAGER",
            phone="+1 (555) 234-5678",
            avatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        )
        db.add(manager)
        db.flush()

    # 2. Seed Intern
    intern = db.query(User).filter(User.email == "intern@demo.com").first()
    if not intern:
        intern = User(
            name="Alex Chen",
            email="intern@demo.com",
            password_hash=hash_password("password123"),
            role="INTERN",
            phone="+1 (555) 876-5432",
            avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        )
        db.add(intern)
        db.flush()

    # 3. Seed Program: "Software Development Internship"
    program = db.query(Program).filter(Program.title == "Software Development Internship").first()
    if not program:
        program = Program(
            title="Software Development Internship",
            description="4-Week Accelerated Software Engineering Program covering backend microservices, SQL databases, API testing, and deployment.",
            start_date=datetime(2026, 10, 1, 0, 0, 0, tzinfo=timezone.utc),
            end_date=datetime(2026, 10, 31, 23, 59, 59, tzinfo=timezone.utc)
        )
        db.add(program)
        db.flush()

    # 4. Seed Task 1: "Database Schema & Entity Relationship Design" (Completed/Approved in Week 1)
    task_w1 = db.query(Task).filter(Task.title == "Database Schema & Entity Relationship Design").first()
    if not task_w1:
        task_w1 = Task(
            program_id=program.id,
            title="Database Schema & Entity Relationship Design",
            description="Design normalized relational database schema for employee records, departments, and payroll.",
            expected_outcome="ER diagram, SQL DDL migrations, and indexed relational entity tables.",
            evaluation_guidelines="• 3NF normalization\n• Foreign key constraints\n• Indexing on lookup columns\n• SQL migration scripts",
            ai_task_understanding=ai_review_service.generate_task_understanding(
                "Database Schema Design",
                "Design normalized schema for employee records",
                "ER diagram and SQL migrations",
                "Normalization, indexes, constraints"
            ),
            week_number=1,
            deadline=datetime.now(timezone.utc) - timedelta(days=2),
            manager_id=manager.id,
            intern_id=intern.id,
            status="APPROVED",
            max_revisions=3
        )
        db.add(task_w1)
        db.flush()

        # Seed submission & approved review for Task 1
        sub_w1 = Submission(
            task_id=task_w1.id,
            intern_id=intern.id,
            version=1,
            submission_type="FILE",
            file_name="schema_design_v1.pdf",
            file_path=str(SAMPLE_DIR / "employee_api_v2_improved.pdf"),
            file_size_bytes=104500,
            submitted_text="Final schema design and ER diagram.",
            extracted_content="Database schema normalized to 3NF. Indices on employee email and department id.",
            status="APPROVED",
            submitted_at=datetime.now(timezone.utc) - timedelta(days=3)
        )
        db.add(sub_w1)
        db.flush()

        rev_w1 = AIReview(
            submission_id=sub_w1.id,
            overall_score=92.0,
            confidence_score=94.0,
            recommendation="APPROVED",
            overall_assessment="High quality relational schema design with proper constraints.",
            mentor_feedback="Superb work on the normalization and foreign key indexing! Ready to move onto the REST API.",
            reviewed_at=datetime.now(timezone.utc) - timedelta(days=3)
        )
        rev_w1.strengths = [
            "Clean third-normal form normalization across tables.",
            "Appropriate foreign key cascade and nullability rules.",
            "Detailed entity relationship diagrams."
        ]
        rev_w1.weaknesses = ["Could include partition strategy for large historical audit tables."]
        rev_w1.issues = []
        rev_w1.suggestions = ["Consider adding database migration rollback scripts."]
        db.add(rev_w1)

    # 5. Seed Task 2: Core Demo Task: "Build Employee REST API" (Week 2, Active Task)
    demo_task = db.query(Task).filter(Task.title == "Build Employee REST API").first()
    if not demo_task:
        demo_task = Task(
            program_id=program.id,
            title="Build Employee REST API",
            description="Create a REST API using Java Spring Boot (or FastAPI) for managing employees. Include endpoints for employee creation, retrieval, updates, and deletion with persistent storage.",
            expected_outcome="A working REST API with CRUD operations, database integration, validation and error handling.",
            evaluation_guidelines="• Code quality & structure\n• CRUD Functionality\n• REST API design\n• Input validation & constraints\n• Centralized exception handling\n• Documentation & README",
            ai_task_understanding=ai_review_service.generate_task_understanding(
                "Build Employee REST API",
                "Create a REST API using Java Spring Boot for managing employees.",
                "A working REST API with CRUD operations, database integration, validation and error handling.",
                "• Code quality\n• CRUD Functionality\n• REST API design\n• Validation\n• Error handling\n• Documentation"
            ),
            week_number=2,
            deadline=datetime.now(timezone.utc) + timedelta(days=5),
            manager_id=manager.id,
            intern_id=intern.id,
            status="PENDING_SUBMISSION",
            max_revisions=3
        )
        db.add(demo_task)
        db.flush()

        # Add initial history event
        db.add(ReviewHistory(
            task_id=demo_task.id,
            actor_id=manager.id,
            event_type="CREATED",
            title="Task Assigned to Alex Chen",
            description="Manager Sarah Jenkins assigned 'Build Employee REST API' with deadline Oct 18, 2026."
        ))

        # Add initial notification
        db.add(Notification(
            recipient_id=intern.id,
            task_id=demo_task.id,
            type="NEW_TASK",
            channel="IN_APP",
            title=f"New Task Assigned: {demo_task.title}",
            message="Please build the Employee REST API and submit your code or report when ready.",
            status="UNREAD"
        ))

    # 6. Seed Task 3 & 4 (Future weeks to demonstrate full 4-week internship)
    task_w3 = db.query(Task).filter(Task.title == "Automated Integration Testing & CI Pipeline").first()
    if not task_w3:
        task_w3 = Task(
            program_id=program.id,
            title="Automated Integration Testing & CI Pipeline",
            description="Build automated integration test suite with GitHub Actions workflow.",
            expected_outcome="MockMvc / pytest test suite achieving > 80% coverage and passing CI build.",
            evaluation_guidelines="• Test coverage\n• Mocking isolation\n• CI workflow configuration",
            ai_task_understanding="Objective: Automated testing and CI pipeline. Deliverable: Tests & GitHub actions workflow.",
            week_number=3,
            deadline=datetime.now(timezone.utc) + timedelta(days=12),
            manager_id=manager.id,
            intern_id=intern.id,
            status="PENDING_SUBMISSION",
            max_revisions=3
        )
        db.add(task_w3)

    task_w4 = db.query(Task).filter(Task.title == "Production Deployment & Monitoring").first()
    if not task_w4:
        task_w4 = Task(
            program_id=program.id,
            title="Production Deployment & Monitoring",
            description="Containerize application with Docker, write compose file, and setup health checks.",
            expected_outcome="Docker container image, compose specification, and Prometheus / Actuator health endpoints.",
            evaluation_guidelines="• Dockerfile optimization\n• Health checks\n• Security best practices",
            ai_task_understanding="Objective: Containerization and deployment. Deliverable: Dockerfile and compose.",
            week_number=4,
            deadline=datetime.now(timezone.utc) + timedelta(days=19),
            manager_id=manager.id,
            intern_id=intern.id,
            status="PENDING_SUBMISSION",
            max_revisions=3
        )
        db.add(task_w4)

    db.commit()
    return {"status": "seeded", "manager": manager.email, "intern": intern.email, "task": demo_task.title}
