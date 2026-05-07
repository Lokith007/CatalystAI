# CatalystAI — MVP Production Guide
## 5-User Deployment · All Features Working · Minimal Infrastructure

---

> [!NOTE]
> **Scope:** This guide targets a working MVP for ~5 users. No heavy infrastructure (Redis, Celery, Docker, S3, PostgreSQL). SQLite is the database. The discovery pipeline uses deterministic/mock logic (not real ML). The goal is: **every button, form, and visualization works end-to-end through the backend API.**

---

## 1. Current State Audit

| Layer | Current | MVP Goal |
|-------|---------|----------|
| Data | Hardcoded arrays in `mockDiscovery.ts` | Served from SQLite via FastAPI |
| AI Pipeline | `delay()` calls simulating work | Backend pipeline (deterministic, structured for future ML swap) |
| Feedback | `void payload` — discarded | Persisted in `experiments` table, updates model confidence |
| Knowledge Graph | Hardcoded 6 nodes + 7 edges | Stored in DB, editable via API |
| Molecule Viewer | 5 random colored spheres | Keep as-is for MVP (cosmetic, not functional) |
| Pathway Flow | Hardcoded 5-node DAG | Served from discovery run results |
| Auth | None | JWT login/register (5 pre-seeded users is fine) |
| API | None — everything client-side | Full FastAPI backend with 12 endpoints |

---

## 2. MVP Architecture

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│        React + Vite (existing UI)                │
│   Swap: mock imports → fetch() to backend API    │
└──────────────────────┬──────────────────────────┘
                       │ REST (JSON)
┌──────────────────────▼──────────────────────────┐
│                 BACKEND API                      │
│              Python FastAPI + Uvicorn            │
│  ┌──────────┬───────────┬──────────────────┐    │
│  │ /catalysts│ /reactions│ /discovery/run   │    │
│  │ /candidates│/experiments│ /knowledge-graph│   │
│  │ /auth     │           │                  │    │
│  └──────────┴───────────┴──────────────────┘    │
│         │                                        │
│    ┌────▼──────────────────────┐                 │
│    │ Discovery Engine          │                 │
│    │ (deterministic pipeline)  │                 │
│    └───────────────────────────┘                 │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              SQLite (catalystai.db)               │
│         Single file · Zero config · Enough       │
│         for 5 concurrent users                   │
└─────────────────────────────────────────────────┘
```

> [!TIP]
> **What we're NOT doing for MVP:**
> - ~~PostgreSQL~~ → SQLite is plenty for 5 users
> - ~~Redis + Celery~~ → Pipeline runs synchronously (< 2s, no queue needed)
> - ~~RDKit / PyTorch~~ → Deterministic mock logic (same outputs, structured for future swap)
> - ~~S3 / MinIO~~ → No file uploads needed for MVP
> - ~~Docker~~ → Run directly with `uvicorn` + `npm run dev`
> - ~~CI/CD~~ → Manual deploy is fine at this scale

---

## 3. Backend Setup (✅ Already Done)

### 3.1 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry          ✅
│   ├── config.py               # Environment config         ✅
│   ├── database.py             # SQLAlchemy engine + session ✅
│   ├── models/                 # SQLAlchemy ORM models       ✅ (8 files)
│   ├── schemas/                # Pydantic schemas            ✅ (6 files)
│   ├── routers/                # API route handlers          ✅ (6 files)
│   └── services/               # Business logic
│       ├── auth.py             #                             ✅
│       └── discovery_engine.py # Pipeline logic              ✅
├── alembic/                    # DB migrations               ✅
├── seed.py                     # Seed data script            ✅
├── catalystai.db               # SQLite database             ✅
├── requirements.txt            #                             ✅
└── .env                        #                             ✅
```

### 3.2 MVP Dependencies (`requirements.txt`)

```
fastapi==0.115.0
uvicorn==0.32.1
sqlalchemy==2.0.36
alembic==1.14.0
pydantic==2.10.0
pydantic-settings==2.6.0
python-jose[cryptography]==3.3.0   # JWT auth
passlib[bcrypt]==1.7.4
python-multipart==0.0.12
python-dotenv==1.0.1
```

> [!NOTE]
> That's it. No torch, no rdkit, no celery, no redis, no boto3. 10 dependencies total.

---

## 4. Database Schema (✅ Already Done — SQLite)

All tables exist as SQLAlchemy ORM models backed by `catalystai.db`:

| Table | Model File | Status |
|-------|-----------|--------|
| `users` | `models/user.py` | ✅ |
| `projects` | `models/project.py` | ✅ |
| `catalysts` | `models/catalyst.py` | ✅ |
| `reactions` | `models/reaction.py` | ✅ |
| `discovery_runs` | `models/discovery_run.py` | ✅ |
| `candidates` | `models/candidate.py` | ✅ |
| `experiments` | `models/experiment.py` | ✅ |
| `kg_nodes` | `models/knowledge_graph.py` | ✅ |
| `kg_edges` | `models/knowledge_graph.py` | ✅ |

> [!TIP]
> SQLite handles 5 concurrent users with no issues. The `catalystai.db` file is auto-created on first run via `Base.metadata.create_all()` in `main.py`.

---

## 5. API Endpoints (✅ Already Done)

| Method | Endpoint | Router File | Status |
|--------|----------|-------------|--------|
| `POST` | `/api/auth/register` | `routers/auth.py` | ✅ |
| `POST` | `/api/auth/login` | `routers/auth.py` | ✅ |
| `GET` | `/api/reactions` | `routers/reactions.py` | ✅ |
| `GET` | `/api/catalysts` | `routers/catalysts.py` | ✅ |
| `POST` | `/api/discovery/run` | `routers/discovery.py` | ✅ |
| `GET` | `/api/discovery/run/{id}/status` | `routers/discovery.py` | ✅ |
| `GET` | `/api/discovery/run/{id}/result` | `routers/discovery.py` | ✅ |
| `POST` | `/api/experiments` | `routers/experiments.py` | ✅ |
| `GET` | `/api/experiments` | `routers/experiments.py` | ✅ |
| `GET` | `/api/knowledge-graph` | `routers/knowledge_graph.py` | ✅ |
| `POST` | `/api/knowledge-graph/nodes` | `routers/knowledge_graph.py` | ✅ |
| `GET` | `/api/health` | `main.py` | ✅ |

---

## 6. Frontend Migration (🔴 TODO — The Main Remaining Work)

This is the **core MVP work**. The backend is ready; the frontend still uses 100% mock data. Every item below must be completed for the MVP to be functional.

### 6.1 Migration Checklist

#### Priority 1: Core Data Flow

- [ ] **`src/api/simulateDiscovery.ts`** → Replace `delay()` + `buildMockResult()` with real API calls
  ```typescript
  // BEFORE (mock)
  export async function simulateDiscovery(input, onProgress) {
    onProgress?.("retrieval");
    await delay(900);
    onProgress?.("generation");
    await delay(800);
    onProgress?.("prediction");
    await delay(700);
    return buildMockResult(input);  // fake data
  }

  // AFTER (real API)
  const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

  export async function startDiscoveryRun(input: DiscoveryInput): Promise<string> {
    const res = await fetch(`${API}/api/discovery/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        reaction_text: input.reaction,
        temperature_c: input.temperatureC,
        pressure_bar: input.pressureBar,
        cost_weight: input.costWeight,
        sustainability: input.sustainabilityScore,
        mode: input.mode,
      }),
    });
    const { run_id } = await res.json();
    return run_id;
  }

  export async function pollRunStatus(
    runId: string,
    onProgress: (step: PipelineStep) => void
  ): Promise<DiscoveryResult> {
    while (true) {
      const res = await fetch(`${API}/api/discovery/run/${runId}/status`);
      const { status } = await res.json();
      onProgress(status);
      if (status === "complete") {
        const result = await fetch(`${API}/api/discovery/run/${runId}/result`);
        return result.json();
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }
  ```

- [ ] **`src/context/DiscoveryContext.tsx`** → Wire `runDiscovery()` to use `startDiscoveryRun` + `pollRunStatus` instead of `simulateDiscovery`

- [ ] **`src/context/DiscoveryContext.tsx`** → Wire `submitFeedback()` to call `POST /api/experiments` instead of `void payload`
  ```typescript
  // BEFORE
  const submitFeedback = useCallback((payload) => {
    void payload;  // discarded!
    const delta = 3;
    setModelConfidence((c) => Math.min(99, c + delta));
  }, []);

  // AFTER
  const submitFeedback = useCallback(async (payload) => {
    const res = await fetch(`${API}/api/experiments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setModelConfidence((c) => Math.min(99, c + 3));
    setLastFeedbackDelta(3);
  }, []);
  ```

#### Priority 2: Data-Driven Pages

- [ ] **`src/pages/KnowledgeGraphPage.tsx`** → Fetch nodes/edges from `GET /api/knowledge-graph` instead of hardcoded arrays

- [ ] **Catalysts list** → Fetch from `GET /api/catalysts` instead of hardcoded pool

- [ ] **Reactions dropdown** → Fetch from `GET /api/reactions` instead of hardcoded string

#### Priority 3: Results Display

- [ ] **Pathway visualization** → Read `pathway_steps` from the discovery run result (already returned by backend)

- [ ] **Pareto chart** → Read `pareto_points` from the discovery run result (already returned by backend)

- [ ] **Candidates table** → Display candidates from discovery run result instead of mock array

#### Priority 4: Auth (Optional for 5 users)

- [ ] **Login page** → `POST /api/auth/login` → store JWT token
- [ ] **Register page** → `POST /api/auth/register`
- [ ] **Token header** → Attach `Authorization: Bearer <token>` to all API calls
- [ ] **Or:** Skip auth entirely and seed 5 users, hardcode a token for MVP

#### Priority 5: Cleanup

- [ ] **Delete `src/lib/mockDiscovery.ts`** — no longer needed once frontend calls real API
- [ ] **Add `VITE_API_URL`** to frontend `.env` — `VITE_API_URL=http://localhost:8000`

### 6.2 Type Updates (`src/types/discovery.ts`)

Add `id` fields to match backend responses:

```typescript
// Add to existing types
interface Candidate {
  id: string;           // UUID from backend
  // ... existing fields stay the same
}

interface DiscoveryResult {
  run_id: string;       // UUID of the discovery run
  // ... existing fields stay the same
}
```

---

## 7. MVP Molecule Viewer Decision

> [!NOTE]
> The molecule viewer currently shows 5 random colored spheres. For MVP, **keep it as-is**. It's a cosmetic visualization — users understand it's illustrative. Integrating real 3Dmol.js would require SMILES data + a heavy dependency for zero functional benefit at the MVP stage.

---

## 8. Seed Data

The `seed.py` script already exists and populates:
- Catalysts with realistic names and properties
- Reactions with input/output species
- Knowledge graph nodes and edges

For MVP, seed the 5 user accounts too:

```python
# Add to seed.py
from app.services.auth import hash_password

users = [
    {"email": "user1@catalystai.local", "password": "catalyst123", "full_name": "User One"},
    {"email": "user2@catalystai.local", "password": "catalyst123", "full_name": "User Two"},
    # ... up to 5
]
for u in users:
    db.add(User(email=u["email"], password_hash=hash_password(u["password"]), full_name=u["full_name"]))
```

---

## 9. How to Run the MVP

### Terminal 1 — Backend
```bash
cd backend
pip install -r requirements.txt
python seed.py                    # one-time: populate database
uvicorn app.main:app --reload     # starts on http://localhost:8000
```

### Terminal 2 — Frontend
```bash
npm run dev                       # starts on http://localhost:5173
```

### Verify
1. Open `http://localhost:8000/api/health` → should return `{"status": "ok"}`
2. Open `http://localhost:8000/docs` → Swagger UI with all 12 endpoints
3. Open `http://localhost:5173` → CatalystAI dashboard (after migration, data comes from backend)

---

## 10. MVP Completion Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Backend project structure | ✅ Done |
| 2 | Database models (SQLite) | ✅ Done |
| 3 | API endpoints (12 routes) | ✅ Done |
| 4 | Discovery engine (deterministic) | ✅ Done |
| 5 | Auth service (JWT) | ✅ Done |
| 6 | Seed data script | ✅ Done |
| 7 | Frontend → API: Discovery flow | ❌ TODO |
| 8 | Frontend → API: Feedback/experiments | ❌ TODO |
| 9 | Frontend → API: Knowledge graph | ❌ TODO |
| 10 | Frontend → API: Catalysts/reactions list | ❌ TODO |
| 11 | Frontend → API: Results (pathway, pareto, candidates) | ❌ TODO |
| 12 | Delete mockDiscovery.ts | ❌ TODO |
| 13 | Add VITE_API_URL env var | ❌ TODO |
| 14 | Auth UI (login/register) or hardcoded tokens | ❌ TODO |

**Backend: 6/6 complete · Frontend migration: 0/8 complete**

---

## What's NOT in MVP (Future Scale-Up)

When you outgrow 5 users, add these in order:

1. **PostgreSQL** — swap SQLite when you need concurrent writes at scale
2. **Real ML models** — swap `discovery_engine.py` mock logic with trained models
3. **RDKit** — real molecular structure parsing and visualization
4. **Celery + Redis** — async pipeline for long-running ML inference
5. **Docker + docker-compose** — containerized deployment
6. **S3/MinIO** — file storage for molecular data
7. **CI/CD** — automated testing and deployment
8. **3Dmol.js** — real molecule viewer with SMILES input
