import { describe, it, expect } from 'vitest';
import { addDays, diffDays, toISODate, parseISODate } from './dates';

describe('dates', () => {
  it('round-trips parse/format', () => {
    expect(toISODate(parseISODate('2026-06-16'))).toBe('2026-06-16');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-06-16', 1)).toBe('2026-06-17');
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29'); // leap year
  });

  it('diffDays is signed (b − a)', () => {
    expect(diffDays('2026-06-16', '2026-06-20')).toBe(4);
    expect(diffDays('2026-06-20', '2026-06-16')).toBe(-4);
    expect(diffDays('2026-06-16', '2026-06-16')).toBe(0);
  });
});
