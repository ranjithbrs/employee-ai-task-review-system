# 🎓 MentorAI: AI-Powered Employee & Intern Task Review System

[![Live App](https://img.shields.io/badge/🚀%20Live%20Application-Visit%20Website-6366F1.svg)](https://employee-ai-task-review-system.vercel.app)
[![API Status](https://img.shields.io/badge/⚙️%20Backend%20API-Online-10B981.svg)](https://employee-ai-task-review-system.onrender.com)
[![Swagger Docs](https://img.shields.io/badge/📖%20API%20Documentation-Explore-06B6D4.svg)](https://employee-ai-task-review-system.onrender.com/docs)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

> **"Think of it as having an expert Senior Mentor sitting next to every junior employee 24/7, guiding them step-by-step until their work is production-ready—while giving managers complete visibility and control."**

---

## 🌐 Try the Live Application Right Now (No Setup Needed!)

You don't need to install anything or know how to code. Click below to experience the complete live system:

- 🚀 **Interactive Web Dashboard**: **[https://employee-ai-task-review-system.vercel.app](https://employee-ai-task-review-system.vercel.app)**
- ⚙️ **Live Backend Service**: **[https://employee-ai-task-review-system.onrender.com](https://employee-ai-task-review-system.onrender.com)**
- 📖 **Interactive API Explorer**: **[https://employee-ai-task-review-system.onrender.com/docs](https://employee-ai-task-review-system.onrender.com/docs)**

---

## 💡 What Is This Project? (Explained in Plain English)

### 📌 The Real-World Problem
When companies hire interns or new employees for a 1-month or 3-month program:
1. **Managers are overwhelmed**: Senior team leads spend 10–20 hours every week reviewing drafts, catching basic mistakes, and sending back email feedback.
2. **Interns feel stranded**: Interns submit their work and often wait **3 to 5 days** just to hear if it passed. When they do get feedback, it's often just a rushed "Fix this" without explaining *how*.
3. **Traditional AI checkers are too generic**: Tools like basic chatbots just say "Looks good!" or give vague answers without checking against the actual project requirements.

---

### ✨ The Solution: MentorAI
**MentorAI acts like an experienced, patient Senior Mentor who never sleeps:**

```
   [ Intern submits Work ] ────▶ [ AI Mentor checks in 30s ] ────▶ [ Actionable Feedback & Score ]
                                                                             │
                                                                             ▼
   [ Final Approval / Override ] ◀──── [ SMS / Email Follow-ups ] ◀──── [ Revision Loop until Approved ]
```

1. **Instant, Expert Feedback**: When an intern uploads their work (PDF report, code files, Word document, or GitHub link), the AI reviews it in **30 seconds**.
2. **Helpful & Encouraging Guidance**: Instead of a cold red "FAILED", the AI explains:
   - 🟢 **Strengths**: What the employee did really well.
   - 🟡 **Areas for Improvement**: What can be enhanced.
   - 🔴 **Specific Issues**: Exact requirements that were missed.
   - 💡 **Actionable Suggestions**: Step-by-step guidance on how to fix them.
3. **The Improvement Journey (v1 ➔ v2)**: When the intern fixes the issues and resubmits, the AI compares the new version to the old one, celebrates their progress (e.g., **"Score improved from 72% to 88% (+16 points!)"**), and marks previous issues as resolved.
4. **Automated Reminders via Email & SMS**: If an employee's work needs revision, the system automatically sends polite recurring reminders to their email and phone until they complete the milestone.
5. **The Manager Remains the Boss (Human in the Loop)**: AI is an assistant, not the boss. The manager can see everyone's progress on one screen, approve tasks, request revisions, or override any grade with one click.

---

## 🚗 Simple Analogy: The "Driving Instructor"

| Traditional Process | MentorAI System |
| :--- | :--- |
| Like taking a driving test once a month and failing with no explanation. | Like having a **friendly driving instructor** sitting right next to you, giving tips every turn. |
| Waiting days for an email reply from a busy manager. | Instant feedback within **30 seconds** of submitting work. |
| Managers re-reading the same beginner mistakes 50 times. | AI catches 90% of beginner mistakes automatically, freeing managers for high-level leadership. |

---

## 🌟 4 Core Features & How They Work

### 1️⃣ 🤖 Automated AI Reviewer (Document & Code Analysis)
- Accepts **PDFs, Word documents, text summaries, and ZIP code archives**.
- Reads and understands the specific goals of each week (e.g., Week 1: Database Setup, Week 2: REST API, Week 3: Testing, Week 4: Deployment).
- Scores the submission from **0 to 100** based on an **Engineering Competency Rubric**:
  - 🛡️ *Validation & Error Handling*
  - 🏛️ *Architecture & Modularity*
  - ⚡ *API Standards & Contracts*
  - 🧪 *Code Quality & Completeness*

### 2️⃣ 📈 Continuous Improvement Tracking (v1 ➔ v2 Progression)
- When an intern resubmits an updated deliverable, the AI runs a **version comparison**:
  - Shows the exact point increase (e.g., **+16 pts**).
  - Displays a side-by-side checklist of which past issues were successfully fixed.
  - Gives encouraging praise for the employee's growth.

### 3️⃣ 🔁 Automated Repeating Follow-Ups (Email & SMS)
- **Repeats until finished**: If a task requires revision or is nearing deadline, the system automatically dispatches recurring follow-ups via **Email** and **cellular SMS**.
- **Interactive Device Simulators**: Click any alert in the **Notification Center** to see an authentic **mobile smartphone screen** with text bubbles or a **corporate email inbox view**!

### 4️⃣ 👔 Manager Decision Center (Human Authority)
- Managers have a bird's-eye view of all interns in the program.
- If the AI is not 100% confident, it flags the submission with **`HUMAN_REVIEW_REQUIRED`**.
- Managers can approve with a custom comment, request a revision, or manually change the score.

---

## 🎮 How to Test the Entire System in 2 Minutes (Non-Tech Guide)

You can try the full intern-to-manager experience on the live website without preparing any files:

1. **Open the live app**: [https://employee-ai-task-review-system.vercel.app](https://employee-ai-task-review-system.vercel.app)
2. **Start as Intern Alex**:
   - You are automatically on the **Intern View** (Alex Chen).
   - Under **Week 2**, click the task **"Build Employee REST API"**.
3. **Submit Version 1 (Incomplete)**:
   - Click **Submit Work**.
   - Click the shortcut button **`⚡ Load v1 (Incomplete)`** ➔ Click **"Submit for AI Review"**.
   - Watch the animated AI review: It gives a score of **72% (Needs Revision)**, highlights missing validation, and points out missing exception handling.
4. **Check Mobile & Email Alerts**:
   - Click the **🔔 Bell Icon** in the top-right corner.
   - Click the **SMS** or **Email** notification to open the **Phone Simulator** and see the automated text message!
5. **Resubmit Version 2 (Improved)**:
   - Click **Submit Revision**.
   - Click **`⚡ Load v2 (Fixed)`** ➔ Click **"Submit for AI Review"**.
   - **Watch the magic happen**: Score jumps to **88% (Approved)**, showing **+16 points** and marking all previous issues as **Resolved**!
6. **Switch to Manager**:
   - Click **"Switch to Manager"** in the top navigation bar.
   - See the manager KPI metrics, open Alex's task, inspect the full audit trail, and test the **"Trigger Auto-Reminders"** button!

---

## 👥 Two Built-In Roles & Demo Accounts

| Role | Name | Email | Password | What You Can Do |
| :--- | :--- | :--- | :--- | :--- |
| **Intern** | Alex Chen | `intern@demo.com` | `password123` | View assigned weekly tasks, submit deliverables, receive instant AI feedback, and view score improvements. |
| **Manager** | Sarah Connor | `manager@demo.com` | `password123` | View cohort progress, inspect AI reviews, trigger automated reminder loops, approve or override scores. |

*(You can switch between both roles at any time using the 1-click switcher in the top bar).*

---

## 📊 Business Value & Return on Investment (ROI)

| Metric | Before MentorAI | With MentorAI | Improvement |
| :--- | :--- | :--- | :--- |
| **Manager Review Time** | 15–20 hours / week | 2–3 hours / week | **~85% Time Saved** |
| **Intern Feedback Wait Time** | 2 to 5 business days | **30 seconds** | **99% Faster Learning** |
| **Iteration Quality** | Interns repeat mistakes | Step-by-step guidance | **Consistent Company Standards** |
| **Milestone Completion** | Tasks slip past deadlines | Automated Email/SMS reminders | **Higher On-Time Completion** |

---

## 🏗️ Technical Architecture (For Developers & Engineers)

```
                       ┌──────────────────────────────────────────────┐
                       │          React 19 + Vite Frontend            │
                       │  (Tailwind CSS v4, Lucide Icons, Dark Theme) │
                       │              Deployed on Vercel              │
                       └──────────────────────┬───────────────────────┘
                                              │ HTTPS / JSON REST API
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │            FastAPI Backend Service           │
                       │              Deployed on Render              │
                       └──────┬───────────────┼───────────────┬───────┘
                              │               │               │
          ┌───────────────────┴──┐     ┌──────┴──────┐    ┌───┴────────────────┐
          │  Document Extractor  │     │ Database    │    │ AI Mentor Reviewer │
          │  • PyPDF (PDFs)      │     │ • SQLite /  │    │ • Google Gemini LLM│
          │  • python-docx (DOCX)│     │   PostgreSQL│    │ • Heuristic Mentor │
          │  • zipfile (Code)    │     │ • SQLAlchemy│    │   Fallback Engine  │
          │  • Plain Text / MD   │     │ • Alembic   │    │ • Version Diffing  │
          └──────────────────────┘     └─────────────┘    └────────────────────┘
```

### 🛠️ Tech Stack Details

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React icons.
- **Backend**: Python 3.11, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2.
- **AI Engine**: 
  - **Google Gemini API** (`gemini-2.5-flash`) via secure server environment variables.
  - **Intelligent Heuristic Mentor Analyzer**: Built-in zero-key fallback ensuring 100% demo uptime and resilience even without an external API key!
- **Notifications & Multi-Channel Delivery**:
  - In-App Notification Center.
  - Outbound SMTP email engine (supports Gmail / SendGrid / Mailgun).
  - Outbound Twilio cellular SMS engine.
  - Interactive device simulators (iOS mobile mockup and corporate email client).

---

## 💻 Local Installation (For Developers)

If you wish to run the project locally on your machine:

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/ranjithbrs/employee-ai-task-review-system.git
cd employee-ai-task-review-system

# Create and activate Python virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Mac / Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

### 4. Run Both Services

**Windows (One-Click batch script):**
```bash
run_demo.bat
```

**Or run in separate terminals:**
- **Terminal 1 (Backend)**:
  ```bash
  uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
  ```
- **Terminal 2 (Frontend)**:
  ```bash
  cd frontend
  npm run dev -- --host 127.0.0.1 --port 3000
  ```

- Local App: **http://127.0.0.1:3000**
- Local API Docs: **http://127.0.0.1:8000/docs**

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><strong>Is the AI replacing human managers?</strong></summary>
<p>No, absolutely not! The AI acts as a 24/7 teaching assistant. It takes care of the repetitive first-pass checks (catching missing requirements, code structure issues, basic mistakes). The human manager retains 100% authority to approve, request revisions, or override any score.</p>
</details>

<details>
<summary><strong>What file formats can an employee submit?</strong></summary>
<p>The system accepts PDF documents, Word (.docx) files, plain text, Markdown (.md), GitHub repository links, and full ZIP code archives containing multi-file projects.</p>
</details>

<details>
<summary><strong>How does the continuous reminder loop work?</strong></summary>
<p>When a submission needs revision or is pending near its deadline, the system automatically scans open tasks and sends repeated Email & SMS notifications until the milestone reaches an Approved status.</p>
</details>

<details>
<summary><strong>Can this be adapted for corporate onboarding beyond internships?</strong></summary>
<p>Yes! MentorAI can easily be configured for new employee onboarding, bootcamp training programs, vendor compliance reviews, or university capstone project evaluations.</p>
</details>

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
