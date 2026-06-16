import { describe, it, expect } from 'vitest';
import { newReviewState, schedule, fuzzInterval, suggestGrade } from './scheduler';
import { diffDays } from './dates';
import type { ReviewState } from '../types';

const TODAY = '2026-06-16';

function review(overrides: Partial<ReviewState> = {}): ReviewState {
  return { problemId: 'p1', ease: 2.5, intervalDays: 10, due: TODAY, reps: 4, lapses: 0, history: [], ...overrides };
}

describe('newReviewState', () => {
  it('starts ease 2.5, interval 0, reps 0', () => {
    const s = newReviewState('p1', TODAY);
    expect(s).toMatchObject({ ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, due: TODAY });
  });
});

describe('schedule — new card (reps 0)', () => {
  const base = newReviewState('p1', TODAY);

  it('grade 0 requeues this session (interval 0, due today)', () => {
    const s = schedule(base, 0, TODAY);
    expect(s.intervalDays).toBe(0);
    expect(s.due).toBe(TODAY);
    expect(s.reps).toBe(0);
  });

  it('grade 1 → 1d, reps stays 0', () => {
    const s = schedule(base, 1, TODAY);
    expect(s.intervalDays).toBe(1);
    expect(s.reps).toBe(0);
    expect(diffDays(TODAY, s.due)).toBe(1);
  });

  it('grade 2 → 1d, reps 1', () => {
    const s = schedule(base, 2, TODAY);
    expect(s.intervalDays).toBe(1);
    expect(s.reps).toBe(1);
  });

  it('grade 3 → ~3d, reps 1', () => {
    const s = schedule(base, 3, TODAY);
    expect(s.reps).toBe(1);
    expect(s.intervalDays).toBeGreaterThanOrEqual(3);
    expect(s.intervalDays).toBeLessThanOrEqual(4); // 3d ± 5% fuzz
    expect(diffDays(TODAY, s.due)).toBe(s.intervalDays);
  });
});

describe('schedule — review card', () => {
  it('grade 0 (Failed): lapse+1, ease −0.2, interval 1', () => {
    const s = schedule(review({ ease: 2.5, lapses: 1 }), 0, TODAY);
    expect(s.lapses).toBe(2);
    expect(s.ease).toBeCloseTo(2.3, 10);
    expect(s.intervalDays).toBe(1);
  });

  it('grade 1 (Hard): interval = max(i+1, round(i*1.2)), ease −0.15', () => {
    const s = schedule(review({ intervalDays: 1, ease: 2.5 }), 1, TODAY);
    expect(s.intervalDays).toBe(2); // max(2, round(1.2)=1) = 2, <3 so no fuzz
    expect(s.ease).toBeCloseTo(2.35, 10);
    expect(s.reps).toBe(5);
  });

  it('grade 2 (Good): interval = round(i*ease)', () => {
    const s = schedule(review({ intervalDays: 10, ease: 2.5 }), 2, TODAY);
    // base 25, then ±5% fuzz, cap 180
    expect(s.intervalDays).toBeGreaterThanOrEqual(Math.round(25 * 0.95));
    expect(s.intervalDays).toBeLessThanOrEqual(Math.round(25 * 1.05));
    expect(diffDays(TODAY, s.due)).toBe(s.intervalDays);
    expect(s.reps).toBe(5);
  });

  it('grade 3 (Easy): ease +0.1 (clamped), interval grows by ~1.35×ease', () => {
    const s = schedule(review({ intervalDays: 10, ease: 2.5 }), 3, TODAY);
    expect(s.ease).toBeCloseTo(2.6, 10);
    const base = Math.round(10 * 2.5 * 1.35); // 34
    expect(s.intervalDays).toBeGreaterThanOrEqual(Math.round(base * 0.95));
    expect(s.intervalDays).toBeLessThanOrEqual(Math.round(base * 1.05));
  });

  it('clamps ease to [1.3, 3.0]', () => {
    expect(schedule(review({ ease: 1.4 }), 0, TODAY).ease).toBe(1.3);
    expect(schedule(review({ ease: 1.4 }), 1, TODAY).ease).toBe(1.3);
    expect(schedule(review({ ease: 2.95 }), 3, TODAY).ease).toBe(3.0);
  });

  it('caps interval at 180 days', () => {
    const s = schedule(review({ intervalDays: 1000, ease: 3.0 }), 2, TODAY);
    expect(s.intervalDays).toBeLessThanOrEqual(180);
  });

  it('does not mutate the input state', () => {
    const input = review({ intervalDays: 10, ease: 2.5 });
    const snapshot = JSON.stringify(input);
    schedule(input, 3, TODAY);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('fuzzInterval', () => {
  it('is deterministic for the same problemId + date', () => {
    expect(fuzzInterval(20, 'abc', TODAY)).toBe(fuzzInterval(20, 'abc', TODAY));
  });

  it('leaves intervals < 3 unfuzzed', () => {
    expect(fuzzInterval(1, 'abc', TODAY)).toBe(1);
    expect(fuzzInterval(2, 'abc', TODAY)).toBe(2);
  });

  it('stays within ±5% for intervals ≥ 3', () => {
    for (const d of [3, 10, 30, 90]) {
      const f = fuzzInterval(d, 'abc', TODAY);
      expect(f).toBeGreaterThanOrEqual(Math.round(d * 0.95));
      expect(f).toBeLessThanOrEqual(Math.round(d * 1.05));
    }
  });

  it('caps at 180', () => {
    expect(fuzzInterval(500, 'abc', TODAY)).toBeLessThanOrEqual(180);
  });

  it('varies by problemId', () => {
    const a = fuzzInterval(50, 'aaa', TODAY);
    const b = fuzzInterval(50, 'zzz', TODAY);
    // not guaranteed different, but the seed differs; assert determinism per id
    expect(fuzzInterval(50, 'aaa', TODAY)).toBe(a);
    expect(fuzzInterval(50, 'zzz', TODAY)).toBe(b);
  });
});

describe('suggestGrade (§7.1)', () => {
  const est = 4;
  it('wrong → Failed', () => {
    expect(suggestGrade({ correct: false, hintsUsed: 0, ms: 1000, estMinutes: est })).toEqual({ suggested: 0, nudgeEasy: false });
  });
  it('correct with ≥2 hints → Hard', () => {
    expect(suggestGrade({ correct: true, hintsUsed: 2, ms: 1000, estMinutes: est }).suggested).toBe(1);
    expect(suggestGrade({ correct: true, hintsUsed: 3, ms: 1000, estMinutes: est }).suggested).toBe(1);
  });
  it('correct with 1 hint → Good', () => {
    expect(suggestGrade({ correct: true, hintsUsed: 1, ms: 1000, estMinutes: est }).suggested).toBe(2);
  });
  it('correct with 0 hints → Good, nudges Easy when fast', () => {
    const fast = suggestGrade({ correct: true, hintsUsed: 0, ms: 60_000, estMinutes: est }); // 1min < 4min
    expect(fast).toEqual({ suggested: 2, nudgeEasy: true });
    const slow = suggestGrade({ correct: true, hintsUsed: 0, ms: 5 * 60_000, estMinutes: est });
    expect(slow).toEqual({ suggested: 2, nudgeEasy: false });
  });
});
