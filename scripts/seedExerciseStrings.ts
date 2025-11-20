/**
 * Seed Exercise Strings Script
 * Migrates INITIAL_EXERCISES from constants.ts to the string-based translation system
 * 
 * Usage:
 *   tsx scripts/seedExerciseStrings.ts
 */

import { Pool } from 'pg';
import { INITIAL_EXERCISES } from '../constants.js';

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

interface ExerciseString {
  id: string;
  context: string;
  sourceText: string;
  sourceLang: string;
}

interface ExerciseTranslation {
  stringId: string;
  lang: string;
  translatedText: string;
  translationMethod: string;
}

/**
 * Generate string ID for exercise content
 */
function generateStringId(exerciseId: string, field: string, index?: number): string {
  const base = `exercise.${exerciseId}.${field}`;
  return index !== undefined ? `${base}_${index + 1}` : base;
}

/**
 * Extract strings from INITIAL_EXERCISES
 */
function extractStrings(): ExerciseString[] {
  const strings: ExerciseString[] = [];

  for (const exercise of INITIAL_EXERCISES) {
    // Title
    strings.push({
      id: generateStringId(exercise.id, 'title'),
      context: 'exercise',
      sourceText: exercise.title,
      sourceLang: 'fr'
    });

    // Description
    strings.push({
      id: generateStringId(exercise.id, 'description'),
      context: 'exercise',
      sourceText: exercise.description,
      sourceLang: 'fr'
    });

    // Steps
    exercise.steps.forEach((step, idx) => {
      strings.push({
        id: generateStringId(exercise.id, 'step', idx),
        context: 'exercise',
        sourceText: step,
        sourceLang: 'fr'
      });
    });

    // Warning (if exists)
    if (exercise.warning) {
      strings.push({
        id: generateStringId(exercise.id, 'warning'),
        context: 'exercise',
        sourceText: exercise.warning,
        sourceLang: 'fr'
      });
    }
  }

  return strings;
}

/**
 * Create French translations (source language)
 */
function createFrenchTranslations(strings: ExerciseString[]): ExerciseTranslation[] {
  return strings.map(str => ({
    stringId: str.id,
    lang: 'fr',
    translatedText: str.sourceText,
    translationMethod: 'source'
  }));
}

/**
 * Insert strings into database
 */
async function insertStrings(strings: ExerciseString[]): Promise<void> {
  console.log(`Inserting ${strings.length} exercise strings...`);
  
  for (const str of strings) {
    await pool.query(
      `INSERT INTO exercise_strings (id, context, source_text, source_lang)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         source_text = EXCLUDED.source_text,
         updated_at = NOW()`,
      [str.id, str.context, str.sourceText, str.sourceLang]
    );
  }
  
  console.log('✓ Strings inserted successfully');
}

/**
 * Insert translations into database
 */
async function insertTranslations(translations: ExerciseTranslation[]): Promise<void> {
  console.log(`Inserting ${translations.length} French translations...`);
  
  for (const trans of translations) {
    await pool.query(
      `INSERT INTO exercise_translations (string_id, lang, translated_text, translation_method)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (string_id, lang) DO UPDATE SET
         translated_text = EXCLUDED.translated_text,
         updated_at = NOW()`,
      [trans.stringId, trans.lang, trans.translatedText, trans.translationMethod]
    );
  }
  
  console.log('✓ Translations inserted successfully');
}

/**
 * Generate TypeScript code to update constants.ts with string IDs
 */
function generateConstantsUpdate(): void {
  console.log('\n=== Update constants.ts ===\n');
  console.log('Add the following string ID fields to each exercise in INITIAL_EXERCISES:\n');

  for (const exercise of INITIAL_EXERCISES) {
    const titleStringId = generateStringId(exercise.id, 'title');
    const descriptionStringId = generateStringId(exercise.id, 'description');
    const stepsStringIds = exercise.steps.map((_, idx) => generateStringId(exercise.id, 'step', idx));
    const warningStringId = exercise.warning ? generateStringId(exercise.id, 'warning') : undefined;

    console.log(`  // Exercise: ${exercise.id}`);
    console.log(`  titleStringId: '${titleStringId}',`);
    console.log(`  descriptionStringId: '${descriptionStringId}',`);
    console.log(`  stepsStringIds: [${stepsStringIds.map(id => `'${id}'`).join(', ')}],`);
    if (warningStringId) {
      console.log(`  warningStringId: '${warningStringId}',`);
    }
    console.log('');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Exercise Strings Seeder ===\n');
  
  try {
    // Extract strings from INITIAL_EXERCISES
    const strings = extractStrings();
    console.log(`Extracted ${strings.length} strings from ${INITIAL_EXERCISES.length} exercises\n`);

    // Create French translations
    const frenchTranslations = createFrenchTranslations(strings);

    // Connect to database
    console.log('Connecting to database...');
    await pool.connect();
    console.log('✓ Connected\n');

    // Insert strings
    await insertStrings(strings);

    // Insert French translations
    await insertTranslations(frenchTranslations);

    // Generate update instructions
    generateConstantsUpdate();

    console.log('=== Seeding Complete ===');
    console.log('\nNext steps:');
    console.log('1. Update constants.ts with the string IDs shown above');
    console.log('2. Run the migration: npm run server:migrate');
    console.log('3. Restart the server');
    console.log('4. Use the translation API to add translations for other languages\n');

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main();
