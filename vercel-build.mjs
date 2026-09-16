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
// ponytail: isomorphic-dompurify pulls in jsdom, whose bundled copy crashes at
// require-time (reads default-stylesheet.css from the wrong path). Externalize it
// and npm-install it inside the func dir below (Vercel does NOT install .func
// dependencies itself — the examples ship node_modules physically in the dir).
// Vercel's Nodejs launcher also invokes the handler export as (req, res), so the
// bundle must export the express app (callable), not the { createApp } object.
const esbuildArgs = [
  'npx esbuild server/index.ts',
  '--bundle',
  '--platform=node',
  '--format=cjs',
  '--target=node20',
  '--external:isomorphic-dompurify',
  '--footer:js=module.exports=module.exports.default',
  '--outfile=' + path.join(func, 'index.js'),
];
const cmd = process.platform === 'win32'
  ? 'npx esbuild server/index.ts --bundle --platform=node --format=cjs --target=node20 --external:isomorphic-dompurify "--footer:js=module.exports=module.exports.default" --outfile=' + path.join(func, 'index.js')
  : esbuildArgs.join(' ');
execSync(cmd, { cwd: root, stdio: 'inherit' });

// ponytail: jsdom29 deps (html-encoding-sniffer@6, whatwg-url@16) pull ESM-only
// @exodus/bytes -> Vercel's Node crashes on require(). jsdom26's whole chain is
// CJS-safe and DOMPurify only needs standard DOM APIs; pin it via overrides.
writeFileSync(path.join(func, 'package.json'), JSON.stringify({
  dependencies: { 'isomorphic-dompurify': '^3.19.0' },
  overrides: { 'jsdom': '26.1.0' },
}, null, 2));
execSync('npm install --omit=dev', { cwd: func, stdio: 'inherit' });
writeFileSync(path.join(func, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs24.x',
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
