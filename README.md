# 🚀 Job Application Co-Pilot

> **Turn your resume + a job description into a tailored application kit in minutes.**

A multi-agent AI system that analyzes your fit, rewrites your resume, drafts a cover letter, prepares interview questions, scores your ATS compatibility, coaches salary negotiation, and runs voice mock interviews — all powered by Groq LLM.

---

## ✨ Features

### Core Pipeline
| Feature | Description |
|---------|-------------|
| 📊 **Fit Analysis** | Match score, matching/missing skills, strengths, weaknesses, ATS keywords |
| 📝 **Resume Rewrite** | Sharper bullets, JD keywords woven in, same role list, ATS-optimized |
| ✉️ **Cover Letter** | One-page professional draft, tone-matched to the company |
| 🎯 **Interview Pack** | 10 likely questions + STAR-format sample answers |
| 📊 **ATS Score** | 0-100 score with missing keywords, strengths, and suggestions |

### Bonus Tools 🆕
| Feature | Description |
|---------|-------------|
| 🎤 **Voice Mock Interview** | Browser speech-to-text, AI evaluates your answer with score + feedback + model answer |
| 💰 **Salary Negotiation Coach** | Market context, email/phone/counter-offer scripts, talking points, strategy tips |
| 📅 **Calendar Integration** | Generate .ics files for follow-up reminders, status-based advice |

### General
- 🔐 JWT-based authentication (register/login)
- 📂 Manage a pipeline of roles (dashboard with stats cards)
- 🔄 Regenerate individual sections without rerunning the full pipeline
- 📜 Revision history with side-by-side diff view
- 📥 Download resume as DOCX or PDF, cover letter as DOCX
- 🗑️ Animated delete confirmation modal
- 🎨 Modern, colorful UI with gradients, cards, animations

---

## 🏗 Architecture

```
                  ┌─────────────────────┐
                  │   Frontend (HTML+JS) │
                  │   fetch() → FastAPI  │
                  └─────────┬───────────┘
                            │
                  ┌─────────▼───────────┐
                  │   FastAPI (JWT Auth) │
                  │   SQLite + SQLAlchemy│
                  └─────────┬───────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │        Multi-Agent Pipeline        │
          │  (Orchestrator → 5 agents)         │
          └─────────────────┬─────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │         Groq llama-3.3-70b        │
          └───────────────────────────────────┘
```

### Agents
| Agent | File | Function |
|-------|------|----------|
| 🧠 **Orchestrator** | `agents/orchestrator.py` | Coordinates all agents, collects outputs |
| 🔍 **Fit Analyst** | `agents/fit_agent.py` | Resume vs JD gap analysis |
| ✏️ **Resume Writer** | `agents/resume_agent.py` | Rewrites resume with JD keywords |
| 📧 **Cover Letter Writer** | `agents/cover_agent.py` | Professional cover letter draft |
| 🗣 **Interviewer** | `agents/interview_agent.py` | 10 questions with STAR answers |
| 📊 **ATS Scorer** | `agents/ats_score.py` | Scores 0-100, returns JSON |
| 🎤 **Voice Interview** | `agents/voice_interview_agent.py` | Generates questions + evaluates spoken answers |
| 💰 **Salary Coach** | `agents/salary_agent.py` | Negotiation scripts, market context, strategy |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- [Groq API key](https://console.groq.com) (free tier available)

### 1. Clone & Setup
```bash
git clone <repo-url>
cd "Job Application Co-Pilot"
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your Groq API key:
```bash
cp .env.example .env
```

Edit `.env`:
```env
SECRET_KEY=your_random_secret_key_here
GROQ_API_KEY=gsk_your_groq_api_key_here
DATABASE_URL=sqlite:///./jobcopilot.db
```

### 3. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Run the Server
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

### 5. Open the App
Navigate to `http://localhost:8000/static/html/login.html` in your browser.

> **Note**: For Voice Interview features, use **Chrome or Edge** (Web Speech API required).

---

## 🗺 User Flow

```
1. Register / Login
       │
2. Upload Resume (PDF) + Paste Job Description (or URL)
       │
3. AI Pipeline Runs in Background:
   ├── Fit Analysis
   ├── Resume Rewrite
   ├── Cover Letter
   ├── Interview Pack
   └── ATS Score
       │
4. View Results on Application Detail Page
   ├── Regenerate individual sections
   ├── View diff (old vs new resume)
   └── Download DOCX/PDF
       │
5. Explore Bonus Tools:
   ├── 🎤 Voice Interview Practice
   ├── 💰 Salary Negotiation Coach
   └── 📅 Calendar Follow-up Reminders
```

---

# 🏗️ Job Application Co-Pilot - Architecture & Flow

## 📁 Project Structure

```
Job Application Co-Pilot/
│
├── .env.example          # Environment template
├── .gitignore
├── LICENSE
├── README.md             # Project overview
│
└── backend/                        # ← Main application directory
    │
    ├── requirements.txt            # Python dependencies
    │
    ├── app/                        # ← Backend core
    │   │
    │   ├── main.py                 # FastAPI app entry, CORS, router registration
    │   ├── config.py               # Environment configuration (.env loading)
    │   ├── constants.py            # Application constants
    │   ├── database.py             # SQLAlchemy engine + session + ensure_sqlite_schema()
    │   ├── dependencies.py         # JWT auth dependency for protected routes
    │   │
    │   ├── agents/                 # ← AI Multi-Agent Pipeline
    │   │   ├── orchestrator.py    # Coordinates all agents, collects outputs
    │   │   ├── fit_agent.py       # Resume vs JD fit analysis
    │   │   ├── resume_agent.py    # Rewrites resume with JD keywords
    │   │   ├── cover_agent.py     # Generates cover letter
    │   │   ├── interview_agent.py # Generates interview Q&A pack
    │   │   ├── ats_score.py       # ATS compatibility scoring
    │   │   ├── voice_interview_agent.py  # Voice interview question generator/evaluator
    │   │   └── salary_agent.py           # Salary negotiation coach
    │   │
    │   ├── models/                 # ← SQLAlchemy ORM Models
    │   │   ├── user.py            # User model (email, hashed_password)
    │   │   ├── application.py     # Application model (JD, status)
    │   │   ├── draft.py           # Draft model (AI-generated artifacts)
    │   │   └── revision.py        # Revision model (diff history)
    │   │
    │   ├── schemas/                # ← Pydantic Schemas
    │   │   ├── auth.py            # Register/Login schemas
    │   │   ├── application.py     # Application CRUD schemas
    │   │   ├── draft.py           # Draft schemas
    │   │   └── status.py          # Status enum schemas
    │   │
    │   ├── routes/                 # ← API Routes (FastAPI routers)
    │   │   ├── auth.py            # POST /auth/register, /auth/login
    │   │   ├── application.py     # Application CRUD + pipeline trigger
    │   │   ├── regenerate.py      # Regenerate individual sections
    │   │   ├── downloads.py       # DOCX/PDF download endpoints
    │   │   ├── revision.py        # Revision history endpoints
    │   │   ├── voice_interview.py # 🆕 Voice interview endpoints
    │   │   ├── salary_coach.py    # 🆕 Salary coach endpoints
    │   │   └── calendar_routes.py # 🆕 Calendar/ICS endpoints
    │   │
    │   └── services/               # ← Business Logic & External APIs
    │       ├── groq_client.py     # Groq LLM API client
    │       ├── pdf_parser.py      # Extract text from PDF resumes
    │       ├── pdf_generator.py   # Generate PDF resumes
    │       ├── doc_generator.py   # Generate DOCX files
    │       ├── diff_services.py   # Generate resume diff (old vs new)
    │       ├── calendar_helper.py # ICS file generation
    │       └── jd_scraper.py      # Job description URL scraper
    │
    ├── frontend/                  # ← Frontend (Served by FastAPI StaticFiles)
    │   │
    │   ├── css/
    │   │   └── style.css          # Theme, gradients, animations, responsive
    │   │
    │   ├── html/                  # ← Pages (Served at /static/html/*)
    │   │   ├── login.html         # Login page (gradient auth)
    │   │   ├── register.html      # Register page
    │   │   ├── dashboard.html     # Dashboard (stats cards + app list)
    │   │   ├── create-application.html  # Upload resume + JD
    │   │   ├── application.html   # Detail view with AI artifacts
    │   │   ├── revision.html      # Revision diff history
    │   │   ├── voice-interview.html # 🆕 Voice mock interview
    │   │   ├── salary-coach.html  # 🆕 Negotiation coach
    │   │   └── calendar.html      # 🆕 Calendar reminders
    │   │
    │   └── js/                    # ← Client-side Logic (fetch API)
    │       ├── config.js          # API base URL, constants
    │       ├── login.js           # Login form handling
    │       ├── register.js        # Registration form handling
    │       ├── dashboard.js       # Dashboard stats + app list
    │       ├── create-application.js  # File upload + JD input
    │       ├── application.js     # Fetch + display AI artifacts
    │       ├── revision.js        # Revision history viewer
    │       ├── voice-interview.js # 🆕 Speech-to-text + evaluation
    │       ├── salary-coach.js    # 🆕 Generate negotiation advice
    │       └── calendar.js        # 🆕 ICS generation + status
    │
    ├── uploads/                  # ← Uploaded files (created at runtime)
    │   └── *.pdf                 # User-uploaded resumes
    │
    └── generated/                # ← Generated files (created at runtime)
        └── *.pdf, *.docx        # Generated resumes/cover letters
```

---

## 🔄 Application Flow

### 1. Authentication Flow

```
┌─────────────┐                     ┌─────────────┐
│   Browser   │                     │   FastAPI   │
│  (Frontend) │                     │   Backend   │
└──────┬──────┘                     └──────┬──────┘
       │                                   │
  1. GET /static/html/login.html         │
     ─────────────────────────────────────►
       │                                   │ 2. Return login.html
       │ ◄─────────────────────────────────
       │                                   │
  3. User enters credentials             │
     POST /auth/login                    │
     {email, password}                   │
       │                                   │
     ─────────────────────────────────────► 4. Verify credentials
       │                                   │     Generate JWT
       │ ◄───────────────────────────────── 5. Return {access_token, token_type}
       │                                   │
  6. Store token in localStorage         │
       │                                   │
  7. All subsequent requests include     │
     Authorization: Bearer <token>       │
```

### 2. Application Creation Flow

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Browser   │─(1)──►│   FastAPI   │─(2)──►│   Groq API  │
│  (Frontend) │       │   Backend   │       │   (LLM)     │
└──────┬──────┘       └──────┬──────┘       └─────────────┘
       │                      │
  1a. POST /applications     │
      FormData:              │
      - resume (PDF)         │
      - jd (text/URL)        │
       │                      │
       │              2a. Parse PDF (pdf_parser.py)
       │              2b. Scrape JD if URL (jd_scraper.py)
       │              2c. Store Application + Draft in DB
       │              2d. Trigger Orchestrator
       │                      │
       │              3. Orchestrator coordinates agents:
       │                 ├── Fit Analyst    → Fit analysis JSON
       │                 ├── Resume Writer  → Rewritten resume text
       │                 ├── Cover Writer   → Cover letter
       │                 ├── Interviewer    → Q&A pack
       │                 └── ATS Scorer     → ATS score JSON
       │                      │
       │                      │ 4. Update Draft with results
       │                      │
  1b. Return {id, status}     │
  ◄───────────────────────────
       │
  5. Frontend polls or refreshes
     GET /applications/{id}
       │
     ─────────────────────────────►
       │
  6. Return full application
     with all AI artifacts
     ◄─────────────────────────────
```

### 3. Regenerate Individual Section Flow

```
User on Application Detail Page
       │
       │ Clicks "Regenerate Resume"
       ▼
POST /drafts/{draft_id}/regenerate-resume
       │
       ▼
Backend:
  1. Load original draft
  2. Call resume_agent with new prompt
  3. Store new output in Revision table
  4. Update Draft with new content
  5. Return updated draft
       │
       ▼
Frontend:
  1. Update UI with new content
  2. Show revision in history
```

### 4. Voice Interview Flow

```
┌─────────────┐                     ┌─────────────┐
│   Browser   │                     │   FastAPI   │
│  (Web Speech│                     │   Backend   │
│     API)    │                     │             │
└──────┬──────┘                     └──────┬──────┘
       │                                   │
  1. Start session                        │
     POST /voice-interview/start-session  │
       │                                   │
       ─────────────────────────────────────►
       │                                   │ 2. Generate initial question
       │ ◄───────────────────────────────── 3. Return {session_id, question}
       │                                   │
  4. User speaks answer into microphone   │
     Browser converts speech → text       │
       │                                   │
  5. Submit answer                         │
     POST /voice-interview/evaluate-answer│
     {session_id, transcript}             │
       │                                   │
       ─────────────────────────────────────► 6. Evaluate with LLM
       │ ◄───────────────────────────────── 7. Return {score, feedback, model_answer}
       │                                   │
  8. Display score + feedback             │
```

### 5. Salary Coach Flow

```
User opens Salary Coach page
       │
       │ GET request loads page
       ▼
Frontend displays form (role, company, experience, etc.)
       │
       │ User fills form and submits
       ▼
POST /salary-coach/generate
  {role, company, location, experience, ...}
       │
       ▼
Backend:
  1. Build prompt with user's context
  2. Call salary_agent with Groq
  3. Generate scripts (email/phone/counter)
  4. Return negotiation advice
       │
       ▼
Frontend:
  1. Display script in tabbed view
  2. Copy-to-clipboard buttons
```

### 6. Calendar Follow-up Flow

```
User views application on dashboard
       │
       │ Clicks "Set Reminder"
       ▼
POST /calendar/generate-ics
  {application_id, follow_up_date, notes}
       │
       ▼
Backend:
  1. Validate application exists
  2. Generate .ics file
  3. Return file download
       │
       ▼
Frontend:
  1. Trigger browser download
  2. User opens in Calendar app

GET /calendar/follow-up-status/{app_id}
  → Returns days since applied, recommended follow-up timing
```

---

## 🏛️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML + CSS + JS)                │
│                   Served via FastAPI StaticFiles            │
│                   At: /static/html/*, /static/js/*          │
│                                                             │
│  Pages: Login, Register, Dashboard, Application Detail,     │
│         Create Application, Revision, Voice Interview,      │
│         Salary Coach, Calendar                              │
│                                                             │
│  Communication: fetch() API calls with JWT in headers      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/JSON
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    BACKEND (FastAPI)                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Routes/   │  │  Schemas/   │  │ Services/   │        │
│  │ API Endpoints│  │ Validation  │  │ Business    │        │
│  │             │  │ (Pydantic)  │  │ Logic       │        │
│  └──────┬──────┘  └─────────────┘  └──────┬──────┘        │
│         │                                  │                │
│  ┌──────▼──────────────────────────────────▼──────┐        │
│  │              Models + Database                  │        │
│  │   SQLAlchemy ORM + SQLite (jobcopilot.db)       │        │
│  └─────────────────────────────────────────────────┘        │
│                                                             │
│  Middleware: CORS, JWT Auth, Request Logging                │
│  Static Files: Serves frontend/ directory                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ API calls
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    AI AGENTS PIPELINE                        │
│              (Multi-Agent Orchestration)                     │
│                                                             │
│  ┌─────────────┐                                            │
│  │ Orchestrator│  Coordinates the pipeline                  │
│  └──────┬──────┘                                            │
│         │                                                    │
│    ┌────┴────┬────┬────┬────┐                               │
│    ▼         ▼    ▼    ▼    ▼                                │
│  Fit      Resume Cover Interview ATS                        │
│  Analyst   Writer  Letter   Pack  Scorer                    │
│    │         │      │       │      │                        │
│    └─────────┴──────┴───────┴──────┘                        │
│              │                                              │
│              ▼                                              │
│        Collect all outputs into Draft                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ LLM requests
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    GROQ LLM API                              │
│               llama-3.3-70b-versatile                        │
│                                                             │
│  All AI-generated content flows through Groq                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Architecture

### JWT Authentication
```
1. User submits credentials → POST /auth/login
2. Backend verifies (Argon2 hash comparison)
3. Backend generates JWT with:
   - sub: user email
   - exp: expiration timestamp
4. Frontend stores token in localStorage
5. All subsequent requests include:
   Authorization: Bearer <token>
6. dependencies.py validates token via OAuth2PasswordBearer
7. Protected routes require valid token
```

### Data Protection
- **Passwords**: Argon2 hashing (no plaintext storage)
- **Tokens**: HS256 algorithm, configurable expiration
- **CORS**: Configurable origins, allows credentials
- **Database**: SQLite with SQLAlchemy ORM

---

## 🗄️ Database Entities

```
User (1) ──────< (N) Application (1) ──────< (N) Draft
                                                      │
                                                  (1) ───< (N) Revision
```

| Entity | Key Fields |
|--------|-----------|
| **User** | id, email, hashed_password, created_at |
| **Application** | id, user_id, company, role, jd_text, status, created_at |
| **Draft** | id, application_id, resume_text, cover_letter, fit_analysis, interview_pack, ats_score, created_at |
| **Revision** | id, draft_id, content_type, old_content, new_content, created_at |

---

## 📊 Data Flow Summary

```
User Action (Frontend)
    │
    ├─► Register/Login → JWT Token stored
    │
    ├─► Create Application
    │   ├─► Upload Resume PDF
    │   ├─► Paste JD / JD URL
    │   └─► POST /applications
    │       └─► Backend stores in DB
    │           └─► Triggers AI Pipeline
    │               └─► Orchestrator → Agents → Groq
    │                   └─► Results stored as Draft
    │
    ├─► View Dashboard
    │   └─► GET /applications
    │       └─► Shows stats cards + list
    │
    ├─► View Application Detail
    │   └─► GET /applications/{id}
    │       └─► Shows all AI artifacts
    │
    ├─► Regenerate Section
    │   └─► POST /drafts/{id}/regenerate-{section}
    │       └─► New revision stored
    │
    ├─► Download Files
    │   └─► GET /downloads/{type}/{id}
    │       └─► Returns DOCX/PDF
    │
    ├─► Voice Interview
    │   └─► POST /voice-interview/{action}
    │       └─► Speech + AI evaluation
    │
    ├─► Salary Coach
    │   └─► POST /salary-coach/generate
    │       └─► Negotiation scripts
    │
    └─► Calendar
        └─► POST /calendar/generate-ics
            └─► .ics file download
```

---

## 🚀 Deployment Notes

### Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Access
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
# App: http://localhost:8000/static/html/login.html
```

### Directory Permissions
- `backend/uploads/` must be writable (PDF uploads)
- `backend/generated/` must be writable (generated files)
- `backend/jobcopilot.db` created automatically by SQLAlchemy

---

## 🔧 Key Technologies

| Component | Technology |
|-----------|-----------|
| **Frontend** | Vanilla HTML, CSS, JavaScript (fetch API) |
| **Backend** | FastAPI, Python 3.10+ |
| **Database** | SQLite + SQLAlchemy ORM |
| **Auth** | JWT (python-jose) + Argon2 |
| **AI/LLM** | Groq API (llama-3.3-70b-versatile) |
| **PDF** | pypdf (parse) + reportlab (generate) |
| **DOCX** | python-docx |
| **Voice** | Web Speech API (browser native) |
| **Calendar** | icalendar (ICS generation) |

---


## 🧪 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login, returns JWT |
| `POST` | `/applications` | Create application (multipart: resume + JD) |
| `GET` | `/applications` | List user's applications |
| `GET` | `/applications/{id}` | Get application with all drafts |
| `PATCH` | `/applications/{id}/status` | Update status |
| `DELETE` | `/applications/{id}` | Delete application + drafts |
| `POST` | `/drafts/{id}/regenerate-resume` | Regenerate resume section |
| `POST` | `/drafts/{id}/regenerate-fit` | Regenerate fit analysis |
| `POST` | `/drafts/{id}/regenerate-cover` | Regenerate cover letter |
| `POST` | `/drafts/{id}/regenerate-interview` | Regenerate interview pack |
| `GET` | `/drafts/{id}/diff` | Get resume diff (old vs new) |
| `GET` | `/drafts/{id}/ats` | Get ATS score |
| `GET` | `/revisions/draft/{id}` | List revision history |
| `GET` | `/downloads/resume-docx/{id}` | Download resume as DOCX |
| `GET` | `/downloads/resume-pdf/{id}` | Download resume as PDF |
| `GET` | `/downloads/cover-docx/{id}` | Download cover letter as DOCX |

### 🆕 New Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/voice-interview/start-session` | Start a voice interview session |
| `POST` | `/voice-interview/generate-question` | Generate an interview question |
| `POST` | `/voice-interview/evaluate-answer` | Evaluate a spoken answer |
| `POST` | `/salary-coach/generate` | Generate negotiation advice |
| `POST` | `/calendar/generate-ics` | Download .ics follow-up reminder |
| `GET` | `/calendar/follow-up-status/{id}` | Check follow-up status |

---

## 🎨 Frontend Design

The UI features a modern, colorful design with:
- **Purple gradient sidebar** with brand logo, nav labels, active state indicator
- **Stats cards** with colored top gradients (purple, blue, green, pink)
- **Card-based layout** with hover shadows and animations
- **Gradient buttons** (primary purple, danger pink)
- **Status badges** with dot indicators and soft backgrounds
- **ATS score circle** (green ≥70, yellow ≥40, red <40)
- **Voice interview** with recording pulse animation, score circle, feedback grid
- **Salary coach** with tabbed scripts and copy-to-clipboard
- **Delete confirmation modal** with backdrop blur and slide-up animation
- **Toast notifications** for success/error feedback
- **Fully responsive** for mobile devices

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML, CSS, JavaScript (fetch API) |
| **Backend** | Python, FastAPI, SQLAlchemy, SQLite |
| **AI/LLM** | Groq API (llama-3.3-70b-versatile) |
| **Auth** | JWT (python-jose) + Argon2 password hashing |
| **PDF** | pypdf (parse) + reportlab (generate) |
| **DOCX** | python-docx |
| **Web Speech** | Browser SpeechRecognition API (voice interview) |
| **Calendar** | icalendar (.ics file generation) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

# 👨‍💻 Author

**Anubha Sharma**

# 📄 License

This project is licensed under the MIT License.

---

# ⭐ Acknowledgements

- FastAPI
- SQLAlchemy
- Groq
- Uvicorn
- HTML/CSS/JavaScript

---

If you find this project useful, consider giving it a ⭐ on GitHub.


