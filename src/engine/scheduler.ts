// SM-2-lite scheduler — SPEC §7.1. Pure.

import type { Grade, ReviewState } from '../types';
import { addDays } from './dates';
import { rngFromString } from './rng';

const EASE_START = 2.5;
const EASE_MIN = 1.3;
const EASE_MAX = 3.0;
const MAX_INTERVAL = 180;

const clampEase = (e: number) => Math.min(EASE_MAX, Math.max(EASE_MIN, e));

/** Fresh state for a never-seen problem. ease 2.5, interval 0 (unlearned). */
export function newReviewState(problemId: string, today: string): ReviewState {
  return {
    problemId,
    ease: EASE_START,
    intervalDays: 0,
    due: today,
    reps: 0,
    lapses: 0,
    history: [],
  };
}

/** Deterministic ±5% fuzz on intervals ≥ 3d, seeded by problemId + date.
 *  Applied before the 180-day cap. Returns whole days, ≥ 1. */
export function fuzzInterval(intervalDays: number, problemId: string, date: string): number {
  let days = intervalDays;
  if (days >= 3) {
    const f = rngFromString(`${problemId}|${date}`)(); // [0,1)
    const factor = 0.95 + 0.1 * f; // [0.95, 1.05)
    days = Math.round(days * factor);
  }
  days = Math.min(MAX_INTERVAL, days);
  return Math.max(1, days);
}

/** Core transition. Returns the next ReviewState (does not mutate input).
 *  Grade 0 (Failed) also implies "requeue this session" — the feed handles the
 *  in-session re-injection; persisted state just reflects the next due date. */
export function schedule(state: ReviewState, grade: Grade, today: string): ReviewState {
  const next: ReviewState = { ...state, history: state.history.slice() };

  if (state.reps === 0) {
    // ---- new card ----
    switch (grade) {
      case 0: // requeue this session
        next.intervalDays = 0;
        next.due = today; // interval 0 → due today
        break;
      case 1:
        next.intervalDays = 1;
        next.due = addDays(today, 1);
        break;
      case 2:
        next.intervalDays = 1;
        next.reps = 1;
        next.due = addDays(today, 1);
        break;
      case 3: {
        // 3d base, then ±5% fuzz; keep intervalDays and due consistent.
        const days = fuzzInterval(3, state.problemId, today);
        next.intervalDays = days;
        next.reps = 1;
        next.due = addDays(today, days);
        break;
      }
    }
    return next;
  }

  // ---- review card ----
  let interval = state.intervalDays;
  switch (grade) {
    case 0: // Failed
      next.lapses = state.lapses + 1;
      next.ease = clampEase(state.ease - 0.2);
      interval = 1; // requeue in-session handled by the feed
      break;
    case 1: // Hard
      interval = Math.max(state.intervalDays + 1, Math.round(state.intervalDays * 1.2));
      next.ease = clampEase(state.ease - 0.15);
      next.reps = state.reps + 1;
      break;
    case 2: // Good
      interval = Math.round(state.intervalDays * state.ease);
      next.reps = state.reps + 1;
      break;
    case 3: // Easy
      interval = Math.round(state.intervalDays * state.ease * 1.35);
      next.ease = clampEase(state.ease + 0.1);
      next.reps = state.reps + 1;
      break;
  }

  const fuzzed = fuzzInterval(interval, state.problemId, today);
  next.intervalDays = fuzzed;
  next.due = addDays(today, fuzzed);
  return next;
}

export interface GradeSuggestion {
  /** UI preselects this grade. */
  suggested: Grade;
  /** When true, the Easy (3) button is visually nudged though Good (2) stays the
   *  preselected default — fast, hint-free solves (§7.1). */
  nudgeEasy: boolean;
}

/** Suggested default grade the UI preselects (user can override) — SPEC §7.1.
 *  wrong → 0; correct with ≥2 hints → 1; correct with 1 hint → 2;
 *  correct with 0 hints → 2, nudge 3 if solve time < estMinutes. */
export function suggestGrade(args: {
  correct: boolean;
  hintsUsed: 0 | 1 | 2 | 3;
  ms: number;
  estMinutes: number;
}): GradeSuggestion {
  if (!args.correct) return { suggested: 0, nudgeEasy: false };
  if (args.hintsUsed >= 2) return { suggested: 1, nudgeEasy: false };
  if (args.hintsUsed === 1) return { suggested: 2, nudgeEasy: false };
  // 0 hints, correct
  const fast = args.ms < args.estMinutes * 60_000;
  return { suggested: 2, nudgeEasy: fast };
}
