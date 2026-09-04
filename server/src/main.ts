import './lib/load-env';
import { runMigrations } from './db/migrate';
import { createApp } from './index';
import { pool } from './db/pool';
import { sendReminderPass } from './lib/notifications';

// Production entry: applies pending Drizzle migrations, then starts the API.
// Idempotent — safe to run on every PM2 start/deploy. tsx is used because the
// server's build step is type-check only (`tsc --noEmit`).
const port = Number(process.env.PORT) || 4000;

// Reminder job: runs once daily at the configured local hour. Safe to fire
// repeatedly because sendReminderPass dedupes by appointment. Avoids a node-cron
// dependency; re-arms itself after each run.
const REMINDER_HOUR = Number(process.env.REMINDER_HOUR) || 8;
function msUntil(hour: number, minute = 0): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}
function scheduleReminders(): void {
  setTimeout(async () => {
    try {
      const sent = await sendReminderPass();
      console.log(`[reminders] sent ${sent} reminder(s)`);
    } catch (err) {
      console.error('[reminders] pass failed:', err);
    } finally {
      scheduleReminders();
    }
  }, msUntil(REMINDER_HOUR));
}

async function start() {
  await runMigrations();
  createApp().listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
  scheduleReminders();
  console.log(`Reminder job scheduled daily at ${String(REMINDER_HOUR).padStart(2, '0')}:00 local`);
}

start().catch(async (err) => {
  console.error('Failed to start API:', err);
  await pool.end();
  process.exit(1);
});
