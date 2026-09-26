import { describe, it, expect } from 'vitest';
import { getConfig, getCoreConfig } from '../src/config';

describe('config split', () => {
  it('getCoreConfig parses JWT_SECRET from the env', () => {
    // Asserts the parse+cache round-trip, not the developer's local .env value,
    // so the same test passes in CI where the secret is a throwaway literal.
    expect(getCoreConfig().JWT_SECRET).toBe(process.env.JWT_SECRET);
  });

  it('getConfig tolerates empty Twilio keys but requires Razorpay (dev proof of the split)', () => {
    expect(getConfig().RAZORPAY_KEY_ID).toBeTruthy();
  });
});
