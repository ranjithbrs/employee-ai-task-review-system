# MentorAI: Architecture & API Specification

Comprehensive architectural design, component topology, entity schema, and API catalog for the **Employee AI Task Review System (MentorAI)**.

---

## 1. System Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Client (React 18 + Vite + TailwindCSS)"]
        UI_Intern["Intern Dashboard\n- Task View & Guidelines\n- Sample File Downloader\n- Multi-format File/Code Uploader\n- Version Diff & Growth Tracker"]
        UI_Manager["Manager Dashboard\n- Program Metrics & Analytics\n- Task Creator with AI Understanding\n- Human-in-the-Loop Decision Override\n- Audit Trail & Activity Logs"]
        UI_Notif["Multi-Channel Notification Hub\n- In-App Notification Feed\n- Email Delivery Preview\n- SMS Alert Inspector\n- Automated Reminder Dispatcher"]
    end

    subgraph APILayer["Backend Gateway & Application Server (FastAPI + Python 3.10+)"]
        AuthMiddleware["JWT Authentication & RBAC Middleware\n- Role enforcement (INTERN vs MANAGER)\n- Token expiration & revocation\n- PBKDF2 SHA-256 Hashing"]
        
        Router_Auth["/api/auth\nLogin, Profile, Role Switch"]
        Router_Tasks["/api/tasks\nCRUD, Rubrics, Metrics"]
        Router_Submissions["/api/tasks/{id}/submit\nFile Ingestion & Review Trigger"]
        Router_Manager["/api/tasks/{id}/manager-decision\nHuman Override & Audit Trail"]
        Router_Notifs["/api/notifications\nFilter, Mark Read, Automated Reminders"]
    end

    subgraph ServiceLayer["Core Business Logic & AI Pipeline"]
        DocService["Document Extraction Service\n- PDF Extraction (PyPDF2)\n- Multi-file ZIP Code Inspector\n- Plain Text / Markdown / Code"]
        
        AIService["AI Review Service (Senior Mentor Persona)\n- Google Gemini 1.5 Pro / Flash\n- Heuristic Fallback Engine\n- Version-to-Version Diff Comparator\n- Confidence Scoring (<75% -> Human Review)"]
        
        NotificationService["Multi-Channel Notification Engine\n- In-App Persistent Feed\n- Simulated Email Dispatcher\n- Simulated SMS Dispatcher\n- Recurring Background Reminder Loop"]
    end

    subgraph PersistenceLayer["Storage & Data Persistence"]
        DB[(Relational DB\nSQLite / PostgreSQL)]
        DiskStorage["Local File Store\nUploaded Submissions & Samples"]
    end

    UI_Intern -->|REST + Bearer Token| APILayer
    UI_Manager -->|REST + Bearer Token| APILayer
    UI_Notif -->|REST + Bearer Token| APILayer

    APILayer --> AuthMiddleware
    AuthMiddleware --> Router_Auth
    AuthMiddleware --> Router_Tasks
    AuthMiddleware --> Router_Submissions
    AuthMiddleware --> Router_Manager
    AuthMiddleware --> Router_Notifs

    Router_Submissions --> DocService
    DocService --> AIService
    AIService --> NotificationService
    Router_Manager --> NotificationService

    DocService --> DiskStorage
    Router_Auth --> DB
    Router_Tasks --> DB
    Router_Submissions --> DB
    Router_Manager --> DB
    Router_Notifs --> DB
    NotificationService --> DB
```

---

## 2. Submission Lifecycle & State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING_SUBMISSION: Task Assigned to Intern
    
    PENDING_SUBMISSION --> UNDER_REVIEW: Intern submits File, ZIP, or Text
    
    state UNDER_REVIEW {
        [*] --> TextExtraction: PyPDF2 / zipfile / raw text
        TextExtraction --> AIScoring: Gemini 1.5 / Intelligent Mentor Engine
        AIScoring --> ConfidenceCheck: Check confidence >= 75.0%
        ConfidenceCheck --> VersionDiff: Compare against Version N-1 (if v >= 2)
        VersionDiff --> [*]
    }
    
    UNDER_REVIEW --> APPROVED: Score >= 85% & No Critical Issues
    UNDER_REVIEW --> NEEDS_REVISION: Score < 85% or Blocking Issues Detected
    UNDER_REVIEW --> HUMAN_REVIEW_REQUIRED: Confidence < 75% or Ambiguous Work
    
    NEEDS_REVISION --> UNDER_REVIEW: Intern Submits Version N+1
    
    NEEDS_REVISION --> APPROVED: Manager Overrides Decision (APPROVE)
    APPROVED --> NEEDS_REVISION: Manager Overrides Decision (REQUEST_REVISION)
    HUMAN_REVIEW_REQUIRED --> APPROVED: Manager Reviews & Approves
    HUMAN_REVIEW_REQUIRED --> NEEDS_REVISION: Manager Reviews & Requests Changes
    
    NEEDS_REVISION --> RecurringReminder: Cron / Automated Background Loop
    PENDING_SUBMISSION --> RecurringReminder: Cron / Automated Background Loop
    RecurringReminder --> NotificationDispatch: Email + SMS + In-App to Intern
    NotificationDispatch --> NEEDS_REVISION: Awaiting Revision
```

---

## 3. Role-Based Access Control (RBAC) Matrix

| Endpoint | Method | Public | INTERN | MANAGER | Description |
|---|---|:---:|:---:|:---:|---|
| `/api/auth/login` | POST | Yes | Yes | Yes | Authenticate and obtain JWT bearer token |
| `/api/auth/me` | GET | No | Yes | Yes | Retrieve authenticated user profile |
| `/api/auth/demo-switch/{role}` | POST | Yes | Yes | Yes | Developer/demo utility to switch active role |
| `/api/tasks` | GET | No | Yes | Yes | List program tasks with latest submission status |
| `/api/tasks/{task_id}` | GET | No | Yes | Yes | Fetch task details, evaluation rubric, and history |
| `/api/tasks` | POST | No | **403** | **200** | Create task with auto AI Understanding synthesis |
| `/api/tasks/{task_id}/submit` | POST | No | Yes | Yes | Submit task deliverable (PDF, ZIP, TXT, MD, Code) |
| `/api/tasks/{task_id}/manager-decision` | POST | No | **403** | **200** | Human-in-the-loop override with audit trail |
| `/api/metrics/manager` | GET | No | **403** | **200** | Managerial program health, bottlenecks & scores |
| `/api/notifications` | GET | No | Yes | Yes | Fetch user notifications (channel filtered) |
| `/api/notifications/{id}/read` | PUT | No | Yes | Yes | Mark single notification as read |
| `/api/notifications/read-all` | PUT | No | Yes | Yes | Bulk mark all notifications as read |
| `/api/tasks/reminders/trigger` | POST | No | Yes | Yes | Trigger automated recurring reminder check |
| `/api/sample-files/{filename}` | GET | Yes | Yes | Yes | Download verified testing sample files |
| `/api/health` | GET | Yes | Yes | Yes | System liveness, model status, and version |

---

## 4. Complete API Endpoint Catalog

### Authentication (`/api/auth`)

#### `POST /api/auth/login`
Authenticates a user with email and password, returning an access token and user metadata.
- **Request Body**:
  ```json
  {
    "email": "intern@demo.com",
    "password": "password123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": 2,
      "name": "Alex Chen",
      "email": "intern@demo.com",
      "role": "INTERN",
      "phone": "+15550192835"
    }
  }
  ```
- **Error Responses**: `401 Unauthorized` for bad credentials.

#### `GET /api/auth/me`
Returns current session profile. Requires `Authorization: Bearer <token>`.

#### `POST /api/auth/demo-switch/{role}`
Allows instant zero-friction switching between `INTERN` and `MANAGER` roles during demos and testing.

---

### Tasks & Evaluation Rubrics (`/api/tasks`)

#### `GET /api/tasks`
Lists all tasks for the internship program along with current submission status, latest scores, and revision counts.

#### `GET /api/tasks/{task_id}`
Returns granular task data:
- Full problem description and expected deliverables.
- Evaluation rubric with explicit scoring guidelines.
- Synthesized `ai_task_understanding` summary.
- Chronological submission version history.
- Structured AI evaluation results (strengths, issues, recommendations).
- Manager decision override history with comments.

#### `POST /api/tasks` (Manager Restricted)
Creates a new task. Automatically synthesizes structured `ai_task_understanding` based on guidelines.
- **Headers**: `Authorization: Bearer <manager_token>`
- **Request Body**:
  ```json
  {
    "title": "Secure Payment Gateway Integration",
    "description": "Implement Stripe webhook handler with signature validation.",
    "expected_outcome": "Working webhook receiver in FastAPI.",
    "evaluation_guidelines": "- Webhook signature verification\n- Idempotency key handling\n- Unit test coverage",
    "deadline": "2026-11-20T18:00:00Z",
    "week_number": 3
  }
  ```
- **Success Response (200 OK)**: Task object with generated `ai_task_understanding`.

---

### Task Submissions & AI Mentor Evaluation (`/api/tasks/{task_id}/submit`)

#### `POST /api/tasks/{task_id}/submit`
Uploads and evaluates an intern deliverable.
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: (Optional) PDF, ZIP, TXT, PY, JS, TS, JAVA, MD, or JSON file.
  - `submission_notes`: (Optional) Explanatory text, notes, or repo URL.
- **Workflow**:
  1. Inspects and validates file extension and size.
  2. Extracts text from PDF via PyPDF2 or analyzes multi-file code hierarchies in ZIP archives.
  3. Dispatches payload to `AIReviewService`.
  4. Computes score, detects issues, compiles mentor feedback, and compares against Version $N-1$.
  5. Updates task status (`APPROVED`, `NEEDS_REVISION`, or `HUMAN_REVIEW_REQUIRED`).
  6. Dispatches multi-channel notifications (In-App, Email, SMS).
- **Success Response (200 OK)**:
  ```json
  {
    "task_id": 1,
    "submission_id": 1,
    "version": 2,
    "status": "APPROVED",
    "ai_review": {
      "overall_score": 88.0,
      "confidence_score": 91.0,
      "recommendation": "APPROVED",
      "human_review_required": false,
      "strengths": [
        "CRUD operations are well-structured with clear RESTful URI conventions.",
        "Input validation has been implemented with clear request payload verification."
      ],
      "issues": [],
      "suggestions": [
        "Add automated integration tests covering edge cases."
      ],
      "mentor_feedback": "Excellent improvement on this revision! You addressed the input validation gaps...",
      "continuous_improvement_summary": "Resolved 2 prior issues. Overall score improved by +16 points.",
      "previous_issues_status": [
        {"issue": "Missing input validation", "status": "RESOLVED", "note": "Resolved in v2"}
      ]
    }
  }
  ```

---

### Manager Decision Override & Audit Trail (`/api/tasks/{task_id}/manager-decision`)

#### `POST /api/tasks/{task_id}/manager-decision` (Manager Restricted)
Enables human mentors to supervise and override AI recommendations.
- **Headers**: `Authorization: Bearer <manager_token>`
- **Request Body**:
  ```json
  {
    "decision": "OVERRIDE_SCORE",
    "override_score": 95.0,
    "manager_comment": "Intern went beyond expectations with custom security filters."
  }
  ```
- **Allowed Decisions**: `APPROVE`, `REQUEST_REVISION`, `OVERRIDE_SCORE`.
- **Audit Trail**: Every override records the previous score, new score, previous status, new status, manager ID, timestamp, and human rationale.

---

### Multi-Channel Notifications & Automated Reminders

#### `GET /api/notifications`
Fetches user notifications. Supports query filtering: `?channel=IN_APP`, `?channel=EMAIL`, `?channel=SMS`.

#### `PUT /api/notifications/{id}/read`
Marks an individual notification as read.

#### `PUT /api/notifications/read-all`
Marks all notifications for the authenticated user as read.

#### `POST /api/tasks/reminders/trigger`
Triggers an automated recurring reminder scan:
- Scans all tasks in `PENDING_SUBMISSION` or `NEEDS_REVISION`.
- Detects tasks that have not received an update within the configured cadence.
- Dispatches multi-channel reminders (Email, SMS, In-App).
- Returns count and dispatch audit details.

---

## 5. Relational Database Schema

```mermaid
erDiagram
    USERS ||--o{ TASKS : manages
    USERS ||--o{ TASKS : assigned_to
    PROGRAMS ||--o{ TASKS : contains
    TASKS ||--o{ SUBMISSIONS : has_versions
    SUBMISSIONS ||--|| AI_REVIEWS : evaluated_by
    TASKS ||--o{ MANAGER_OVERRIDES : audited_by
    USERS ||--o{ NOTIFICATIONS : receives

    USERS {
        int id PK
        string email UK
        string name
        string password_hash
        string role "INTERN | MANAGER"
        string phone
        datetime created_at
    }

    PROGRAMS {
        int id PK
        string title
        string description
        datetime start_date
        datetime end_date
        datetime created_at
    }

    TASKS {
        int id PK
        int program_id FK
        string title
        string description
        string expected_outcome
        string evaluation_guidelines
        string ai_task_understanding
        int week_number
        datetime deadline
        int manager_id FK
        int intern_id FK
        string status "PENDING_SUBMISSION | UNDER_REVIEW | NEEDS_REVISION | APPROVED | HUMAN_REVIEW_REQUIRED"
        int max_revisions
        datetime created_at
        datetime updated_at
    }

    SUBMISSIONS {
        int id PK
        int task_id FK
        int intern_id FK
        int version
        string file_name
        string file_path
        string file_type
        int file_size
        text submission_notes
        string status
        datetime created_at
    }

    AI_REVIEWS {
        int id PK
        int submission_id FK
        float overall_score
        float confidence_score
        string recommendation
        boolean human_review_required
        text overall_assessment
        json strengths
        json areas_for_improvement
        json issues
        json suggestions
        text mentor_feedback
        text continuous_improvement_summary
        json previous_issues_status
        string model_used
        datetime created_at
    }

    MANAGER_OVERRIDES {
        int id PK
        int task_id FK
        int manager_id FK
        string decision_type
        float previous_score
        float new_score
        string previous_status
        string new_status
        text manager_comment
        datetime created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        int task_id FK
        string title
        text message
        string channel "IN_APP | EMAIL | SMS"
        string type "SUBMISSION_REVIEWED | REVISION_REQUESTED | TASK_APPROVED | REMINDER"
        boolean is_read
        datetime created_at
    }
```
