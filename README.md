# Backend Engineering Assessment

This repository contains two independent backend services:

- **`python-service`** — A FastAPI service for creating and rendering structured analyst briefing reports.
- **`ts-service`** — A NestJS service for candidate document intake and asynchronous AI-powered summary generation.

Both services share a single PostgreSQL instance, provisioned via Docker Compose.

---

## Prerequisites

| Tool | Version |
| :--- | :--- |
| Docker & Docker Compose | Any recent version |
| Node.js | 22+ |
| npm | 10+ |
| Python | 3.12+ |

---

## 1. Infrastructure Setup

Start the shared PostgreSQL database from the **project root**:

```bash
docker compose up -d postgres
```

This creates a single `assessment_db` database accessible to both services.

---

## 2. Python Service — Briefing Report Generator

### Environment Configuration

```bash
cd python-service
cp .env.example .env
```

The `.env.example` contains sensible defaults that match the Docker Compose database. No changes are needed for local development:

```env
DATABASE_URL=postgresql+psycopg://assessment_user:assessment_pass@localhost:5432/assessment_db
APP_ENV=development
APP_PORT=8000
```

### Installation

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Running Migrations

```bash
python -m app.db.run_migrations up
```

### Starting the Service

```bash
uvicorn app.main:app --reload --port 8000
```

The service is now available at `http://localhost:8000`. Interactive API docs: `http://localhost:8000/docs`.

### Running Tests

```bash
source .venv/bin/activate  # if not already active
python -m pytest
```

### Python API Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/briefings` | Create a new structured briefing |
| `GET` | `/briefings/{id}` | Retrieve a briefing by ID |
| `POST` | `/briefings/{id}/generate` | Compile and generate the report payload |
| `GET` | `/briefings/{id}/html` | Render the briefing as a styled HTML report |
| `GET` | `/health` | Health check |

---

## 3. TypeScript Service — Candidate Summary Workflow

### Environment Configuration

```bash
cd ts-service
cp .env.example .env
```

The `.env.example` contains sensible defaults. For real LLM integration set `GEMINI_API_KEY` and toggle `USE_MOCK_LLM`:

```env
PORT=3000
DATABASE_URL=postgres://assessment_user:assessment_pass@localhost:5432/assessment_db
NODE_ENV=development

# Set to 'true' to use the built-in mock provider (recommended for local dev and tests)
USE_MOCK_LLM=true

# Required only when USE_MOCK_LLM=false
GEMINI_API_KEY=
```

> **Note:** Keep `USE_MOCK_LLM=true` for local development and tests. When using the real Vertex/Gemini provider, calls may fail with `429 RESOURCE_EXHAUSTED` if the API key has no quota — the worker handles this gracefully by marking the summary as `failed`.

### Installation

```bash
npm install
```

### Running Migrations

```bash
npm run migration:run
```

To revert the last migration:

```bash
npm run migration:revert
```

### Starting the Service

```bash
npm run start:dev
```

The service is available at `http://localhost:3000`.

> The background worker (`IntelligenceGenerationWorker`) runs **in-process** on startup — no separate process is needed.

### Running Tests

```bash
# Unit tests
npm test

# End-to-end tests (requires a running database)
npm run test:e2e
```

### TypeScript API Endpoints

All routes require `x-user-id` and `x-workspace-id` headers to simulate authentication context.

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/candidates/:candidateId/documents` | Upload a document for a candidate |
| `POST` | `/candidates/:candidateId/summaries/generate` | Queue an async AI summary (returns `202`) |
| `GET` | `/candidates/:candidateId/summaries` | List all summaries for a candidate |
| `GET` | `/candidates/:candidateId/summaries/:summaryId` | Retrieve a specific summary |
| `POST` | `/profiles` | Register a talent profile |
| `GET` | `/profiles` | List all profiles in your workspace |
| `GET` | `/health` | Health check |

---

## 4. Assumptions & Tradeoffs

- **Fake Auth:** Both services use simulated auth via request headers (`x-user-id`, `x-workspace-id`). In production this would be replaced with a real JWT/OIDC provider.
- **In-process Worker:** The NestJS background worker runs in the same process. In production it should run as a separate, independently deployable service with restart policies.
- **In-memory Queue:** The queue uses a simple in-memory implementation. In production this would be replaced with Redis, RabbitMQ, or a cloud queue (e.g., GCP Pub/Sub).
- **Synchronous Report Generation (Python):** The Python report compilation is synchronous. For very large reports, this should move to a background task (e.g., Celery/Arq).
- **Candidate Creation (TypeScript):** Uploading a document to a `candidateId` that does not yet have a profile will auto-create a system profile. This is a deliberate assumption to keep the document intake flow frictionless.
- **No auth on Python service:** The briefing service has no workspace-scoping; briefings are globally accessible by ID. This was left as-is per the original starter design.

---

## 5. Running Both Services Together

Open two terminals after starting Postgres:

**Terminal 1 — Python:**
```bash
cd python-service
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — TypeScript:**
```bash
cd ts-service
npm run start:dev
```