# AI-Powered Continuous Internship Task Review System (MentorAI)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS%20v4-38B2AC.svg)](https://tailwindcss.com)
[![Deployment](https://img.shields.io/badge/Live%20Frontend-Vercel-black.svg)](https://employee-ai-task-review-system.vercel.app)
[![API Status](https://img.shields.io/badge/Live%20Backend-Render-46E3B7.svg)](https://employee-ai-task-review-system.onrender.com)

An intelligent, continuous task review platform designed for organizations running month-long or multi-week internship programs. Rather than simply acting as a passive checker or vague chatbot, the system functions like an **experienced engineering mentor** that evaluates submitted code/documents, identifies evidence-based strengths and issues, calculates improvement between versions, dispatches automated multi-channel follow-ups, and keeps the manager firmly in control as the final authority.

---

## 🌐 Live Production Deployments

- 🚀 **Live Web Application (Vercel)**: **[https://employee-ai-task-review-system.vercel.app](https://employee-ai-task-review-system.vercel.app)**
- ⚙️ **Live Backend REST API (Render)**: **[https://employee-ai-task-review-system.onrender.com](https://employee-ai-task-review-system.onrender.com)**
- 📖 **Interactive Swagger API Docs**: **[https://employee-ai-task-review-system.onrender.com/docs](https://employee-ai-task-review-system.onrender.com/docs)**

---

## 🎯 Problem Statement & Product Vision

Organizations assign milestone tasks to interns and junior employees over multi-week programs. However:
1. Managers spend excessive hours manually inspecting submissions, discovering basic missing requirements (like input validation or unhandled errors), and repeating feedback loops.
2. Interns often receive only one-time pass/fail checks rather than continuous pedagogical guidance.
3. Traditional LLM tools produce generic, non-evidence-based feedback or hallucinate without referencing actual task guidelines.

### Our Solution
**MentorAI** transforms the review cycle:
- **AI Task Understanding**: Automatically synthesizes the objective, expected deliverable, and crucial evaluation guidelines.
- **Human-Like Mentor Evaluation**: Generates evidence-based strengths, weaknesses, concrete issues, actionable suggestions, and a natural mentor feedback paragraph.
- **⭐ Continuous Improvement Tracking (v1 → v2)**: Compares successive revisions, tracks score delta (`72 → 88, +16 pts`), and verifies whether previous issues were resolved.
- **📊 Engineering Competency Rubric**: Evaluates key pillars (Validation, Architecture, REST Standards, Code Quality) with visual progress meters.
- **🔁 Automated Repeating Reminder Engine**: Automatically scans incomplete or revision-pending tasks and repeats follow-up notifications (Email & SMS) until the task is completed and approved.
- **📱 Multi-Channel Delivery & Device Simulators**: Full support for In-App, Email (SMTP), and SMS (Twilio) alerts, complete with interactive mobile smartphone and email client simulators in the UI!
- **Human Authority**: AI assists the manager; if AI confidence drops below a configured threshold, the submission is flagged for **Human Review Required**, allowing managers to approve, request revisions, or override scores.

---

## 🚀 Live Demo Walkthrough (3-Minute Script)

The prototype comes with realistic seeded demo data and **built-in 1-click test file loaders**:

### 1. View Assigned Milestone (Intern Role)
- Open the application at [http://127.0.0.1:3000](http://127.0.0.1:3000).
- You are automatically signed in as intern **Alex Chen** (`intern@demo.com`).
- Observe the **Software Development Internship** progress banner (Week 2 of 4).
- Open the active milestone: **"Build Employee REST API"**.

### 2. Submit Initial Version (v1 - Fails Validation)
- Click **Submit Work**.
- Click the button **"⚡ Load v1 Incomplete (Fails)"** — this auto-loads `employee_api_v1_incomplete.pdf`.
- Click **Submit for AI Review (v1)**.
- Watch the 3-step animated evaluation pipeline:
  1. *Extracting text & parsing code structure*
  2. *Evaluating implementation against mentor guidelines*
  3. *Formulating evidence-based mentor feedback*
- **Result**:
  - Score: **72/100**
  - Recommendation: **NEEDS REVISION**
  - Concrete issues detected: Missing request email validation & missing centralized exception handling.
  - Actionable suggestions provided.

### 3. Resubmit Improved Version (v2 - Passes & Shows Improvement Diff)
- In the review modal, click **Resubmit Improved Work (v2)**.
- Click the button **"⚡ Load v2 Improved (Passes)"** — this loads `employee_api_v2_improved.pdf`.
- Click **Submit for AI Review (v2)**.
- **Result**:
  - Score jumps: **72 → 88 (+16 points)**
  - Recommendation: **APPROVED** 🎉
  - **⭐ Continuous Improvement Tracking Banner**: Displays the comparison narrative and previous issues status checklist (`✅ Resolved: Missing input validation`, `✅ Resolved: Inconsistent exception handling`, `✅ Resolved: Documentation updated`).

### 4. Manager Oversight (Manager Role)
- In the top header bar, click **"Switch to Manager (Sarah)"**.
- Notice the manager metrics: Active Tasks, Pending Reviews, Revision Required, Completed Tasks, and Cohort Average Score.
- Open the task to inspect Alex's submission versions (v1 vs v2), the AI mentor review, the audit trail timeline, and the **Manager Decision Panel** (Approve / Request Revision / Score Override).

---

## 🏗️ System Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │          React 19 + Vite Frontend            │
                  │  (Tailwind CSS v4, Lucide Icons, Dark Theme) │
                  └──────────────────────┬───────────────────────┘
                                         │ REST API
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            FastAPI Backend Service           │
                  └──────┬───────────────┼───────────────┬───────┘
                         │               │               │
     ┌───────────────────┴──┐     ┌──────┴──────┐    ┌───┴────────────────┐
     │  Document Processor  │     │ Database    │    │ AI Mentor Reviewer │
     │  • PDF (PyPDF)       │     │ (SQLite     │    │ • Gemini LLM API   │
     │  • DOCX (python-docx)│     │  SQLAlchemy │    │ • Intelligent NLP  │
     │  • ZIP Code Archives │     │  Alembic    │    │   Fallback Engine  │
     │  • TXT / Markdown    │     │  Ready)     │    │ • Version Diffing  │
     └──────────────────────┘     └─────────────┘    └────────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS v4, Lucide React icons.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2.
- **Document Extraction**: `pypdf`, `python-docx`, Python `zipfile`, ReportLab.
- **AI Review Engine**:
  - **Google Gemini API** (`gemini-2.5-flash` or `gemini-1.5-flash`) via secure backend environment configuration.
  - **Zero-Setup Intelligent Mentor Analyzer**: Built-in fallback ensuring 100% demo reliability even without an external API key!
- **Notifications**: Multi-channel abstraction (In-App alerts, Email mock log, SMS tagged with DEMO MODE).

---

## ⚡ Quick Start & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# In the project root directory
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac / Linux: source venv/bin/activate

pip install -r backend/requirements.txt
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

### 3. Run Both Services
**Windows (One-Click):**
```bash
run_demo.bat
```

**Or Run Manually:**
- Terminal 1 (Backend):
  ```bash
  .\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
  ```
- Terminal 2 (Frontend):
  ```bash
  cd frontend
  npm run dev -- --host 127.0.0.1 --port 3000
  ```

Access the app at: **http://127.0.0.1:3000**  
API Documentation at: **http://127.0.0.1:8000/docs**

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Manager** | `manager@demo.com` | `password123` |
| **Intern** | `intern@demo.com` | `password123` |

*(A 1-click **"Switch to Intern / Switch to Manager"** button is also conveniently located in the top navigation bar).*
