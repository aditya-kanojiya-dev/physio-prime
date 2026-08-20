import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Vercel injects env vars directly; the .env file path is only used in local dev.
// import.meta.url is undefined inside the CJS Vercel bundle, so guard it.
const repoRoot =
  typeof import.meta.url === 'string' ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..') : process.cwd();
loadEnv({ path: path.join(repoRoot, '.env') });
