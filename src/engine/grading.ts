// Answer parsing & checking — SPEC §7.3. Pure.

import type { AnswerSpec } from '../types';

export type ParseResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

const FORMAT_HELP = 'Enter a decimal (e.g. 0.4, -1.25) or a fraction (e.g. 2/5, -20/19).';

/** Parse a numeric answer string. Accepts decimals and fractions only; trims
 *  whitespace; rejects everything else (caller shows inline format help). */
export function parseNumeric(raw: string): ParseResult {
  const s = raw.trim();
  if (s === '') return { ok: false, error: FORMAT_HELP };

  // Fraction: optional sign, integer / integer (allow surrounding spaces handled by trim).
  const frac = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/.exec(s);
  if (frac) {
    const num = Number(frac[1]);
    const den = Number(frac[2]);
    if (den === 0) return { ok: false, error: 'Denominator cannot be zero.' };
    return { ok: true, value: num / den };
  }

  // Decimal / integer: optional sign, digits with optional single decimal point.
  // Reject scientific notation and stray characters to keep the contract tight.
  const dec = /^[+-]?(\d+\.?\d*|\.\d+)$/.exec(s);
  if (dec) {
    const v = Number(s);
    if (Number.isFinite(v)) return { ok: true, value: v };
  }

  return { ok: false, error: FORMAT_HELP };
}

/** Tolerance used to accept a numeric answer: explicit per-problem override, else
 *  0.5% relative, floored at 1e-9 (so exact zero still matches exactly-ish). */
export function toleranceFor(value: number, tolerance?: number): number {
  return Math.max(1e-9, tolerance ?? 0.005 * Math.abs(value));
}

/** Is parsed value `x` within tolerance of the spec value? */
export function numericCorrect(x: number, value: number, tolerance?: number): boolean {
  return Math.abs(x - value) <= toleranceFor(value, tolerance);
}

export type GradeOutcome =
  | { kind: 'numeric'; correct: boolean; parsed: number }
  | { kind: 'numeric-invalid'; error: string }
  | { kind: 'multiple-choice'; correct: boolean; chosenIndex: number }
  | { kind: 'self-graded' };

/** Grade a raw submission against an AnswerSpec.
 *  For numeric: `raw` is the text input.
 *  For multiple-choice: pass the chosen index via `choiceIndex`.
 *  For self-graded: there is nothing to check. */
export function checkAnswer(
  answer: AnswerSpec,
  submission: { raw?: string; choiceIndex?: number },
): GradeOutcome {
  switch (answer.type) {
    case 'numeric': {
      const parsed = parseNumeric(submission.raw ?? '');
      if (!parsed.ok) return { kind: 'numeric-invalid', error: parsed.error };
      return {
        kind: 'numeric',
        parsed: parsed.value,
        correct: numericCorrect(parsed.value, answer.value, answer.tolerance),
      };
    }
    case 'multiple-choice': {
      const idx = submission.choiceIndex ?? -1;
      return { kind: 'multiple-choice', chosenIndex: idx, correct: idx === answer.correctIndex };
    }
    case 'self-graded':
      return { kind: 'self-graded' };
  }
}

/** Human-readable form of the expected answer for the verdict strip. */
export function canonicalAnswer(answer: AnswerSpec): string {
  switch (answer.type) {
    case 'numeric':
      return answer.display ?? String(answer.value);
    case 'multiple-choice':
      return answer.options[answer.correctIndex] ?? '';
    case 'self-graded':
      return '';
  }
}
