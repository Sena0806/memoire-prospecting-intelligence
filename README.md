# Mémoire — Prospecting Intelligence

**Hackathon Centrale Nantes · Once Upon Agentic AI · Track 4**

Mémoire automates B2B prospecting for Junior-Enterprises (JEs): it searches for French companies via a public government API, generates personalised outreach emails using Amazon Bedrock, and preserves institutional knowledge across yearly team rotations in Google Sheets.

---

## Architecture

```
Frontend (React + Vite)          Backend (FastAPI)
┌──────────────────────┐         ┌──────────────────────────────────────┐
│  Campaign wizard     │ ──────► │  POST /api/run-campaign              │
│  Pipeline (table)    │         │    → recherche-entreprises.api.gouv.fr│
│  Memory (history)    │         │    → Amazon Bedrock (Claude 3.5)     │
│  Settings            │         │  POST /api/send-email  (Resend)      │
└──────────────────────┘         │  GET/POST /api/memories (Sheets)     │
                                 └──────────────────────────────────────┘
```

**AWS service used:** Amazon Bedrock — `anthropic.claude-3-5-sonnet-20241022-v2:0` (us-west-2)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Bun (or npm) | latest |
| Python | 3.10–3.13 |
| pip / venv | standard library |

---

## Quick Start (local)

### 1. Clone

```bash
git clone <repo-url>
cd m-moire-prospecting-intelligence
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in .env — see the Environment Variables section below
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend

```bash
# from the project root
bun install        # or: npm install
bun run dev        # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# AWS — get these from AWS Console → IAM or Workshop Studio
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=          # required for Workshop Studio temporary credentials
AWS_DEFAULT_REGION=us-west-2

# Resend — https://resend.com (free tier works)
RESEND_API_KEY=

# Google Sheets — optional, enables persistent Memory tab
# 1. Create a service account in Google Cloud Console
# 2. Enable the Sheets API
# 3. Grant the service account Editor access to your spreadsheet
# 4. Download the JSON key and paste its full contents here
GOOGLE_SHEETS_ID=           # the part between /d/ and / in the spreadsheet URL
GOOGLE_SERVICE_ACCOUNT_JSON=  # {"type":"service_account","project_id":"..."}
```

> **Without Google Sheets:** the Memory tab displays demo data — the app still works fully for campaigning and email sending.

---

## Deployment

### Frontend — Vercel

1. Push the project root to GitHub.
2. Import the repository in [vercel.com](https://vercel.com).
3. Set **Root Directory** to `m-moire-prospecting-intelligence`.
4. Set **Build Command** to `bun run build` (or `npm run build`).
5. Set **Output Directory** to `dist`.
6. Add the environment variable:
   ```
   VITE_API_BASE_URL=https://<your-backend-url>
   ```

### Backend — Railway

1. In [railway.app](https://railway.app), create a new project → Deploy from GitHub.
2. Point Railway to the `m-moire-prospecting-intelligence/backend` folder.
3. Set the **Start Command**:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Add all environment variables from `backend/.env.example` in the Railway dashboard.

---

## Testing on a Friend's Computer

1. **Backend** must be running (locally or deployed). Share the URL.
2. **Frontend** must be running (locally or deployed). Share the URL.
3. Open the app → go to **Settings** tab:
   - Set **API URL** to the backend URL (e.g. `http://localhost:8000`)
   - Set **From email** to a Resend-verified address
   - Set **Demo redirect** to an email you control (all outgoing mail is re-routed here so no real companies are contacted)
   - Click **Tester la connexion** — should show a green confirmation
4. Go to **Nouvelle campagne** → fill in sector, area, number of prospects → **Lancer**.
5. Go to **Pipeline** → review generated emails → click **Approuver et Envoyer**.
6. Check the demo redirect inbox for the email.

---

## Key Features

| Feature | Implementation |
|---------|---------------|
| French company search | `recherche-entreprises.api.gouv.fr` (no API key required) |
| Personalised email generation | Amazon Bedrock — Claude 3.5 Sonnet |
| Email sending with demo redirect | Resend API |
| Persistent memory across team rotations | Google Sheets via service account |
| Offline / demo fallback | Rich demo data shown when Sheets is not configured |

---

## Project Structure

```
m-moire-prospecting-intelligence/
├── backend/
│   ├── main.py              # FastAPI app — all routes
│   ├── requirements.txt
│   └── .env.example
└── src/
    ├── components/memoire/  # All UI components
    │   ├── MemoireApp.tsx   # Root state + layout
    │   ├── tabs/            # Campaign, Pipeline, Memory, Settings
    │   └── ...
    ├── hooks/               # useCountUp
    ├── lib/api.ts           # Frontend API client
    └── styles.css           # Design tokens + animations
```
