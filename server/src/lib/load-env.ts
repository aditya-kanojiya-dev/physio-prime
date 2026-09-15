import { config as loadEnv } from 'dotenv';
import path from 'node:path';

// Vercel injects env vars directly; the .env file path is only used in local
// dev. Resolved from cwd (always the server workspace: PM2 cwd, npm workspace,
// vitest run dir) — survives esbuild bundling into dist/, where import.meta.url
// would walk to the wrong depth.
const repoRoot = path.resolve(process.cwd(), '..');
loadEnv({ path: path.join(repoRoot, '.env') });
