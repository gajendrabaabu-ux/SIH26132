# AgriLink360 — Smart Market & Trade Intelligence

SIH 2026 · PS #26132 — Strengthening market linkages and price discovery for farmers
Pilot scope: **Onion · Nashik (Lasalgaon), Maharashtra**

## Structure

```
agrilink360/
├── backend/       Node.js + Express REST API (main app server)
├── ai-service/    Python + FastAPI (price forecasting + buyer matching)
├── frontend/      React (Vite) PWA
└── db/            PostgreSQL + PostGIS schema
```

## Why this split

- **backend** owns auth, business logic, and orchestration — it's what the frontend talks to.
- **ai-service** is a separate microservice so forecasting/ranking logic can evolve
  independently and be tested/tuned without touching the main app. The backend calls it
  over HTTP internally; the frontend never calls it directly.
- **db** is Postgres + PostGIS because buyer/logistics matching needs real distance
  queries (nearest buyer, nearest storage), not just text fields.

## Getting started (in order)

1. **Database first.** Create a Postgres DB, enable PostGIS, run `db/schema.sql`.
2. **ai-service second.** It has no dependency on the backend — bring it up and hit
   `/predict-price` and `/match-buyers` directly to confirm it works standalone.
3. **backend third.** Point it at your DB and at the ai-service URL via `.env`.
4. **frontend last.** Point it at the backend API URL.

See each folder's own notes below for exact run commands.

### backend
```
cd backend
cp .env.example .env      # fill in DB + AI service URL
npm install
npm run dev                # http://localhost:4000
```

### ai-service
```
cd ai-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### frontend
```
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

## Next after this scaffold

- Seed `db/schema.sql` tables with real Nashik onion price history pulled from the
  data.gov.in mandi-price API, plus mock buyers/logistics.
- Fill in the stub logic in `ai-service/main.py` (currently returns a plausible mock
  response so the frontend has something real to render against while the model
  itself is being built).
- Build out the frontend dashboards against the backend's `/api/lots` flow.
