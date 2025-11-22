import { Router } from 'express';
import { pool } from '../db.js';
import { requireRole } from '../auth.js';

const router = Router();

router.get('/users', requireRole('admin'), async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT id, organization, contact_name, email, role, status FROM users');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/status', requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, organization, contact_name, email, role, status',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export const adminRouter = router;
