ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS support_needs TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_exercises_support_needs
  ON exercises USING GIN (support_needs);
