CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY,
  client_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  situation TEXT[] NOT NULL,
  neurotypes TEXT[] NOT NULL,
  duration TEXT NOT NULL,
  steps TEXT[] NOT NULL,
  warning TEXT,
  image_url TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  thanks_count INTEGER NOT NULL DEFAULT 0,
  is_partner_content BOOLEAN NOT NULL DEFAULT FALSE,
  is_community_submitted BOOLEAN NOT NULL DEFAULT TRUE,
  author TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  moderation_notes TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_exercises_client_id ON exercises(client_id);
CREATE INDEX IF NOT EXISTS idx_exercises_moderation_status ON exercises(moderation_status);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  moderator TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_exercise ON moderation_actions(exercise_id);
