import { randomUUID } from 'node:crypto';
import { pool } from '../db.js';

import { INITIAL_EXERCISES } from '../shared/initialExercises.js';

/**
 * Check if the exercises table is empty
 */
async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM exercises WHERE deleted_at IS NULL');
    const count = parseInt(result.rows[0].count, 10);
    return count === 0;
  } catch (error) {
    console.error('Error checking database:', error);
    return false;
  }
}

/**
 * Insert initial exercises into the database
 */
async function seedExercises(): Promise<void> {
  console.log(`📝 Seeding ${INITIAL_EXERCISES.length} initial exercises...`);
  
  for (const exercise of INITIAL_EXERCISES) {
    const id = randomUUID();
    const now = new Date();
    
    try {
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
    } catch (error) {
      console.error(`Failed to insert exercise ${exercise.id}:`, error);
    }
  }
  
  console.log('✅ Initial exercises seeded successfully');
}

/**
 * Seed database if empty (runs on server startup)
 */
export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    const isEmpty = await isDatabaseEmpty();
    
    if (isEmpty) {
      console.log('📦 Database is empty. Seeding initial data...');
      await seedExercises();
    } else {
      console.log('✅ Database already contains exercises. Skipping seed.');
    }
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    throw error;
  }
}
