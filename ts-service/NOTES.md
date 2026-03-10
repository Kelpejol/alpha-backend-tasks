# Implementation Notes: Talent Intelligence Service (TIS)

This document provides technical background and architectural context for the refactoring of the Talent Intelligence Service.

## Domain Language Pivot

A core objective was to transition the codebase from a generic "Candidate" domain to a specialized **"Talent Intelligence"** domain. This required a comprehensive renaming strategy across all layers of the application.

-   **Candidate** -> **TalentProfile**: Reflects a more holistic and professional representation of individuals within the system.
-   **Document** -> **ProfileAttachment**: Clarifies the relationship between files and the professional profiles they support.
-   **Summary** -> **TalentAssessment**: Elevates the output from a simple text summary to a data-driven, strategic intelligence evaluation.
-   **Workspace** -> **Organization**: Aligns with enterprise-grade multi-tenancy conventions.

## Multi-Tenancy Design

The system implements strict, repository-level multi-tenant isolation. Every entity is tied to an `orgId` (formerly `workspaceId`), which is derived from the authenticated request context.

-   **Composite Identifiers**: Talent profiles use a composite primary key of `(profileId, orgId)` to ensure that identifiers are unique only within their organizational context.
-   **Access Control**: All service methods require an `AuthUser` object to enforce organizational boundaries before performing any database operations.

## Intelligence Pipeline

The evaluation pipeline is designed for resilience and auditability.

-   **Asynchronous Orchestration**: Assessment requests are immediately acknowledged and enqueued for background processing to ensure API responsiveness.
-   **State Transitions**: Assessments transition through `pending`, `completed`, or `failed` states, with comprehensive failure logging for troubleshooting.
-   **Engine Abstraction**: The `IntelligenceEngine` interface allows the system to remain agnostic of the underlying LLM provider, facilitating easy switching between Vertex AI, Google AI Studio, or mock providers.

## Professional API Standards

-   **Global Exception Filter**: Standardizes error reporting across the entire system, preventing the leakage of internal implementation details.
-   **Hardened Validation**: Uses `class-validator` to ensure all incoming data meets strict integrity requirements before reaching the domain logic.
-   **Semantic Status Codes**: Re-mapped validation failures to `422 Unprocessable Entity` and used `202 Accepted` for asynchronous triggers.

## Database & Migrations

The schema has been consolidated into a single, high-fidelity `TalentIntelligenceSchema` migration. This provides a clean starting point for the production environment and ensures all foreign key relationships and indices are optimized for multi-tenant queries.
