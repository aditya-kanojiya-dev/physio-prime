import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = process.env.VERCEL_OUTPUT_DIR || path.join(root, '.vercel', 'output');
rmSync(out, { recursive: true, force: true });

execSync('npm run build -w src', { cwd: root, stdio: 'inherit' });
cpSync(path.join(root, 'dist'), path.join(out, 'static'), { recursive: true });

const func = path.join(out, 'functions', 'api.func');
mkdirSync(func, { recursive: true });
execSync('npx esbuild server/index.ts --bundle --platform=node --format=cjs --target=node20 --outfile=' + path.join(func, 'index.js'), {
  cwd: root,
  stdio: 'inherit',
});

const serverPkg = JSON.parse(readFileSync(path.join(root, 'server', 'package.json'), 'utf8'));
writeFileSync(path.join(func, 'package.json'), JSON.stringify({ dependencies: serverPkg.dependencies }, null, 2));
writeFileSync(path.join(func, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.js',
  launcherType: 'Nodejs',
}, null, 2));

writeFileSync(path.join(out, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '/api/(.*)', dest: '/api' },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' },
  ],
}, null, 2));
