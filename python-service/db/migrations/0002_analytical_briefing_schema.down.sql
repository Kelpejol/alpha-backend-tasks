-- Rollback: 0002_analytical_briefing_schema.down.sql
-- Description: Drop briefing tables in reverse order of dependence.

DROP TABLE IF EXISTS report_briefing_metrics;
DROP TABLE IF EXISTS report_briefing_threats;
DROP TABLE IF EXISTS report_briefing_highlights;
DROP TABLE IF EXISTS report_briefings;
