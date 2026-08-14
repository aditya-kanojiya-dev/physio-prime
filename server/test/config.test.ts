import { describe, it, expect } from 'vitest';
import { getConfig, getCoreConfig } from '../src/config';

describe('config split', () => {
  it('getCoreConfig parses JWT_SECRET from the current .env', () => {
    expect(getCoreConfig().JWT_SECRET).toBe('dev-secret-change-in-production');
  });

  it('getConfig throws while provider keys are empty (dev proof of the split)', () => {
    expect(() => getConfig()).toThrow();
  });
});
