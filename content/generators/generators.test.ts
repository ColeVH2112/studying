import { describe, it, expect } from 'vitest';
import { generators } from './index';
import { generateItem, GENERATORS, ALL_CATEGORIES } from './mental-math';
import { rngFromString } from '../../src/engine/rng';
import { materialize } from '../../src/engine/materialize';
import { parseNumeric } from '../../src/engine/grading';
import type { Problem } from '../../src/types';

const dieReroll = generators.find((g) => g.id === 'gen-die-reroll')!;
const ruin = generators.find((g) => g.id === 'gen-gamblers-ruin')!;

describe('gen-die-reroll: answer re-derived independently', () => {
  for (const seed of ['s1', 's2', 's3']) {
    it(`seed ${seed}`, () => {
      const inst = dieReroll.generate(rngFromString(seed));
      const n = Number(/fair (\d+)-sided/.exec(inst.statement)![1]);
      const t = (n + 1) / 2;
      // Independent method: value of play = (1/n) Σ_x max(first roll x, fresh-roll value t).
      let sum = 0;
      for (let x = 1; x <= n; x++) sum += Math.max(x, t);
      const expected = sum / n;
      expect(inst.answer.type).toBe('numeric');
      if (inst.answer.type === 'numeric') expect(inst.answer.value).toBeCloseTo(expected, 10);
    });
  }
});

describe('gen-gamblers-ruin: answer re-derived independently', () => {
  for (const seed of ['a', 'b', 'c']) {
    it(`seed ${seed}`, () => {
      const inst = ruin.generate(rngFromString(seed));
      const i = Number(/start with \\\$(\d+)/.exec(inst.statement)![1]);
      const N = Number(/or \\\$(\d+)/.exec(inst.statement)![1]);
      // Independent method: fair gambler's ruin hitting prob is the start fraction.
      const expected = i / N;
      expect(inst.answer.type).toBe('numeric');
      if (inst.answer.type === 'numeric') expect(inst.answer.value).toBeCloseTo(expected, 10);
      // display fraction parses to the same value
      if (inst.answer.type === 'numeric' && inst.answer.display) {
        const p = parseNumeric(inst.answer.display);
        expect(p.ok && Math.abs(p.value - expected) < 1e-9).toBe(true);
      }
    });
  }
});

describe('materialize: fresh numbers across reviews', () => {
  it('different reviewCounts yield varied statements for a generator', () => {
    const item = { kind: 'generator', problem: dieReroll } as const;
    const statements = new Set<string>();
    for (let rc = 0; rc < 8; rc++) statements.add(materialize(item, rc).statement);
    expect(statements.size).toBeGreaterThan(1);
  });

  it('is stable within a single review (same seed → same instance)', () => {
    const item = { kind: 'generator', problem: ruin } as const;
    expect(materialize(item, 3).statement).toBe(materialize(item, 3).statement);
  });

  it('varies by instanceKey so a re-served card shows fresh numbers', () => {
    // same reviewCount, different per-card keys → the feed must not repeat the
    // identical instance when a generator is recycled within a session.
    const item = { kind: 'generator', problem: dieReroll } as const;
    const statements = new Set<string>();
    for (let i = 0; i < 8; i++) statements.add(materialize(item, 0, `e${i}`).statement);
    expect(statements.size).toBeGreaterThan(1);
    // and a given key is still deterministic
    expect(materialize(item, 0, 'e3').statement).toBe(materialize(item, 0, 'e3').statement);
  });

  it('passes static problems through unchanged', () => {
    const p: Problem = { id: 'x', topic: 'bayes', techniques: ['symmetry'], difficulty: 1, source: 'original',
      statement: 'hello', hints: ['a', 'b', 'c'], solution: '**Pattern:** y',
      answer: { type: 'numeric', value: 2 }, estMinutes: 1 };
    const r = materialize({ kind: 'static', problem: p }, 0);
    expect(r.statement).toBe('hello');
    expect(r.isGenerated).toBe(false);
  });
});

describe('mental-math generators', () => {
  it('every category produces a numerically-checkable item', () => {
    for (const cat of ALL_CATEGORIES) {
      const item = generateItem(cat, rngFromString(`mm-${cat}`));
      expect(item.category).toBe(cat);
      expect(Number.isFinite(item.value)).toBe(true);
      expect(item.prompt.length).toBeGreaterThan(0);
    }
  });

  it('arithmetic answers are exact', () => {
    // drive a known sequence and recompute
    for (let i = 0; i < 50; i++) {
      const r = rngFromString(`mul-${i}`);
      const item = GENERATORS['mul-2x2'](r);
      const [a, b] = item.prompt.split('×').map((x) => Number(x.trim()));
      expect(item.value).toBe((a as number) * (b as number));
    }
  });

  it('decimal→fraction items: the displayed fraction equals the decimal value', () => {
    for (let i = 0; i < 50; i++) {
      const item = GENERATORS['dec-to-frac'](rngFromString(`d2f-${i}`));
      const p = parseNumeric(item.answer);
      expect(p.ok).toBe(true);
      if (p.ok) expect(Math.abs(p.value - item.value)).toBeLessThan(1e-9);
    }
  });
});
