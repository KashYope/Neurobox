/**
 * Test Translation System
 * Quick validation script to check if the translation system is working
 * 
 * Usage:
 *   tsx scripts/testTranslationSystem.ts
 */

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function testTranslationSystem() {
  console.log('=== Translation System Test ===\n');

  try {
    // Test 1: Check if tables exist
    console.log('Test 1: Checking database tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('exercise_strings', 'exercise_translations')
    `);
    
    const tables = tablesResult.rows.map(r => r.table_name);
    console.log(`  Found tables: ${tables.join(', ')}`);
    
    if (tables.length !== 2) {
      console.log('  ❌ Missing tables! Run: npm run server:migrate');
      process.exit(1);
    }
    console.log('  ✓ Tables exist\n');

    // Test 2: Check string count
    console.log('Test 2: Checking exercise strings...');
    const stringsResult = await pool.query('SELECT COUNT(*) FROM exercise_strings');
    const stringCount = parseInt(stringsResult.rows[0].count);
    console.log(`  Found ${stringCount} exercise strings`);
    
    if (stringCount === 0) {
      console.log('  ⚠️  No strings found! Run: npx tsx scripts/seedExerciseStrings.ts');
    } else {
      console.log('  ✓ Strings populated\n');
    }

    // Test 3: Check translations by language
    console.log('Test 3: Checking translations by language...');
    const langs = ['fr', 'en', 'de', 'es', 'nl'];
    
    for (const lang of langs) {
      const result = await pool.query(
        'SELECT COUNT(*) FROM exercise_translations WHERE lang = $1',
        [lang]
      );
      const count = parseInt(result.rows[0].count);
      const status = count === 0 ? '❌' : '✓';
      console.log(`  ${status} ${lang.toUpperCase()}: ${count} translations`);
    }
    console.log('');

    // Test 4: Sample translation
    console.log('Test 4: Fetching sample translation...');
    const sampleResult = await pool.query(`
      SELECT 
        es.id,
        es.source_text,
        et.lang,
        et.translated_text
      FROM exercise_strings es
      LEFT JOIN exercise_translations et ON es.id = et.string_id
      WHERE es.context = 'exercise'
      LIMIT 1
    `);
    
    if (sampleResult.rows.length > 0) {
      const sample = sampleResult.rows[0];
      console.log(`  String ID: ${sample.id}`);
      console.log(`  Source (FR): ${sample.source_text}`);
      if (sample.lang) {
        console.log(`  Translation (${sample.lang.toUpperCase()}): ${sample.translated_text}`);
      }
      console.log('  ✓ Sample fetched\n');
    } else {
      console.log('  ⚠️  No strings found\n');
    }

    // Summary
    console.log('=== Summary ===');
    if (stringCount > 0) {
      console.log('✓ Translation system is set up correctly!');
      console.log('\nNext steps:');
      console.log('1. Add translations for other languages using the API or bulk script');
      console.log('2. Update constants.ts with string IDs (see seedExerciseStrings output)');
      console.log('3. Integrate contentResolver in UI components');
    } else {
      console.log('⚠️  Translation system is partially set up');
      console.log('\nRun the seed script to populate strings:');
      console.log('  npx tsx scripts/seedExerciseStrings.ts');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testTranslationSystem();
