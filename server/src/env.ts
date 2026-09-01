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
<<<<<<< ours
};

<<<<<<< ours
const parseOrigin = (value: string): string => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid CORS origin: ${value}`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('CORS_ORIGINS entries must use http or https schemes.');
  }

  if (!url.hostname) {
    throw new Error('CORS_ORIGINS entries must include a hostname.');
  }

  return url.origin;
};

const parseOrigins = (value: string | undefined): string[] => {
  const origins = list(value);

  if (!origins.length && process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGINS is required for production deployments.');
  }

  return origins.map(parseOrigin);
};

const requireEnv = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`${name} is required${process.env.NODE_ENV === 'production' ? ' in production' : ''}`);
  }

  if (process.env.NODE_ENV === 'production' && !process.env[name]) {
    throw new Error(`${name} must be set in the environment for production deployments.`);
  }

  return value;
};

export const env = {
  port: int(process.env.PORT, 4000),
  databaseUrl: requireEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/neurobox'),
  jwtSecret: requireEnv('JWT_SECRET', 'local-dev-secret'),
  allowedOrigins: parseOrigins(process.env.CORS_ORIGINS),
  googleTranslateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY
=======
=======
};

>>>>>>> theirs
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
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
};

export const env = loadEnv();

export type LoadEnvResult = ReturnType<typeof loadEnv>;
