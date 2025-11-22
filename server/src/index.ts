import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { exercisesRouter } from './routes/exercises.js';
import { moderationRouter } from './routes/moderation.js';
import { stringsRouter } from './routes/strings.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { env } from './env.js';
import { optionalAuth } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers with Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com"], // For Gemini API
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"], // For service workers
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [], // Enable HTTPS upgrade
      },
    },
    crossOriginEmbedderPolicy: false, // Avoid breaking external resources
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: env.allowedOrigins.length ? env.allowedOrigins : undefined,
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

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error' });
});

app.listen(env.port, () => {
  console.log(`API listening on port ${env.port}`);
});
