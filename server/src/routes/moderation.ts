import { Router } from 'express';
import { pool, type ExerciseRow } from '../db.js';
import { mapExerciseRow } from '../utils/serializers.js';
import { requireRole } from '../auth.js';

const router = Router();

router.get('/queue', requireRole('moderator'), async (_req, res, next) => {
  try {
    const [queue, recent] = await Promise.all([
      pool.query<ExerciseRow>(
        `SELECT * FROM exercises
         WHERE (moderation_status = 'pending' OR moderation_status IS NULL)
           AND deleted_at IS NULL
         ORDER BY created_at ASC`
      ),
      pool.query<ExerciseRow>(
        `SELECT * FROM exercises
         WHERE moderation_status IN ('approved','rejected')
           AND deleted_at IS NULL
         ORDER BY moderated_at DESC NULLS LAST, updated_at DESC
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
