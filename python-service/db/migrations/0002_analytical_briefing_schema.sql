-- Migration: 0002_analytical_briefing_schema.sql
-- Description: Create core reporting tables with robust constraints and naming.

-- Main table housing the high-level briefing report metadata.
CREATE TABLE IF NOT EXISTS report_briefings (
  id SERIAL PRIMARY KEY,
  
  -- Subject identification
  entity_name VARCHAR(180) NOT NULL,
  asset_ticker VARCHAR(12) NOT NULL CHECK (asset_ticker = UPPER(asset_ticker)),
  industry_sector VARCHAR(180) NOT NULL,
  
  -- Authorship and Content
  author_name VARCHAR(180) NOT NULL,
  report_executive_summary TEXT NOT NULL,
  analyst_recommendation TEXT NOT NULL,
  
  -- Lifecycle management
  compiled_at TIMESTAMPTZ NULL,
  entry_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  entry_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for key highlights or positive takeaways from the report.
CREATE TABLE IF NOT EXISTS report_briefing_highlights (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES report_briefings(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL CHECK (display_order >= 0),
  description TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_report_briefing_highlights_report_id ON report_briefing_highlights(report_id);

-- Table for identifying risk factors and potential threats.
CREATE TABLE IF NOT EXISTS report_briefing_threats (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES report_briefings(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL CHECK (display_order >= 0),
  description TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_report_briefing_threats_report_id ON report_briefing_threats(report_id);

-- Quantitative metrics associated with the subject entity.
CREATE TABLE IF NOT EXISTS report_briefing_metrics (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES report_briefings(id) ON DELETE CASCADE,
  metric_label VARCHAR(120) NOT NULL,
  metric_value VARCHAR(200) NOT NULL,
  CONSTRAINT uq_report_metric_label UNIQUE (report_id, metric_label)
);
CREATE INDEX IF NOT EXISTS ix_report_briefing_metrics_report_id ON report_briefing_metrics(report_id);
