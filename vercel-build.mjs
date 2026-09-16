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
// so the function installs real node_modules; Vercel resolves it from node_modules.
// Vercel's Nodejs launcher also invokes the handler export as (req, res), so the
// bundle must export the express app (callable), not the { createApp } object.
const cmd = process.platform === 'win32'
  ? `npx esbuild server/index.ts --bundle --platform=node --format=cjs --target=node20 --external:isomorphic-dompurify "--footer:js=module.exports=module.exports.default" --outfile=${path.join(func, 'index.js')}`
  : ['npx esbuild server/index.ts', '--bundle', '--platform=node', '--format=cjs', '--target=node20', '--external:isomorphic-dompurify', '--footer:js=module.exports=module.exports.default', '--outfile=' + path.join(func, 'index.js')].join(' ');
execSync(cmd, { cwd: root, stdio: 'inherit' });

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
