# vAIdyam Backend — FastAPI

AI-Powered Multilingual Healthcare Guidance Platform

---

## 📁 Project Structure

```
vaidyam-backend/
├── main.py                  ← App entry point, run this
├── config.py                ← Supabase connection & env vars
├── requirements.txt         ← All dependencies
├── .env.example             ← Copy to .env and fill values
├── routers/
│   ├── users.py             ← User CRUD endpoints
│   ├── doctors.py           ← Doctor CRUD + search endpoints
│   └── reports.py           ← Report upload, OCR, AI analysis
├── services/
│   ├── ai_service.py        ← AI analysis (OpenAI/Gemini) + symptom map
│   └── ocr_service.py       ← PDF & image text extraction
├── models/
│   └── schemas.py           ← Pydantic models for all tables
├── utils/
│   └── helpers.py           ← Utility functions
└── uploads/                 ← Temp folder for uploaded files
```

---

## ⚡ Quick Setup

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Create .env file
```bash
cp .env.example .env
# Open .env and add your Supabase URL and Key
```

### 3. Run the server
```bash
python main.py
# OR
uvicorn main:app --reload
```

### 4. Open API docs
```
http://localhost:8000/docs
```

---

## 🗄️ Supabase Tables Required

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  phone      TEXT,
  language   TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE doctors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT,
  specialist_type TEXT,
  location        TEXT,
  phone           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  file_url   TEXT,
  ocr_text   TEXT,
  ai_result  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📡 API Endpoints

### Users
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/users/ | Get all users |
| GET | /api/users/{id} | Get one user |
| GET | /api/users/{id}/reports | Get all reports of a user |
| POST | /api/users/ | Create user |
| PUT | /api/users/{id} | Update user |
| DELETE | /api/users/{id} | Delete user |

### Doctors
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/doctors/ | Get all doctors |
| GET | /api/doctors/?specialist=X | Filter by specialist |
| GET | /api/doctors/?location=X | Filter by location |
| GET | /api/doctors/specialists/list | Get all specialist types |
| GET | /api/doctors/search/{name} | Search by name |
| GET | /api/doctors/{id} | Get one doctor |
| POST | /api/doctors/ | Add doctor |
| PUT | /api/doctors/{id} | Update doctor |
| DELETE | /api/doctors/{id} | Delete doctor |

### Reports
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/reports/upload/{user_id} | Upload PDF/image |
| GET | /api/reports/{id} | Get one report + AI result |
| GET | /api/reports/user/{user_id} | Get all reports of a user |
| POST | /api/reports/symptoms/check | Get specialist from symptoms |
| POST | /api/reports/emergency/check | Check text for critical values |
| DELETE | /api/reports/{id} | Delete report |

---

## 🤖 Adding AI (when team decides)

Open `services/ai_service.py` and uncomment either:

**OpenAI:**
```bash
pip install openai
# Add OPENAI_API_KEY to .env
# Uncomment Option A in ai_service.py
```

**Gemini:**
```bash
pip install google-generativeai
# Add GEMINI_API_KEY to .env
# Uncomment Option B in ai_service.py
```

---

## 🚨 Emergency Detection

Works without any AI. Automatically detects critical values like:
- Blood Sugar > 400 or < 50 mg/dL
- Hemoglobin < 5 g/dL
- Oxygen (SpO2) < 88%
- And more...

---

## 📤 Report Upload Flow

1. Frontend sends file to `POST /api/reports/upload/{user_id}`
2. Backend saves file → creates DB record → starts background task
3. Backend responds immediately with `report_id`
4. Frontend polls `GET /api/reports/{report_id}` every 5 seconds
5. When `ai_result` is not "Processing...", analysis is done

---

## 🌐 Frontend Connection

Set in your frontend `.env`:
```
VITE_API_URL=http://localhost:8000
```

Test all endpoints at:
```
http://localhost:8000/docs
```
