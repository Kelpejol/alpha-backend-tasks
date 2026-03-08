CREATE TABLE IF NOT EXISTS briefings (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(180) NOT NULL,
  ticker VARCHAR(12) NOT NULL CHECK (ticker = UPPER(ticker)),
  sector VARCHAR(180) NOT NULL,
  analyst_name VARCHAR(180) NOT NULL,
  summary TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  generated_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS briefing_points (
  id SERIAL PRIMARY KEY,
  briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position > 0),
  content TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_briefing_points_briefing_id ON briefing_points(briefing_id);

CREATE TABLE IF NOT EXISTS briefing_risks (
  id SERIAL PRIMARY KEY,
  briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position > 0),
  content TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_briefing_risks_briefing_id ON briefing_risks(briefing_id);

CREATE TABLE IF NOT EXISTS briefing_metrics (
  id SERIAL PRIMARY KEY,
  briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  value VARCHAR(200) NOT NULL,
  CONSTRAINT uq_briefing_metric_name UNIQUE (briefing_id, name)
);
CREATE INDEX IF NOT EXISTS ix_briefing_metrics_briefing_id ON briefing_metrics(briefing_id);
