CREATE TABLE IF NOT EXISTS exercise_thanks (
  id UUID PRIMARY KEY,
  client_event_id UUID NOT NULL UNIQUE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exercise_id, voter_hash)
);

CREATE INDEX IF NOT EXISTS idx_exercise_thanks_exercise_id
  ON exercise_thanks(exercise_id);

ALTER TABLE exercises ALTER COLUMN image_url DROP NOT NULL;

-- Previous values were demonstration data and are intentionally not migrated.
UPDATE exercises SET thanks_count = 0 WHERE thanks_count <> 0;
