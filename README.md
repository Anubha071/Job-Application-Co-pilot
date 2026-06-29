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

## 📁 Project Structure

```
├── .env.example          # Environment template
├── .gitignore
├── README.md
│
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, router registration
│   │   ├── config.py              # Environment config
│   │   ├── database.py            # SQLAlchemy engine + session
│   │   ├── dependencies.py        # JWT auth dependency
│   │   ├── constants.py           # Valid statuses
│   │   │
│   │   ├── agents/                # AI Agents (the brain)
│   │   │   ├── orchestrator.py    # Pipeline coordinator
│   │   │   ├── fit_agent.py       # Fit analysis
│   │   │   ├── resume_agent.py    # Resume rewrite
│   │   │   ├── cover_agent.py     # Cover letter
│   │   │   ├── interview_agent.py # Interview Q&A
│   │   │   ├── ats_score.py       # ATS scoring
│   │   │   ├── voice_interview_agent.py  # 🆕 Voice mock interview
│   │   │   └── salary_agent.py           # 🆕 Salary coach
│   │   │
│   │   ├── models/               # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── application.py
│   │   │   ├── draft.py
│   │   │   └── revision.py
│   │   │
│   │   ├── routes/               # API endpoints
│   │   │   ├── auth.py           # Login/register
│   │   │   ├── application.py    # CRUD applications + pipeline trigger
│   │   │   ├── regenerate.py     # Regenerate + diff
│   │   │   ├── downloads.py      # DOCX/PDF downloads
│   │   │   ├── revision.py       # Revision history
│   │   │   ├── voice_interview.py    # 🆕 Voice interview endpoints
│   │   │   ├── salary_coach.py       # 🆕 Salary coach endpoint
│   │   │   └── calendar_routes.py    # 🆕 Calendar/ICS endpoint
│   │   │
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── services/             # PDF parsing, Groq client, diff, docs
│   │   └── utils/                # Auth helpers
│   │
│   └── generated/                # Downloaded files (created at runtime)
│
└── frontend/
    ├── css/style.css             # Full theme (gradients, animations, responsive)
    ├── html/
    │   ├── login.html            # Gradient auth page
    │   ├── register.html         # Green accent auth page
    │   ├── dashboard.html        # Stats cards + app list
    │   ├── application.html      # Detail view with all artifacts
    │   ├── create-application.html # Upload form
    │   ├── revision.html         # Diff history
    │   ├── voice-interview.html  # 🆕 Voice practice
    │   ├── salary-coach.html     # 🆕 Negotiation coach
    │   └── calendar.html         # 🆕 Calendar reminders
    └── js/
        ├── login.js, register.js, dashboard.js, application.js
        ├── create-application.js, revision.js
        ├── voice-interview.js    # 🆕 Speech-to-text + scoring
        ├── salary-coach.js       # 🆕 Advice generation
        └── calendar.js           # 🆕 ICS download + status
```

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


