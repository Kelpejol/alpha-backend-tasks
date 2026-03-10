-- Migration: 0001_initial_core_entities.sql
-- Description: Core organizational entities for the platform.

-- Legacy item table for demonstration and internal tracking.
CREATE TABLE IF NOT EXISTS platform_items (
  id SERIAL PRIMARY KEY,
  item_label VARCHAR(255) NOT NULL,
  item_description TEXT,
  record_created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
