import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { pool, type ExerciseRow } from '../db.js';
import { mapExerciseRow } from '../utils/serializers.js';
import { exercisePayloadSchema, moderationSchema } from '../utils/validation.js';
import { requireRole } from '../auth.js';

const router = Router();

const findExercise = async (identifier: string): Promise<ExerciseRow | null> => {
  const result = await pool.query<ExerciseRow>(
    `SELECT * FROM exercises WHERE id = $1 OR client_id = $1 LIMIT 1`,
    [identifier]
  );
  return result.rows[0] ?? null;
};

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query<ExerciseRow>(
      `SELECT * FROM exercises ORDER BY created_at DESC`
    );
    res.json(result.rows.map(mapExerciseRow));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = exercisePayloadSchema.parse(req.body);
    const isPartner = req.user?.role === 'partner';
    const id = randomUUID();
    const now = new Date();

    const result = await pool.query<ExerciseRow>(
      `INSERT INTO exercises (
        id, client_id, title, description, situation, neurotypes, duration, steps,
        warning, image_url, tags, thanks_count, is_partner_content,
        is_community_submitted, author, moderation_status, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      ) RETURNING *`,
      [
        id,
        payload.id,
        payload.title,
        payload.description,
        payload.situation,
        payload.neurotypes,
        payload.duration,
        payload.steps,
        payload.warning ?? null,
        payload.imageUrl,
        payload.tags,
        payload.thanksCount ?? 0,
        isPartner,
        !isPartner,
        payload.author ?? null,
        isPartner ? 'approved' : 'pending',
        now,
        now
      ]
    );

    res.status(201).json(mapExerciseRow(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/thanks', async (req, res, next) => {
  try {
    const identifier = req.params.id;
    const record = await findExercise(identifier);
    if (!record || record.deleted_at) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    const updated = await pool.query<ExerciseRow>(
      `UPDATE exercises SET thanks_count = thanks_count + 1, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [record.id]
    );

    res.json(mapExerciseRow(updated.rows[0]));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/moderation', requireRole('moderator'), async (req, res, next) => {
  try {
    const payload = moderationSchema.parse(req.body);
    const identifier = req.params.id;
    const record = await findExercise(identifier);
    if (!record) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    const shouldDelete = payload.shouldDelete ?? payload.status === 'rejected';
    const updated = await pool.query<ExerciseRow>(
      `UPDATE exercises
       SET moderation_status = $1,
           moderation_notes = $2,
           moderated_at = NOW(),
           moderated_by = $3,
           deleted_at = CASE WHEN $4 THEN NOW() ELSE deleted_at END,
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [payload.status, payload.notes ?? null, req.user?.sub ?? 'moderator', shouldDelete, record.id]
    );

    await pool.query(
      `INSERT INTO moderation_actions (id, exercise_id, status, notes, moderator)
       VALUES ($1,$2,$3,$4,$5)`,
      [randomUUID(), record.id, payload.status, payload.notes ?? null, req.user?.sub ?? null]
    );

    res.json(mapExerciseRow(updated.rows[0]));
  } catch (error) {
    next(error);
  }
});

export const exercisesRouter = router;
