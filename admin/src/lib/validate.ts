// Client-side mirrors of the server's Zod rules. The server stays the authority
// (see server/src/config.ts and the per-route schemas) -- these exist so a
// mistake is reported next to the field that caused it instead of in a toast.
// Keep the two in sync; add a rule here only when the server already enforces it.
//
// Mirrors src/lib/validate.ts. The duplication is deliberate: admin/tsconfig.json
// only includes `src`, so the two Vite apps cannot share a module without build
// config surgery that costs more than 70 duplicated lines.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\d{10}$/;
const OTP_RE = /^\d{6}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Per-field validation state. Absent key = untouched, null = now valid. */
export type Errors<K extends string> = Partial<Record<K, string | null>>;

export function required(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required`;
}

export function email(value: string): string | null {
  if (!value.trim()) return 'Email address is required';
  return EMAIL_RE.test(value.trim()) ? null : 'Enter a valid email address';
}

/** Exactly 10 digits, tolerating the spaces/dashes people paste in. */
export function phone10(value: string): string | null {
  const digits = value.replace(/[\s-]/g, '');
  if (!digits) return 'Phone number is required';
  return PHONE_RE.test(digits) ? null : 'Enter a 10-digit phone number';
}

export function minLen(value: string, min: number, label: string): string | null {
  return value.length >= min ? null : `${label} must be at least ${min} characters`;
}

export function maxLen(value: string, max: number, label: string): string | null {
  return value.length <= max ? null : `${label} must be ${max} characters or fewer`;
}

export function matches(a: string, b: string, label = 'Passwords'): string | null {
  return a === b ? null : `${label} do not match`;
}

export function otp6(value: string): string | null {
  const digits = value.replace(/\s/g, '');
  if (!digits) return 'Enter the 6-digit code';
  return OTP_RE.test(digits) ? null : 'Enter the 6-digit code';
}

export function numInRange(value: string, min: number, max: number, label: string): string | null {
  if (!value.trim()) return `${label} is required`;
  const n = Number(value);
  if (!Number.isFinite(n)) return `${label} must be a number`;
  if (n < min || n > max) return `${label} must be between ${min} and ${max}`;
  return null;
}

export function intInRange(value: string, min: number, max: number, label: string): string | null {
  const rangeError = numInRange(value, min, max, label);
  if (rangeError) return rangeError;
  return Number.isInteger(Number(value)) ? null : `${label} must be a whole number`;
}

export function slug(value: string, label = 'Slug'): string | null {
  if (!value.trim()) return `${label} is required`;
  return SLUG_RE.test(value) ? null : `${label} may only use lowercase letters, numbers and hyphens`;
}

export function file(
  value: File | null | undefined,
  { label, types, maxMb }: { label: string; types: string[]; maxMb: number },
): string | null {
  if (!value) return `${label} is required`;
  if (types.length && !types.some((t) => value.type === t || value.type.startsWith(`${t}/`)))
    return `${label} must be ${types.map((t) => t.replace('image/', '').toUpperCase()).join(' or ')}`;
  if (value.size > maxMb * 1024 * 1024) return `${label} must be under ${maxMb}MB`;
  return null;
}

/** True when any field failed, so a submit handler can bail with one line. */
export function hasErrors(errors: Record<string, string | null | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
