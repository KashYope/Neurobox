import { Router, type Request, type Response } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { pool, type ExerciseRow } from '../db.js';
import { mapExerciseRow } from '../utils/serializers.js';
import { exercisePayloadSchema, moderationSchema, thankExerciseSchema } from '../utils/validation.js';
import { requireRole } from '../auth.js';

const router = Router();

const WITH_VERIFIED_THANKS = `
  SELECT e.*,
         (SELECT COUNT(*)::int FROM exercise_thanks et WHERE et.exercise_id = e.id) AS thanks_count
  FROM exercises e
`;

const findExercise = async (identifier: string): Promise<ExerciseRow | null> => {
  const result = await pool.query<ExerciseRow>(
    `${WITH_VERIFIED_THANKS}
     WHERE e.client_id = $1 OR e.id::text = $1
     LIMIT 1`,
    [identifier]
  );
  return result.rows[0] ?? null;
};

const THANK_WINDOW_MS = 60 * 60 * 1000;
const THANK_MAX_REQUESTS = 30;
const thankWindows = new Map<string, { count: number; resetAt: number }>();

const enforceThankRateLimit = (req: Request, res: Response): boolean => {
  const now = Date.now();
  const key = req.ip || 'unknown';
  const current = thankWindows.get(key);
  if (!current || current.resetAt <= now) {
    thankWindows.set(key, { count: 1, resetAt: now + THANK_WINDOW_MS });
    return true;
  }
  if (current.count >= THANK_MAX_REQUESTS) {
    res.set('Retry-After', Math.ceil((current.resetAt - now) / 1000).toString());
    res.status(429).json({ message: 'Too many helpful-vote attempts' });
    return false;
  }
  current.count += 1;
  return true;
};

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query<ExerciseRow>(
      `${WITH_VERIFIED_THANKS}
       WHERE e.deleted_at IS NULL
       ORDER BY e.created_at DESC`
    );
    res.json(result.rows.map(mapExerciseRow));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = exercisePayloadSchema.parse(req.body);
    const isPartner = req.user?.role === 'partner' || req.user?.role === 'admin';
    const id = randomUUID();
    const now = new Date();

    const result = await pool.query<ExerciseRow>(
      `INSERT INTO exercises (
        id, client_id, title, description, situation, neurotypes, duration, steps,
        warning, image_url, tags, support_needs, thanks_count, is_partner_content,
        is_community_submitted, author, moderation_status, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
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
        payload.imageUrl ?? null,
        payload.tags,
        payload.supportNeeds,
        0,
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
    if (!enforceThankRateLimit(req, res)) return;
    const payload = thankExerciseSchema.parse(req.body);
    const identifier = req.params.id;
    const record = await findExercise(identifier);
    if (!record || record.deleted_at) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    const voterHash = createHash('sha256').update(payload.installationId).digest('hex');
    const inserted = await pool.query(
      `INSERT INTO exercise_thanks (id, client_event_id, exercise_id, voter_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [randomUUID(), payload.eventId, record.id, voterHash]
    );
    const updated = await findExercise(record.id);
    res.json({ exercise: mapExerciseRow(updated!), accepted: inserted.rowCount === 1 });
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

    res.json(mapExerciseRow({ ...updated.rows[0], thanks_count: record.thanks_count }));
  } catch (error) {
    next(error);
  }
});

export const exercisesRouter = router;
