import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { ZodError } from 'zod';
import { exercisesRouter } from './routes/exercises.js';
import { moderationRouter } from './routes/moderation.js';
import { stringsRouter } from './routes/strings.js';
import { authLimiter, authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { env, type LoadEnvResult } from './env.js';
import { optionalAuth } from './auth.js';
import { seedDatabaseIfEmpty } from './utils/seedDatabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = (config: LoadEnvResult = env) => {
  const app = express();

  // Security headers with Content Security Policy
  const isDevelopment = !config.isProduction;

  console.log(`🚀 Starting server in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

<<<<<<< ours
<<<<<<< ours
const buildContentSecurityPolicy = (nonce: string) => {
  const directives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", `'nonce-${nonce}'`],
    styleSrc: ["'self'", 'https://fonts.googleapis.com', `'nonce-${nonce}'`],
    imgSrc: ["'self'", "data:", "blob:", "https://placehold.co"],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', "data:"],
    connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
    manifestSrc: ["'self'"],
    workerSrc: ["'self'", "blob:"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
  };

  if (isDevelopment) {
    directives.scriptSrc?.push("'unsafe-eval'");
    directives.connectSrc?.push('ws:', 'http://localhost:3000', 'https://localhost:3000');
  }

  return directives;
};

app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');

  helmet({
    contentSecurityPolicy: {
      directives: buildContentSecurityPolicy(res.locals.cspNonce),
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })(req, res, next);
});

const corsOrigins = env.allowedOrigins.length ? env.allowedOrigins : true;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the dist directory BEFORE API routes
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set proper cache control for different file types
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (filePath.match(/\.(js|css|json|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// API routes (with auth middleware applied only to API routes)
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/exercises', optionalAuth, exercisesRouter);
app.use('/api/moderation', optionalAuth, moderationRouter);
app.use('/api/strings', optionalAuth, stringsRouter);
app.use('/api/admin', optionalAuth, adminRouter);

// SPA fallback - serve index.html for any non-API, non-static routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Invalid request payload',
      issues: err.errors.map(issue => ({
        path: issue.path.join('.') || undefined,
        message: issue.message
      }))
    });
  }
=======
  if (isDevelopment) {
    // Disable CSP completely in development
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
      })
    );
  } else {
    // Strict CSP for production
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
            manifestSrc: ["'self'"],
            workerSrc: ["'self'", "blob:"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
      })
    );
  }

  const allowedOrigins = new Set(config.allowedOrigins);
  const allowAllOrigins = allowedOrigins.size === 0 && !config.isProduction;

  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        if (allowAllOrigins || allowedOrigins.has(requestOrigin)) {
          return callback(null, true);
        }

        return callback(new Error('CORS origin denied'));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve static files from the dist directory BEFORE API routes
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Set proper cache control for different file types
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (filePath.match(/\.(js|css|json|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  }));

  // API routes (with auth middleware applied only to API routes)
  app.use('/api/auth', authRouter);
  app.use('/api/exercises', optionalAuth, exercisesRouter);
  app.use('/api/moderation', optionalAuth, moderationRouter);
  app.use('/api/strings', optionalAuth, stringsRouter);
  app.use('/api/admin', optionalAuth, adminRouter);

  // SPA fallback - serve index.html for any non-API, non-static routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
>>>>>>> theirs

=======
  if (isDevelopment) {
    // Disable CSP completely in development
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
      })
    );
  } else {
    // Strict CSP for production
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
            manifestSrc: ["'self'"],
            workerSrc: ["'self'", "blob:"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
      })
    );
  }

  const allowedOrigins = new Set(config.allowedOrigins);
  const allowAllOrigins = allowedOrigins.size === 0 && !config.isProduction;

  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        if (allowAllOrigins || allowedOrigins.has(requestOrigin)) {
          return callback(null, true);
        }

        return callback(new Error('CORS origin denied'));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve static files from the dist directory BEFORE API routes
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Set proper cache control for different file types
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (filePath.match(/\.(js|css|json|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  }));

  // API routes (with auth middleware applied only to API routes)
  app.use('/api/auth', authRouter);
  app.use('/api/exercises', optionalAuth, exercisesRouter);
  app.use('/api/moderation', optionalAuth, moderationRouter);
  app.use('/api/strings', optionalAuth, stringsRouter);
  app.use('/api/admin', optionalAuth, adminRouter);

  // SPA fallback - serve index.html for any non-API, non-static routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

>>>>>>> theirs
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.message === 'CORS origin denied') {
      return res.status(403).json({ message: 'Origin not allowed' });
    }

    if (err instanceof ZodError) {
      return res.status(400).json({
        message: 'Invalid request payload',
        issues: err.errors.map(issue => ({
          path: issue.path.join('.') || undefined,
          message: issue.message
        }))
      });
    }

    console.error(err);
    res.status(500).json({ message: 'Unexpected server error' });
  });

  return app;
};

const app = createApp(env);

// Seed database on startup if empty
if (process.env.NODE_ENV !== 'test') {
  seedDatabaseIfEmpty().catch(error => {
    console.error('Failed to seed database:', error);
  });
<<<<<<< ours
<<<<<<< ours

=======
}

if (process.env.NODE_ENV !== 'test') {
>>>>>>> theirs
=======
}

if (process.env.NODE_ENV !== 'test') {
>>>>>>> theirs
  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });
}
<<<<<<< ours
<<<<<<< ours

export { app };
=======
>>>>>>> theirs
=======
>>>>>>> theirs
