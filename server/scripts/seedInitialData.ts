/**
 * Seed Initial Data Script
 * Populates PostgreSQL database with INITIAL_EXERCISES from constants.ts
 * Run automatically on server startup if database is empty
 * 
 * Usage:
 *   tsx server/scripts/seedInitialData.ts
 */

import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: process.env.SERVER_ENV ?? process.env.ENV_FILE });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/neurobox';
const pool = new Pool({ connectionString: DATABASE_URL });

import { INITIAL_EXERCISES } from '../src/shared/initialExercises.js';

/**
 * Check if exercises table is empty
 */
async function isDatabaseEmpty(): Promise<boolean> {
  const result = await pool.query('SELECT COUNT(*) FROM exercises WHERE deleted_at IS NULL');
  const count = parseInt(result.rows[0].count, 10);
  return count === 0;
}

/**
 * Insert initial exercises into database
 */
async function seedExercises(): Promise<void> {
  console.log(`Inserting ${INITIAL_EXERCISES.length} initial exercises...`);
  
  for (const exercise of INITIAL_EXERCISES) {
    const id = randomUUID();
    const now = new Date();
    
    await pool.query(
      `INSERT INTO exercises (
        id, client_id, title, description, situation, neurotypes, duration, steps,
        warning, image_url, tags, thanks_count, is_partner_content,
        is_community_submitted, moderation_status, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      )`,
      [
        id,
        exercise.id, // Use original ID as client_id for tracking
        exercise.title,
        exercise.description,
        exercise.situation,
        exercise.neurotypes,
        exercise.duration,
        exercise.steps,
        exercise.warning || null,
          `/images/exercises/${exercise.id}.svg`,
          exercise.tags,
          0,
        false, // is_partner_content
        false, // is_community_submitted (these are official seed exercises)
        exercise.moderationStatus || 'approved',
        now,
        now
      ]
    );
  }
  
  console.log('✓ Initial exercises seeded successfully');
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Seed Initial Data ===\n');
  
  try {
    console.log('Connecting to database...');
    await pool.connect();
    console.log('✓ Connected\n');
    
    const isEmpty = await isDatabaseEmpty();
    
    if (isEmpty) {
      console.log('Database is empty. Seeding initial exercises...\n');
      await seedExercises();
      console.log('\n=== Seeding Complete ===');
    } else {
      console.log('Database already contains exercises. Skipping seed.\n');
    }
    
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main();
