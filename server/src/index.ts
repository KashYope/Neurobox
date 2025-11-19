import express from 'express';
import cors from 'cors';
import { exercisesRouter } from './routes/exercises.js';
import { moderationRouter } from './routes/moderation.js';
import { env } from './env.js';
import { optionalAuth } from './auth.js';

const app = express();
app.use(
  cors({
    origin: env.allowedOrigins.length ? env.allowedOrigins : undefined,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(optionalAuth);

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/exercises', exercisesRouter);
app.use('/api/moderation', moderationRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error' });
});

app.listen(env.port, () => {
  console.log(`API listening on port ${env.port}`);
});
