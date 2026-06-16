import { describe, it, expect } from 'vitest';
import { parseNumeric, numericCorrect, toleranceFor, checkAnswer, canonicalAnswer } from './grading';
import type { AnswerSpec } from '../types';

describe('parseNumeric', () => {
  it('parses decimals incl. signs and leading dot', () => {
    expect(parseNumeric('0.4')).toEqual({ ok: true, value: 0.4 });
    expect(parseNumeric('-1.25')).toEqual({ ok: true, value: -1.25 });
    expect(parseNumeric('  4.25 ')).toEqual({ ok: true, value: 4.25 });
    expect(parseNumeric('.5')).toEqual({ ok: true, value: 0.5 });
    expect(parseNumeric('7')).toEqual({ ok: true, value: 7 });
  });

  it('parses fractions incl. signs and spaces around slash', () => {
    expect(parseNumeric('2/5')).toEqual({ ok: true, value: 0.4 });
    expect(parseNumeric('-20/19').ok).toBe(true);
    expect((parseNumeric('-20/19') as { value: number }).value).toBeCloseTo(-20 / 19, 12);
    expect(parseNumeric('3 / 4')).toEqual({ ok: true, value: 0.75 });
  });

  it('rejects garbage and empty', () => {
    expect(parseNumeric('').ok).toBe(false);
    expect(parseNumeric('abc').ok).toBe(false);
    expect(parseNumeric('1.2.3').ok).toBe(false);
    expect(parseNumeric('1e5').ok).toBe(false); // scientific notation rejected by the tight contract
    expect(parseNumeric('5%').ok).toBe(false);
  });

  it('rejects division by zero', () => {
    expect(parseNumeric('3/0').ok).toBe(false);
  });
});

describe('tolerance', () => {
  it('defaults to 0.5% relative, floored at 1e-9', () => {
    expect(toleranceFor(100)).toBeCloseTo(0.5, 12);
    expect(toleranceFor(0)).toBe(1e-9);
  });

  it('honors explicit override', () => {
    expect(toleranceFor(100, 0.001)).toBe(0.001);
  });

  it('numericCorrect respects edges', () => {
    // 20/19 ≈ 1.0526..., tolerance 0.001 (from the couples problem)
    expect(numericCorrect(1.0526315789, 1.0526315789, 0.001)).toBe(true);
    expect(numericCorrect(1.053, 1.0526315789, 0.001)).toBe(true);
    expect(numericCorrect(1.06, 1.0526315789, 0.001)).toBe(false);
    // default 0.5% on value 0.4 → tolerance 0.002
    expect(numericCorrect(0.401, 0.4)).toBe(true);
    expect(numericCorrect(0.41, 0.4)).toBe(false);
  });
});

describe('checkAnswer', () => {
  it('grades numeric correct/incorrect/invalid', () => {
    const a: AnswerSpec = { type: 'numeric', value: 0.4, display: '2/5' };
    expect(checkAnswer(a, { raw: '2/5' })).toEqual({ kind: 'numeric', correct: true, parsed: 0.4 });
    expect(checkAnswer(a, { raw: '0.4' })).toEqual({ kind: 'numeric', correct: true, parsed: 0.4 });
    expect(checkAnswer(a, { raw: '1.2' })).toMatchObject({ kind: 'numeric', correct: false });
    expect(checkAnswer(a, { raw: '??' }).kind).toBe('numeric-invalid');
  });

  it('grades multiple-choice by index', () => {
    const a: AnswerSpec = { type: 'multiple-choice', options: ['x', 'y', 'z'], correctIndex: 1 };
    expect(checkAnswer(a, { choiceIndex: 1 })).toEqual({ kind: 'multiple-choice', correct: true, chosenIndex: 1 });
    expect(checkAnswer(a, { choiceIndex: 0 })).toEqual({ kind: 'multiple-choice', correct: false, chosenIndex: 0 });
  });

  it('passes self-graded through', () => {
    expect(checkAnswer({ type: 'self-graded' }, {})).toEqual({ kind: 'self-graded' });
  });
});

describe('canonicalAnswer', () => {
  it('prefers display, falls back to value/option', () => {
    expect(canonicalAnswer({ type: 'numeric', value: 0.4, display: '2/5' })).toBe('2/5');
    expect(canonicalAnswer({ type: 'numeric', value: 4.25 })).toBe('4.25');
    expect(canonicalAnswer({ type: 'multiple-choice', options: ['a', 'b'], correctIndex: 1 })).toBe('b');
    expect(canonicalAnswer({ type: 'self-graded' })).toBe('');
  });
});
