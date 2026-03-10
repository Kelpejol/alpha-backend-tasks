# Design Decisions & Architectural Rationale

This document outlines the key technical decisions made during the transformation of the Mini Briefing Report Generator into a production-grade service.

## 1. Domain Modeling & Naming

### Professional Domain Language
We transitioned from generic names (e.g., `SampleItem`, `Briefing`) to more descriptive, industry-aligned entities (`PlatformItem`, `BriefingReport`). This enhances clarity for developers and aligns the codebase with its primary purpose: financial and strategic analysis.

### Internal vs. External Naming
To maintain API backward compatibility while achieving internal professionalism:
- We used **SQLAlchemy** to enforce `snake_case` database names (e.g., `entity_name`, `asset_ticker`).
- We used **Pydantic Aliases** to map these internal names back to the expected `camelCase` API payload (e.g., `companyName`, `ticker`).
- This allows for a clean internal codebase without breaking existing integrations.

## 2. Infrastructure & Persistence

### Transition to Custom Migration Runner
While Alembic is standard, we opted to refine the existing SQL-based migration system for this assessment. This showcases an ability to work with and improve existing infrastructure. We added:
- **Atomic Migrations**: Using `db.begin()` to ensure multi-table migrations either fully succeed or roll back.
- **Improved Logging**: Detailed output for each migration step for better auditability.
- **Rollback Scripts**: Comprehensive `.down.sql` files for infrastructure stability.

### Eager Loading (SQLAlchemy)
To prevent the common **N+1 query problem** when fetching reports with multiple nested collections (Highlights, Threats, Metrics), we implemented `selectinload` in the repository layer. This ensures that all related data is fetched in a single round-trip, significantly improving response times as data volume grows.

## 3. Validation & Error Handling

### Human-Readable Error Reporting
Standard Pydantic error messages can be cryptic for non-technical users. We implemented a global exception handler for `RequestValidationError` that:
1. Translates the internal `loc` path into a simple field name.
2. Formats the error into a structured `VALIDATION_FAILED` response.
3. Provides specific "issue" and "type" fields for each validation failure.

### Custom Exception Hierarchy
We moved away from raising generic `HTTPException` directly in the service layer. Instead, we use a domain-specific hierarchy (`ResourceNotFoundException`, `BusinessRuleViolationException`, etc.). This decoupling allows the service layer to remain agnostic of the delivery mechanism (HTTP, gRPC, CLI) and enables consistent error formatting.

## 4. Visual Presentation (UX)

### High-Fidelity Rendering
The report template was redesigned to evoke the look and feel of a **Tier-1 investment bank's analyst brief**. Key decisions included:
- **Typography**: Using a mix of `Lora` (serif) for authoritative headings and `Inter` (sans-serif) for high-readability body text.
- **Color Palette**: A professional deeply-saturated blue (`#0f172a`) as the primary brand color, combined with a neutral slate palette to signify seriousness and professional focus.
- **Layout**: Clear visual hierarchy with structured sections for Executive Summaries, Strategic Highlights, and Risk Factors.

## 5. Trade-offs & Future Considerations

### Database Choice
We maintained the existing PostgreSQL setup. For a service focused on analytical reports with complex relationships, a relational database is the correct choice. However, as the system scales to handle millions of generated reports, a read-through cache (like Redis) for the generated HTML would be a recommended next step.

### Asynchronous Processing
Currently, report compilation is synchronous. For very large reports or reports requiring external API calls (e.g., real-time market data), this should be moved to a background task using **Celery** or **Arq**.
