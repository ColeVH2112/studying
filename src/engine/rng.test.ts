import { describe, it, expect } from 'vitest';
import { hashString, mulberry32, rngFromString, randInt, pick, shuffle } from './rng';

describe('rng', () => {
  it('hashString is deterministic and uint32', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
    expect(hashString('x') >>> 0).toBe(hashString('x'));
  });

  it('mulberry32 is reproducible for a fixed seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('produces floats in [0, 1)', () => {
    const r = mulberry32(123);
    for (let i = 0; i < 1000; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('different seeds diverge', () => {
    const a = rngFromString('seed-1')();
    const b = rngFromString('seed-2')();
    expect(a).not.toBe(b);
  });

  it('randInt stays in [min, max]', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 500; i++) {
      const v = randInt(r, 3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('pick returns a member', () => {
    const r = mulberry32(9);
    const arr = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 50; i++) expect(arr).toContain(pick(r, arr));
  });

  it('shuffle is a permutation and reproducible', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const s1 = shuffle(mulberry32(5), arr);
    const s2 = shuffle(mulberry32(5), arr);
    expect(s1).toEqual(s2);
    expect([...s1].sort((a, b) => a - b)).toEqual(arr);
    expect(s1).not.toBe(arr); // new array
  });
});
