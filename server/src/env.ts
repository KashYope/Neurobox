import dotenv from 'dotenv';

dotenv.config({ path: process.env.SERVER_ENV ?? process.env.ENV_FILE });

const int = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (value: string | undefined): string[] => {
  if (!value) return [];

  const allowedSchemes = new Set(['http:', 'https:']);
  const uniqueOrigins = new Set<string>();

  const entries = value.split(',').map(entry => entry.trim()).filter(Boolean);
  for (const entry of entries) {
    let parsed: URL;

    try {
      parsed = new URL(entry);
    } catch (error) {
      throw new Error(`Invalid CORS origin "${entry}": ${(error as Error).message}`);
    }

    if (!allowedSchemes.has(parsed.protocol)) {
      throw new Error(`Invalid CORS origin "${entry}": only http and https are allowed`);
    }

    if (!parsed.hostname) {
      throw new Error(`Invalid CORS origin "${entry}": hostname is required`);
    }

    if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error(
        `Invalid CORS origin "${entry}": must not include path, query parameters, or fragments`
      );
    }

    uniqueOrigins.add(parsed.origin);
  }

  return Array.from(uniqueOrigins);
};

export const loadEnv = (processEnv: NodeJS.ProcessEnv = process.env) => {
  const isProduction = processEnv.NODE_ENV === 'production';
  const allowedOrigins = parseOrigins(processEnv.CORS_ORIGINS);

  if (isProduction && allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must be set when NODE_ENV=production');
  }

  return {
    port: int(processEnv.PORT, 4000),
    databaseUrl:
      processEnv.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/neurobox',
    jwtSecret: processEnv.JWT_SECRET || 'local-dev-secret',
    allowedOrigins,
    googleTranslateApiKey: processEnv.GOOGLE_TRANSLATE_API_KEY,
    isProduction
  };
};

export const env = loadEnv();

export type LoadEnvResult = ReturnType<typeof loadEnv>;
