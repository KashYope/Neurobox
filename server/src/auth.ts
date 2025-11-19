import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from './env.js';

export type ActorRole = 'partner' | 'moderator';

export interface TokenPayload {
  sub: string;
  role: ActorRole;
  organization?: string;
  aud?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

const extractToken = (header?: string | null): string | null => {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;
  return token;
};

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
    req.user = decoded;
  } catch {
    // ignore invalid tokens but do not block request
  }
  next();
};

export const requireRole = (role: ActorRole): RequestHandler => {
  return (req, res, next) => {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
      if (decoded.role !== role) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      req.user = decoded;
      return next();
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
};
