# NOTES

## Design Decisions

- Kept `python-service` and `ts-service` independent to match the assessment architecture.
- Followed clear layering in Python: Router -> Service -> Repository -> Database.
- Followed clear layering in TypeScript: Controller -> Queue -> Worker -> Provider -> Database.
- Used provider abstraction (`SummarizationProvider`) so app logic is not coupled to one LLM vendor.
- Kept summary generation asynchronous to avoid doing long-running LLM work in request handlers.
- Used server-side Jinja2 templates for briefing reports instead of building HTML strings in Python.

## Schema Decisions

- Python briefing data is normalized across `briefings`, `briefing_points`, `briefing_risks`, and `briefing_metrics`.
- Added required briefing fields from PRD (`sector`, `analyst_name`) and persisted generation state (`generated_at`).
- Enforced relational integrity with foreign keys and cascade delete on briefing child rows.
- Added uniqueness constraint for metric names per briefing (`uq_briefing_metric_name`).
- TypeScript workflow data is normalized across `candidates`, `candidate_documents`, and `candidate_summaries`.
- Candidate access is workspace-scoped via `workspace_id` checks in services.

## Improvements With More Time

- Split worker execution into a dedicated process and add robust retry/backoff/dead-letter handling.
- Add richer integration and contract tests across both services.
- Add stronger auth and authorization beyond the fake local guard used for assessment scope.
- Add structured observability (request IDs, logs, metrics, tracing).
- Improve LLM resilience with fallback model strategy, stricter schema validation, and safer parsing.
- Polish report styling and add export options (for example PDF).
