import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
loadEnv({ path: path.join(repoRoot, '.env') });

const coreSchema = z.object({
  JWT_SECRET: z.string().min(1),
  APP_URL: z.string().min(1),
});

export type CoreConfig = z.infer<typeof coreSchema>;

let coreCached: CoreConfig | undefined;

// Minimal config for services that must run before provider keys exist (auth).
export function getCoreConfig(): CoreConfig {
  coreCached ??= coreSchema.parse(process.env);
  return coreCached;
}

const envSchema = coreSchema.extend({
  DATABASE_URL: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WHATSAPP_FROM: z.string().min(1),
});

export type Config = z.infer<typeof envSchema>;

let cached: Config | undefined;

export function getConfig(): Config {
  cached ??= envSchema.parse(process.env);
  return cached;
}
