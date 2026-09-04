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
  // Twilio is optional: skip SMS/WhatsApp when unconfigured instead of blocking payments.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  // Smartping (Satzilio) SMS: optional — OTP gating degrades to a logged error when unconfigured.
  SMARTPING_API_BASE: z.string().optional(),
  SMARTPING_API_USER: z.string().optional(),
  SMARTPING_API_PASSWORD: z.string().optional(),
  SMARTPING_SENDER: z.string().optional(),
  SMARTPING_PE_ID: z.string().optional(),
  SMARTPING_HEADER_ID: z.string().optional(),
});

type Config = z.infer<typeof envSchema>;

let cached: Config | undefined;

export function getConfig(): Config {
  cached ??= envSchema.parse(process.env);
  return cached;
}
