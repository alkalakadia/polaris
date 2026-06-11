-- Polaris V1 schema
--
-- Three tables drive the longitudinal data layer. Every patient encounter
-- produces one intake row and one classification row. Handouts are
-- generated lazily and cached so re-opens are free.
--
-- V1 is intentionally PHI-light: no patient names, no DOB, just the
-- structured intake answers. PHI flows enter V2 with BAA-compliant infra.
-- For now this lets us prove the workflow with de-identified pilot data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Raw intake submissions. One row per completed pre-visit questionnaire.
CREATE TABLE intakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  intake_data JSONB NOT NULL
);
CREATE INDEX idx_intakes_created_at ON intakes(created_at DESC);

-- Phenotype classification results. One row per AI run; we may classify
-- the same intake multiple times if the prompt or model changes.
CREATE TABLE classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  phenotype TEXT NOT NULL CHECK (phenotype IN ('A', 'B', 'C', 'D', 'Unlikely')),
  ir_likelihood INTEGER NOT NULL CHECK (ir_likelihood >= 0 AND ir_likelihood <= 100),
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'moderate', 'low')),
  reasoning JSONB NOT NULL,
  model TEXT,
  ai_powered BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_classifications_intake_id ON classifications(intake_id);

-- Generated patient handouts, cached by classification.
CREATE TABLE handouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classification_id UUID NOT NULL REFERENCES classifications(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content JSONB NOT NULL,
  ai_powered BOOLEAN NOT NULL DEFAULT FALSE,
  generation_ms INTEGER
);
CREATE INDEX idx_handouts_classification_id ON handouts(classification_id);

-- RLS posture: V1 keeps the schema permissive while we iterate. Production
-- will restrict by provider_id once auth lands. For pilot data integrity
-- the service-role key is the only entry point right now (no anon writes).
ALTER TABLE intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE handouts ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by default; no policies needed in V1.
-- When provider auth lands, add per-provider policies here.
