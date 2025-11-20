-- Migration 002: Exercise Translation Management
-- Creates tables for storing translatable strings and their translations

-- Table for storing source strings (master content)
CREATE TABLE IF NOT EXISTS exercise_strings (
  id TEXT PRIMARY KEY,
  context TEXT,                                    -- e.g., 'exercise', 'tag', 'situation'
  source_text TEXT NOT NULL,                       -- Original text (typically French)
  source_lang TEXT NOT NULL DEFAULT 'fr',          -- Source language code
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for storing translations of strings
CREATE TABLE IF NOT EXISTS exercise_translations (
  string_id TEXT NOT NULL REFERENCES exercise_strings(id) ON DELETE CASCADE,
  lang TEXT NOT NULL,                              -- Target language code (en, de, es, nl)
  translated_text TEXT NOT NULL,                   -- Translated content
  translation_method TEXT DEFAULT 'manual',        -- 'manual', 'google_api', 'deepl', etc.
  translated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (string_id, lang)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_exercise_strings_context ON exercise_strings(context);
CREATE INDEX IF NOT EXISTS idx_exercise_translations_lang ON exercise_translations(lang);
CREATE INDEX IF NOT EXISTS idx_exercise_translations_string_id ON exercise_translations(string_id);

-- Add updated_at trigger for exercise_strings
CREATE OR REPLACE FUNCTION update_exercise_strings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_exercise_strings_updated_at ON exercise_strings;
CREATE TRIGGER trigger_exercise_strings_updated_at
  BEFORE UPDATE ON exercise_strings
  FOR EACH ROW
  EXECUTE FUNCTION update_exercise_strings_updated_at();

-- Add updated_at trigger for exercise_translations
CREATE OR REPLACE FUNCTION update_exercise_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_exercise_translations_updated_at ON exercise_translations;
CREATE TRIGGER trigger_exercise_translations_updated_at
  BEFORE UPDATE ON exercise_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_exercise_translations_updated_at();
