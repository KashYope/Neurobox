import { rm } from 'node:fs/promises';
import path from 'node:path';

const root = new URL('..', import.meta.url);
const distTest = path.resolve(root.pathname, 'dist-test');
await rm(distTest, { recursive: true, force: true });
