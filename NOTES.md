# NOTES — Design Decisions, Schema Rationale & Tradeoffs

This document covers the technical decisions made across both services.

---

## Design Decisions

### Python Service — Briefing Report Generator

**Repository / Service separation**  
The service layer (`briefing_service.py`) never touches SQLAlchemy directly. It delegates all persistence to a repository (`briefing_repository.py`). This keeps tests fast and business logic portable.

**Custom exception hierarchy**  
Rather than raising `HTTPException` directly from service methods, I introduced domain exceptions (`ResourceNotFoundException`, `BusinessRuleViolationException`). The API layer translates these. This keeps the service layer transport-agnostic.

**Report formatting as a separate step**  
The `ReportFormatter` is a dedicated, stateless class that transforms an ORM model into a view-model dict before template rendering. This prevents any template from touching the ORM layer directly and makes the rendering pipeline independently testable.

**Jinja2 for HTML rendering**  
Templates live in `app/templates/`. This keeps presentation logic out of Python code, makes the reports easy to restyle, and auto-escapes user input, which prevents XSS.

**Pydantic aliases (camelCase API, snake_case internals)**  
The API accepts and returns camelCase (`companyName`, `analystName`) while the database and internal code use snake_case. Pydantic's `alias_generator` handles the mapping automatically.

---

### TypeScript Service — Candidate Summary Workflow

**Queue / Worker architecture for LLM calls**  
LLM calls can take seconds and are rate-limited. Handling them in the HTTP request cycle would tie up connections and produce timeouts. The `POST /summaries/generate` endpoint returns `202 Accepted` immediately after enqueuing a job. The `IntelligenceGenerationWorker` processes it asynchronously, writing results back to the database.

**`IntelligenceEngine` interface**  
All LLM interaction goes through a single interface (`generateAssessment`). The concrete implementation is injected via NestJS's DI token `INTELLIGENCE_ENGINE`. Swapping from the mock provider to Gemini is a single env var change (`SUMMARIZATION_PROVIDER=gemini`). No application code changes.

**Multi-tenancy via `orgId` on every query**  
Every repository call includes a `where: { orgId: user.workspaceId }` clause. This is not optional — the service methods require an `AuthUser` context object. A request from workspace A cannot return data from workspace B, even if it somehow obtained a valid entity ID.

**Composite primary key on `talent_profiles`**  
The primary key is `(profile_id, org_id)`, not just `profile_id`. This means IDs are only unique within an organization, which enforces isolation at the data model level — not just in application code.

**Global `ApiExceptionFilter`**  
All HTTP exceptions and unhandled errors flow through a single filter that produces a consistent JSON error shape: `{ success, error: { code, message, details }, path, timestamp }`. This prevents raw NestJS error objects from leaking to clients.

**Validation returns `422 Unprocessable Entity`**  
Standard NestJS ValidationPipe returns `400 Bad Request` for validation errors. This was changed to `422` because the syntax of the request is valid JSON — the semantic content fails domain rules. This is more precise.

---

## Schema Decisions

### Python — `report_briefings` schema

```
report_briefings         (id, entity_name, asset_ticker, industry_sector, author_name,
                          report_executive_summary, analyst_recommendation,
                          compiled_at, entry_created_at, entry_updated_at)

report_briefing_highlights (id, report_id FK→report_briefings, display_order, description)
report_briefing_threats    (id, report_id FK→report_briefings, display_order, description)
report_briefing_metrics    (id, report_id FK→report_briefings, metric_label, metric_value,
                            UNIQUE(report_id, metric_label))
```

**Why separate tables for highlights/threats/metrics?**  
Storing them as JSON arrays in the briefing row would make it impossible to enforce uniqueness on metric labels, enforce ordering, or query individual items. Separate tables with FK + cascade delete keep the model relational and correct.

**`compiled_at` nullable on the parent row**  
A briefing can exist without being compiled. `compiled_at` is set only when `POST /briefings/{id}/generate` is called. This makes the lifecycle state explicit in the schema.

---

### TypeScript — Talent Intelligence schema

```
organizations       (id PK, display_name, created_at)

talent_profiles     (profile_id PK, org_id PK→organizations, full_name, email_address, created_at)
                    — composite PK enforces per-org uniqueness

profile_attachments (attachment_id PK, profile_id, org_id FK→talent_profiles(profile_id,org_id),
                     type, filename, storage_ref, content_blob, uploaded_at)

talent_assessments  (assessment_id PK, profile_id, org_id FK→talent_profiles(profile_id,org_id),
                     assessment_status, integrity_score, key_strengths[], risk_factors[],
                     full_narrative, decision_recommendation, engine_provider, runtime_version,
                     failure_log, created_at, updated_at)
```

**Why `organizations` table?**  
The workspace ID from the auth header needed a root anchor. The `organizations` table is auto-created on first use (`ensureOrganization`), providing a clean FK reference for everything beneath it.

**Why PostgreSQL arrays for `key_strengths` and `risk_factors`?**  
The number of items is variable and unbounded, they are always read together with the assessment, and they don't need independent querying. Native Postgres `text[]` arrays are the right fit here — simpler than a join table, and avoids the overhead and NULL handling of a `jsonb` column.

**Indexes on `(profile_id, org_id)`**  
Every lookup on attachments and assessments is by `(profile_id, org_id)`. Composite indexes on both child tables ensure these queries stay O(log n) regardless of data volume.

---

## What I Would Improve With More Time

1. **Dedicated worker process** — Move `IntelligenceGenerationWorker` to a separate runtime (e.g., a second NestJS app in worker mode) with its own pod/container and horizontal scaling.

2. **Durable queue** — Replace the in-memory queue with Redis Streams or a cloud queue (GCP Pub/Sub, AWS SQS). This adds persistence, retry guarantees, and dead-letter handling for failed jobs.

3. **Retry with exponential backoff** — Failed assessments (e.g., due to API rate limits) should re-enter the queue with a backoff delay rather than immediately marking as `failed`.

4. **Real authentication** — Replace `FakeAuthGuard` with a proper JWT strategy (e.g., using `passport-jwt`). The `AuthUser` type and guard boundary are already in place, so this is a well-contained swap.

5. **Structured logging and tracing** — Add `pino` (TypeScript) and standard Python logging with correlation IDs. Add OpenTelemetry spans around LLM calls to track latency per provider.

6. **Read-through cache for HTML reports** — Cache rendered HTML in Redis with an ETag. Report content rarely changes after compilation; serving from cache avoids redundant template rendering.

7. **Contract tests** — Add Pact or OpenAPI-based contract tests to prevent breaking API changes silently, especially as teams work across both services.
