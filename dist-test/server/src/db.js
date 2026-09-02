import { Pool } from 'pg';
import { env } from './env.js';
export const pool = new Pool({
    connectionString: env.databaseUrl,
    allowExitOnIdle: process.env.NODE_ENV === 'test'
});
export const withClient = async (fn) => {
    return fn(pool);
};
