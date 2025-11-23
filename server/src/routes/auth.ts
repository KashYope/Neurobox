import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { env } from '../env.js';
import { optionalAuth } from '../auth.js';

const router = Router();

// Helper to set cookie
const setAuthCookie = (res: any, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
};

router.post('/register', async (req, res, next) => {
  try {
    const { organization, contactName, email, password } = req.body;

    if (!organization || !contactName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const id = randomUUID();

    await pool.query(
      `INSERT INTO users (id, organization, contact_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, 'partner', 'pending')`,
      [id, organization, contactName, email, hash]
    );

    res.status(201).json({ message: 'Registration successful. Please wait for approval.' });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        organization: user.organization
      },
      env.jwtSecret,
      { expiresIn: '24h' }
    );

    setAuthCookie(res, token);
    res.json({
      user: {
        id: user.id,
        organization: user.organization,
        contactName: user.contact_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.get('/me', optionalAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const result = await pool.query(
      'SELECT id, organization, contact_name, email, role, status FROM users WHERE id = $1',
      [req.user.sub]
    );

    if (result.rows.length === 0) {
      res.clearCookie('token');
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        organization: user.organization,
        contactName: user.contact_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export const authRouter = router;
