import { describe, it, expect } from 'vitest';
import {
  hasErrors,
  intInRange,
  numInRange,
  slug,
  file,
  type Errors,
} from '../../src/lib/validate';

// The client mirrors of the server's Zod rules are pure functions, so they are
// testable without a database even though the suite's setup demands one.
describe('client validation mirrors', () => {
  it('intInRange rejects decimals the server z.number().int() would also reject', () => {
    expect(intInRange('5', 0, 100, 'Sort order')).toBeNull();
    expect(intInRange('0', 0, 100, 'Sort order')).toBeNull();
    expect(intInRange('100', 0, 100, 'Sort order')).toBeNull();
    expect(intInRange('2.5', 0, 100, 'Sort order')).toMatch(/whole number/);
    expect(intInRange('-1', 0, 100, 'Sort order')).toMatch(/between/);
    expect(intInRange('101', 0, 100, 'Sort order')).toMatch(/between/);
  });

  it('numInRange treats blank and non-numeric input as distinct errors', () => {
    expect(numInRange('', 0, 100, 'Home fee')).toMatch(/required/);
    expect(numInRange('abc', 0, 100, 'Home fee')).toMatch(/must be a number/);
    expect(numInRange('0', 0, 100, 'Home fee')).toBeNull();
  });

  it('slug rejects the trailing hyphen the form sanitizer can produce', () => {
    // CaretakerSection-style sanitize: value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    expect(slug('knee-pain')).toBeNull();
    expect(slug('knee-pain-2')).toBeNull();
    expect(slug('knee-pain-')).toMatch(/lowercase/);
    expect(slug('Knee Pain')).toMatch(/lowercase/);
    expect(slug('  ')).toMatch(/required/);
  });

  it('file enforces the declared MIME types and size cap', () => {
    const opts = { label: 'Resume', types: ['application/pdf'], maxMb: 10 };
    expect(file(null, opts)).toMatch(/required/);
    expect(file(new File(['x'], 'cv.pdf', { type: 'application/pdf' }), opts)).toBeNull();
    expect(file(new File(['x'], 'cv.png', { type: 'image/png' }), opts)).toMatch(/PDF/);
    const big = { ...opts, maxMb: 0 };
    expect(file(new File(['x'], 'cv.pdf', { type: 'application/pdf' }), big)).toMatch(/under 0MB/);
  });

  it('hasErrors only fails on messages, so a re-validated field set to null passes', () => {
    const errors: Errors<'name' | 'email'> = { name: null, email: undefined };
    expect(hasErrors(errors)).toBe(false);
    expect(hasErrors({ ...errors, name: 'Name is required' })).toBe(true);
  });

  // money paths: /doctor/payouts/request and category/department commissions
  it('mirrors payouts: z.number().int().positive() on paise, not rupees', () => {
    const paise = (rupees: string) => Math.round(Number(rupees) * 100);
    // 0.005 rupees rounds to 1 paise, 0.001 rounds to 0 and must not be submitted
    expect(paise('0.005')).toBe(1);
    for (const bad of ['0.001', '-10', '50abc', '', 'abc']) {
      const p = paise(bad.trim());
      expect(Number.isInteger(p) && p > 0).toBe(false);
    }
  });

  it('mirrors commissions: platformFeePercent int 0..100', () => {
    expect(intInRange('0', 0, 100, 'Commission')).toBeNull();
    expect(intInRange('100', 0, 100, 'Commission')).toBeNull();
    // a typed decimal or negative would 400 the whole commission batch
    expect(intInRange('12.5', 0, 100, 'Commission')).toMatch(/whole number/);
    expect(intInRange('-1', 0, 100, 'Commission')).toMatch(/between/);
  });
});
