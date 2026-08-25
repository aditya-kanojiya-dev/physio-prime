import './lib/load-env';
import { z } from 'zod';

const coreSchema = z.object({
  JWT_SECRET: z.string().min(1),
  APP_URL: z.string().min(1),
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
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
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WHATSAPP_FROM: z.string().min(1),
  TWILIO_FROM_NUMBER: z.string().min(1),
});

type Config = z.infer<typeof envSchema>;

let cached: Config | undefined;

export function getConfig(): Config {
  cached ??= envSchema.parse(process.env);
  return cached;
}
