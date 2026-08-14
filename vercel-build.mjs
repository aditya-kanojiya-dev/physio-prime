import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = process.env.VERCEL_OUTPUT_DIR || path.join(root, '.vercel', 'output');
rmSync(out, { recursive: true, force: true });

execSync('npm run build -w src', { cwd: root, stdio: 'inherit' });
cpSync(path.join(root, 'dist'), path.join(out, 'static'), { recursive: true });

const func = path.join(out, 'functions', 'api.func');
mkdirSync(func, { recursive: true });
execSync('npx esbuild server/index.ts --bundle --platform=node --format=esm --target=node20 --packages=external --outfile=' + path.join(func, 'index.js'), {
  cwd: root,
  stdio: 'inherit',
});

const apiPkg = JSON.parse(await (await import('node:fs/promises')).readFile(path.join(root, 'server', 'package.json'), 'utf8'));
writeFileSync(path.join(func, 'package.json'), JSON.stringify({ type: 'module', dependencies: apiPkg.dependencies }, null, 2));
