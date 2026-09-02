import { Router } from 'express';
import { pool, type ExerciseRow } from '../db.js';
import { mapExerciseRow } from '../utils/serializers.js';
import { requireRole } from '../auth.js';

const router = Router();

router.get('/queue', requireRole('moderator'), async (_req, res, next) => {
  try {
    const [queue, recent] = await Promise.all([
      pool.query<ExerciseRow>(
        `SELECT e.*,
                (SELECT COUNT(*)::int FROM exercise_thanks et WHERE et.exercise_id = e.id) AS thanks_count
         FROM exercises e
         WHERE (e.moderation_status = 'pending' OR e.moderation_status IS NULL)
           AND e.deleted_at IS NULL
         ORDER BY e.created_at ASC`
      ),
      pool.query<ExerciseRow>(
        `SELECT e.*,
                (SELECT COUNT(*)::int FROM exercise_thanks et WHERE et.exercise_id = e.id) AS thanks_count
         FROM exercises e
         WHERE e.moderation_status IN ('approved','rejected')
           AND e.deleted_at IS NULL
         ORDER BY e.moderated_at DESC NULLS LAST, e.updated_at DESC
         LIMIT 12`
      )
    ]);

    res.json({
      queue: queue.rows.map(mapExerciseRow),
      recent: recent.rows.map(mapExerciseRow)
    });
  } catch (error) {
    next(error);
  }
});

export const moderationRouter = router;
