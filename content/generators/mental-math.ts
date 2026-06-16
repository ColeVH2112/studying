// Mental-math drill generators — SPEC §7.4 / §8.2. Pure (RNG passed in).
// Categories: 2-digit × 2-digit, 3-digit ± 3-digit, division to 2dp, percent-of,
// fraction→decimal, decimal→fraction, squares of 2-digit numbers.

import type { MentalMathCategory, MentalMathItem } from '../../src/types';
import { randInt, pick } from '../../src/engine/rng';

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Fractions with terminating decimals, used by both frac↔dec categories. */
const CLEAN_DENOMS = [2, 4, 5, 8, 10, 16, 20, 25, 40, 50] as const;

function cleanFraction(rng: () => number): { num: number; den: number; dec: number } {
  const den = pick(rng, CLEAN_DENOMS);
  const num = randInt(rng, 1, den - 1);
  const g = gcd(num, den);
  return { num: num / g, den: den / g, dec: num / den };
}

type Gen = (rng: () => number) => MentalMathItem;

const mul2x2: Gen = (rng) => {
  const a = randInt(rng, 11, 99);
  const b = randInt(rng, 11, 99);
  const v = a * b;
  return { prompt: `${a} × ${b}`, answer: String(v), value: v, category: 'mul-2x2' };
};

const addsub3: Gen = (rng) => {
  let a = randInt(rng, 100, 999);
  let b = randInt(rng, 100, 999);
  const sub = rng() < 0.5;
  if (sub && b > a) [a, b] = [b, a]; // keep non-negative
  const v = sub ? a - b : a + b;
  return { prompt: `${a} ${sub ? '−' : '+'} ${b}`, answer: String(v), value: v, category: 'addsub-3' };
};

const div2dp: Gen = (rng) => {
  const den = randInt(rng, 3, 19);
  const n = randInt(rng, 2 * den, 40 * den);
  const v = n / den;
  return {
    prompt: `${n} ÷ ${den}`,
    answer: v.toFixed(2),
    value: v,
    tolerance: 0.005,
    category: 'div-2dp',
  };
};

const percentOf: Gen = (rng) => {
  const p = randInt(rng, 1, 19) * 5; // 5..95
  const base = randInt(rng, 5, 80) * 5; // 25..400
  const v = (p / 100) * base;
  return {
    prompt: `${p}% of ${base}`,
    answer: Number.isInteger(v) ? String(v) : v.toFixed(2),
    value: v,
    tolerance: 0.005,
    category: 'percent-of',
  };
};

const fracToDec: Gen = (rng) => {
  const { num, den, dec } = cleanFraction(rng);
  return {
    prompt: `${num}/${den} = ?`,
    answer: String(dec),
    value: dec,
    tolerance: 0.0005,
    category: 'frac-to-dec',
  };
};

const decToFrac: Gen = (rng) => {
  const { num, den, dec } = cleanFraction(rng);
  return {
    prompt: `${dec} = ?/?`,
    answer: `${num}/${den}`,
    value: dec, // grading parses the entered fraction to a decimal
    tolerance: 0.0005,
    category: 'dec-to-frac',
  };
};

const square2: Gen = (rng) => {
  const n = randInt(rng, 11, 99);
  const v = n * n;
  return { prompt: `${n}²`, answer: String(v), value: v, category: 'square-2' };
};

export const GENERATORS: Record<MentalMathCategory, Gen> = {
  'mul-2x2': mul2x2,
  'addsub-3': addsub3,
  'div-2dp': div2dp,
  'percent-of': percentOf,
  'frac-to-dec': fracToDec,
  'dec-to-frac': decToFrac,
  'square-2': square2,
};

export const CATEGORY_LABELS: Record<MentalMathCategory, string> = {
  'mul-2x2': '2-digit × 2-digit',
  'addsub-3': '3-digit ± 3-digit',
  'div-2dp': 'division to 2dp',
  'percent-of': 'percent-of',
  'frac-to-dec': 'fraction → decimal',
  'dec-to-frac': 'decimal → fraction',
  'square-2': 'squares of 2-digit',
};

export const ALL_CATEGORIES = Object.keys(GENERATORS) as MentalMathCategory[];

/** Generate one item from a specific category. */
export function generateItem(category: MentalMathCategory, rng: () => number): MentalMathItem {
  return GENERATORS[category](rng);
}

/** Generate one item from a uniformly-random category among `categories`. */
export function generateFrom(categories: MentalMathCategory[], rng: () => number): MentalMathItem {
  const cat = pick(rng, categories.length ? categories : ALL_CATEGORIES);
  return generateItem(cat, rng);
}
