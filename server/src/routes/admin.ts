import { Router } from 'express';
import { pool } from '../db.js';
import { requireRole } from '../auth.js';
import { batchTranslationSchema } from '../utils/validation.js';
import { getBatchTranslationStatus, startBatchTranslation } from '../services/batchTranslationService.js';

const router = Router();

const mapUserRow = (row: any) => ({
  id: row.id,
  organization: row.organization,
  contactName: row.contact_name,
  email: row.email,
  role: row.role,
  status: row.status
});

router.get('/partners', requireRole('moderator'), async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, organization, contact_name, email, role, status
       FROM users
       WHERE status IN ('pending', 'active')
       ORDER BY created_at DESC, organization ASC`
    );

    res.json({ partners: result.rows.map(mapUserRow) });
  } catch (error) {
    next(error);
  }
});

router.get('/metrics', requireRole('moderator'), async (_req, res, next) => {
  try {
    const [exerciseStatsResult, userStatsResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE deleted_at IS NULL)::int AS total_exercises,
           COALESCE(SUM(thanks_count) FILTER (WHERE deleted_at IS NULL), 0)::int AS total_thanks,
           COUNT(*) FILTER (WHERE is_community_submitted AND deleted_at IS NULL)::int AS community_exercises,
           COUNT(*) FILTER (WHERE is_partner_content AND deleted_at IS NULL)::int AS partner_exercises,
           COUNT(*) FILTER (WHERE moderation_status = 'pending' AND deleted_at IS NULL)::int AS pending_moderation,
           COUNT(*) FILTER (WHERE moderation_status = 'approved' AND deleted_at IS NULL)::int AS approved_exercises,
           COUNT(*) FILTER (WHERE moderation_status = 'rejected' AND deleted_at IS NULL)::int AS rejected_exercises
         FROM exercises`
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total_users,
           COUNT(*) FILTER (WHERE status = 'active')::int AS active_users,
           COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_users,
           COUNT(*) FILTER (WHERE role = 'admin')::int AS admin_users,
           COUNT(*) FILTER (WHERE role = 'moderator')::int AS moderator_users
         FROM users`
      )
    ]);

    const exerciseStats = exerciseStatsResult.rows[0];
    const userStats = userStatsResult.rows[0];

    res.json({
      totalThanks: exerciseStats.total_thanks,
      totalExercises: exerciseStats.total_exercises,
      communityExercises: exerciseStats.community_exercises,
      partnerExercises: exerciseStats.partner_exercises,
      pendingModeration: exerciseStats.pending_moderation,
      approvedExercises: exerciseStats.approved_exercises,
      rejectedExercises: exerciseStats.rejected_exercises,
      totalUsers: userStats.total_users,
      activeUsers: userStats.active_users,
      pendingUsers: userStats.pending_users,
      adminUsers: userStats.admin_users,
      moderatorUsers: userStats.moderator_users,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/partners/:id/status', requireRole('moderator'), async (req, res, next) => {
  try {
    const { status } = req.body as { status?: string };
    if (!status || !['pending', 'active', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE users
       SET status = $1
       WHERE id = $2
       RETURNING id, organization, contact_name, email, role, status`,
      [status, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(mapUserRow(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/batch-translations', requireRole('moderator'), async (req, res, next) => {
  try {
    const payload = batchTranslationSchema.parse(req.body);
    const job = await startBatchTranslation(payload.targetLangs, payload.perimeter);
    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
});

router.get('/batch-translations/:id', requireRole('moderator'), (req, res, next) => {
  try {
    const job = getBatchTranslationStatus(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Batch translation not found' });
    }
    res.json(job);
  } catch (error) {
    next(error);
  }
});

export const adminRouter = router;
