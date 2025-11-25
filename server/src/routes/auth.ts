import { randomUUID } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { env } from '../env.js';
import { optionalAuth } from '../auth.js';

const router = Router();

const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_ATTEMPTS = 20;
const MAX_FAILURES_BEFORE_LOCK = 5;
const BASE_LOCK_MS = 60_000; // 1 minute
const MAX_LOCK_MS = 15 * 60_000; // 15 minutes

type AttemptWindow = {
  count: number;
  resetTime: number;
};

type FailureRecord = {
  failures: number;
  lockUntil?: number;
};

const requestWindows = new Map<string, AttemptWindow>();
const failedAttempts = new Map<string, FailureRecord>();

const getAttemptKey = (req: any) => `${req.ip}:${(req.body?.email ?? 'unknown').toLowerCase()}`;

export const authLimiter: RequestHandler = (req, res, next) => {
  const key = getAttemptKey(req);
  const now = Date.now();
  const window = requestWindows.get(key);

  if (!window || window.resetTime <= now) {
    requestWindows.set(key, { count: 1, resetTime: now + AUTH_WINDOW_MS });
    return next();
  }

  if (window.count >= AUTH_MAX_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((window.resetTime - now) / 1000));
    res.set('Retry-After', retryAfter.toString());
    return res.status(429).json({ message: 'Too many authentication attempts. Please try again later.' });
  }

  window.count += 1;
  next();
};

const authLockMiddleware: RequestHandler = (req, res, next) => {
  const key = getAttemptKey(req);
  const record = failedAttempts.get(key);
  const now = Date.now();

  if (record?.lockUntil && record.lockUntil > now) {
    const retryAfter = Math.max(1, Math.ceil((record.lockUntil - now) / 1000));
    res.set('Retry-After', retryAfter.toString());
    return res
      .status(429)
      .json({ message: `Too many failed attempts. Try again in ${retryAfter} seconds.` });
  }

  res.locals.authAttemptKey = key;
  next();
};

const registerFailedAttempt = (key?: string) => {
  if (!key) return undefined;

  const now = Date.now();
  const existing = failedAttempts.get(key);

  const baselineFailures = existing?.lockUntil && existing.lockUntil <= now ? 0 : existing?.failures ?? 0;
  const failures = baselineFailures + 1;
  let lockUntil: number | undefined;

  if (failures >= MAX_FAILURES_BEFORE_LOCK) {
    const backoffStep = failures - MAX_FAILURES_BEFORE_LOCK;
    const lockDuration = Math.min(BASE_LOCK_MS * 2 ** backoffStep, MAX_LOCK_MS);
    lockUntil = now + lockDuration;
  }

  failedAttempts.set(key, { failures, lockUntil });
  return lockUntil;
};

const clearFailedAttempts = (key?: string) => {
  if (key) {
    failedAttempts.delete(key);
  }
};

const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  '123456789',
  'qwerty',
  'abc123',
  'letmein',
  'monkey',
  'dragon',
  '111111',
  'iloveyou'
]);

const validatePasswordComplexity = (password: string, email?: string) => {
  const errors: string[] = [];
  const normalizedPassword = password.trim();

  if (normalizedPassword.length < 12) {
    errors.push('Password must be at least 12 characters long.');
  }

  if (!/[a-z]/.test(normalizedPassword)) {
    errors.push('Password must include at least one lowercase letter.');
  }

  if (!/[A-Z]/.test(normalizedPassword)) {
    errors.push('Password must include at least one uppercase letter.');
  }

  if (!/[0-9]/.test(normalizedPassword)) {
    errors.push('Password must include at least one number.');
  }

  if (!/[!@#$%^&*(),.?":{}|<>\-_[\]`;'/\\+=]/.test(normalizedPassword)) {
    errors.push('Password must include at least one special character.');
  }

  if (COMMON_PASSWORDS.has(normalizedPassword.toLowerCase())) {
    errors.push('Password is too common and easily guessable.');
  }

  if (email && normalizedPassword.toLowerCase().includes(email.toLowerCase())) {
    errors.push('Password must not contain your email address.');
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

router.post('/register', authLockMiddleware, async (req, res, next) => {
  try {
    const { organization, contactName, email, password } = req.body;

    if (!organization || !contactName || !email || !password) {
      const lockUntil = registerFailedAttempt(res.locals.authAttemptKey);
      if (lockUntil) {
        const retryAfter = Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000));
        res.set('Retry-After', retryAfter.toString());
      }
      return res.status(400).json({ message: 'All fields are required' });
    }

    const passwordErrors = validatePasswordComplexity(password, email);
    if (passwordErrors.length > 0) {
      const lockUntil = registerFailedAttempt(res.locals.authAttemptKey);
      if (lockUntil) {
        const retryAfter = Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000));
        res.set('Retry-After', retryAfter.toString());
      }

      return res.status(400).json({
        message: 'Password requirements not met',
        errors: {
          password: passwordErrors
        },
        requirements: {
          minLength: 12,
          requiresUppercase: true,
          requiresLowercase: true,
          requiresNumber: true,
          requiresSpecialCharacter: true,
          commonPasswordBlacklist: true
        },
        recommendedSecurity: {
          recaptcha: 'Consider adding server-side reCAPTCHA verification to reduce automated abuse.',
          emailVerification: 'Consider requiring email verification to activate accounts.'
        }
      });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      const lockUntil = registerFailedAttempt(res.locals.authAttemptKey);
      if (lockUntil) {
        const retryAfter = Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000));
        res.set('Retry-After', retryAfter.toString());
      }
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

    clearFailedAttempts(res.locals.authAttemptKey);
    res.status(201).json({ message: 'Registration successful. Please wait for approval.' });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authLockMiddleware, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const lockUntil = registerFailedAttempt(res.locals.authAttemptKey);
      if (lockUntil) {
        const retryAfter = Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000));
        res.set('Retry-After', retryAfter.toString());
      }
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      const lockUntil = registerFailedAttempt(res.locals.authAttemptKey);
      if (lockUntil) {
        const retryAfter = Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000));
        res.set('Retry-After', retryAfter.toString());
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      const lockUntil = registerFailedAttempt(res.locals.authAttemptKey);
      if (lockUntil) {
        const retryAfter = Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000));
        res.set('Retry-After', retryAfter.toString());
      }
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

    clearFailedAttempts(res.locals.authAttemptKey);
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
