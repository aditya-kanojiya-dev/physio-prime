// PM2 production config — Hostinger VPS (Node API).
// Runs the API under PM2 so it survives reboots/restarts, and applies DB
// migrations on every (re)start via server/src/main.ts.
//
// Usage (on the VPS, from repo root):
//   pm2 start ecosystem.config.cjs
//   pm2 save            # persist across reboot
//   pm2 logs physio-api
module.exports = {
  apps: [
    {
      name: 'physio-api',
      cwd: 'server',
      script: 'npm',
      args: 'run start',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
