# AIVOA — AI-Powered Customer Complaint Management

A full-stack pharmaceutical QMS complaint module based on the supplied assignment brief and demo. It covers complaint intake, AI-assisted extraction, triage, complaint tracking, risk assessment, investigation support, duplicate detection, root-cause ideas, CAPA recommendations, and an auditable activity timeline.

## Stack

- Frontend: React 19, Redux Toolkit, TypeScript, Inter, responsive CSS
- Backend: Python, FastAPI, SQLAlchemy, Pydantic
- AI orchestration: LangGraph with Groq `gemma2-9b-it`
- Data: SQLite for zero-config local use; PostgreSQL through Docker Compose

## Quick demo

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. The UI includes realistic demo data and runs without an API key.

Try this flow:

1. Click **New complaint**.
2. Click **Use sample complaint email** and watch AI populate the intake form.
3. Save the complaint.
4. On its detail page, click **Run AI analysis**.
5. Try the six AI tools in the analysis drawer.

## Run the FastAPI backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

API docs: `http://localhost:8000/docs`

Without `GROQ_API_KEY`, the LangGraph workflow returns deterministic, explainable demo output. Add a Groq key to `backend/.env` to use the configured model.

## PostgreSQL option

```powershell
$env:GROQ_API_KEY="your-key"
docker compose up --build
```

## Architecture

```text
React UI → Redux complaint state → FastAPI REST API → SQLAlchemy → SQLite/PostgreSQL
                                  ↘ LangGraph agent → Groq / safe local fallback
```

The AI layer deliberately separates orchestration from UI and database code. Each AI capability uses the same complaint evidence state, which makes it easy to add human approval nodes, validation gates, or specialist agents later.

## Main API endpoints

- `GET /health`
- `GET /api/complaints`
- `POST /api/complaints`
- `GET /api/complaints/{id}`
- `POST /api/complaints/{id}/analyze`
- `POST /api/intake/extract`

## Production notes

For production, add authentication/RBAC, immutable audit trails, e-signatures, validated OCR, malware scanning, encrypted object storage, migrations, model-output evaluation, observability, and GxP validation controls. AI output should remain decision support and require trained quality-personnel approval.
