import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isJoinableNow } from '../src/lib/slots';

// Slot times are IST wall-clock (UTC+5:30), so these instants are chosen so the
// IST clock reads 10:00 on 2026-09-28.
const AT_IST_10AM = '2026-09-28T04:30:00.000Z';
const DAY = '2026-09-28';

const appt = (over: Partial<Parameters<typeof isJoinableNow>[0]> = {}) => ({
  date: DAY,
  timeSlot: '10:00-10:45',
  mode: 'online',
  status: 'upcoming',
  ...over,
});

describe('isJoinableNow', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is joinable during the slot', () => {
    vi.setSystemTime(new Date(AT_IST_10AM));
    expect(isJoinableNow(appt())).toBe(true);
  });

  it('is joinable 15 minutes before the slot starts', () => {
    vi.setSystemTime(new Date('2026-09-28T04:15:00.000Z')); // IST 09:45
    expect(isJoinableNow(appt())).toBe(true);
  });

  it('is not joinable before the 15 minute lead-in', () => {
    vi.setSystemTime(new Date('2026-09-28T04:14:00.000Z')); // IST 09:44
    expect(isJoinableNow(appt())).toBe(false);
  });

  it('is not joinable after the slot ends', () => {
    vi.setSystemTime(new Date('2026-09-28T05:16:00.000Z')); // IST 10:46
    expect(isJoinableNow(appt())).toBe(false);
  });

  it('is not joinable on another day, for home visits, or once cancelled', () => {
    vi.setSystemTime(new Date(AT_IST_10AM));
    expect(isJoinableNow(appt({ date: '2026-09-29' }))).toBe(false);
    expect(isJoinableNow(appt({ mode: 'home' }))).toBe(false);
    expect(isJoinableNow(appt({ status: 'cancelled' }))).toBe(false);
    expect(isJoinableNow(appt({ status: 'completed' }))).toBe(false);
  });
});
