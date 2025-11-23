import { Router } from 'express';
import { pool } from '../db.js';
import { requireRole } from '../auth.js';

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

export const adminRouter = router;
