import dotenv from 'dotenv';

dotenv.config({ path: process.env.SERVER_ENV ?? process.env.ENV_FILE });

const int = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const list = (value: string | undefined): string[] => {
  if (!value) return [];
  return value.split(',').map(entry => entry.trim()).filter(Boolean);
};

export const env = {
  port: int(process.env.PORT, 4000),
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/neurobox',
  jwtSecret: process.env.JWT_SECRET || 'local-dev-secret',
  allowedOrigins: list(process.env.CORS_ORIGINS),
  googleTranslateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY
};
