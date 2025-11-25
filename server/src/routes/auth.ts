import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { env } from '../env.js';
import { optionalAuth } from '../auth.js';

const router = Router();

const COMMON_PASSWORDS = new Set([
  '123456',
  'password',
  '123456789',
  '12345678',
  '12345',
  'qwerty',
  'abc123',
  'football',
  '123123',
  'admin'
]);

const validatePassword = (password?: string): string[] => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return errors;
  }

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include an uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must include a lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must include a number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must include a special character');
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return errors;
};

// Helper to set cookie
const setAuthCookie = (res: any, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
};

const verifyRecaptcha = async (token?: string) => {
  if (!env.recaptchaSecret) return { success: true };

  if (!token) {
    return { success: false, error: 'Missing reCAPTCHA token' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: new URLSearchParams({
        secret: env.recaptchaSecret,
        response: token
      })
    });

    if (!response.ok) {
      return { success: false, error: 'Unable to verify reCAPTCHA' };
    }

    const data = (await response.json()) as { success: boolean };
    if (!data.success) {
      return { success: false, error: 'Failed reCAPTCHA verification' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Unexpected error during reCAPTCHA verification' };
  }
};

router.post('/register', async (req, res, next) => {
  try {
    const { organization, contactName, email, password, recaptchaToken } = req.body;
    const errors: Record<string, string[]> = {};

    if (!organization) {
      errors.organization = ['Organization is required'];
    }

    if (!contactName) {
      errors.contactName = ['Contact name is required'];
    }

    if (!email) {
      errors.email = ['Email is required'];
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors;
    }

    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success && recaptchaResult.error) {
      errors.recaptcha = [recaptchaResult.error];
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: 'Validation failed',
        errors: { email: ['Email already registered'] }
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const id = randomUUID();

    await pool.query(
      `INSERT INTO users (id, organization, contact_name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, 'partner', 'pending')`,
      [id, organization, contactName, email, hash]
    );

    const verificationSteps = [
      'Registration submitted and pending approval'
    ];

    if (env.emailVerificationRequired) {
      verificationSteps.push('Check your email to complete verification');
    }

    res.status(201).json({
      message: 'Registration successful. Please wait for approval.',
      nextSteps: verificationSteps
    });
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
