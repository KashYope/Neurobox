import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.SERVER_ENV ?? process.env.ENV_FILE });

const MIGRATIONS_DIR = new URL('../migrations', import.meta.url).pathname;

const main = async () => {
  const databaseUrl =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/neurobox';
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const migrations = (await readdir(MIGRATIONS_DIR))
      .filter(file => file.endsWith('.sql'))
      .sort();
    for (const file of migrations) {
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
      await pool.query(sql);
      console.log(`Applied migration ${file}`);
    }
  } finally {
    await pool.end();
  }
};

main().catch(error => {
  console.error('Migration failed', error);
  process.exit(1);
});
