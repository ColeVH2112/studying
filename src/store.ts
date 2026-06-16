// Tiny observable app store (SPEC §3: React state + small stores, no state lib).
// Holds the persisted slices, funnels every mutation through storage.ts, and
// exposes a useSyncExternalStore hook.

import { useSyncExternalStore } from 'react';
import type { DrillResult, ExportBlob, Grade, ReviewState, Settings } from './types';
import * as storage from './engine/storage';
import { newReviewState, schedule } from './engine/scheduler';
import { todayISO } from './today';

export interface AppState {
  reviews: ReviewState[];
  drills: DrillResult[];
  settings: Settings;
}

let state: AppState = {
  reviews: storage.loadReviews(),
  drills: storage.loadDrills(),
  settings: storage.loadSettings(),
};

// Lazily create the qf.v1.meta record on first run (SPEC §10 four-key scheme),
// and flush any in-flight debounced writes on tab close so nothing is lost.
storage.loadMeta(todayISO());
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => storage.flush());
}

const listeners = new Set<() => void>();
function emit() { for (const l of listeners) l(); }
function setState(next: AppState) { state = next; emit(); }

export function useApp(): AppState {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => state,
    () => state, // server snapshot (the app is client-rendered; keeps SSR/tests safe)
  );
}

export function getState(): AppState { return state; }

// ----------------------------------------------------------------- mutations

/** Record a grade for a problem: append history, run the scheduler, persist. */
export function recordGrade(args: {
  problemId: string;
  grade: Grade;
  hintsUsed: 0 | 1 | 2 | 3;
  ms: number;
  today: string;
}): void {
  const { problemId, grade, hintsUsed, ms, today } = args;
  const prior = state.reviews.find((r) => r.problemId === problemId)
    ?? newReviewState(problemId, today);
  const scheduled = schedule(prior, grade, today);
  scheduled.history = [...prior.history, { date: today, grade, hintsUsed, ms }];

  const reviews = state.reviews.some((r) => r.problemId === problemId)
    ? state.reviews.map((r) => (r.problemId === problemId ? scheduled : r))
    : [...state.reviews, scheduled];

  storage.saveReviews(reviews);
  setState({ ...state, reviews });
}

export function saveDrill(result: DrillResult): void {
  const drills = [...state.drills, result];
  storage.saveDrills(drills);
  setState({ ...state, drills });
}

export function setSettings(settings: Settings): void {
  storage.saveSettings(settings);
  setState({ ...state, settings });
}

export function buildExport(): ExportBlob {
  return storage.buildExport(state.reviews, state.drills, state.settings);
}

export function applyImport(blob: ExportBlob): void {
  storage.applyImport(blob);
  setState({ reviews: blob.reviews, drills: blob.drills, settings: blob.settings });
}

export function resetAll(): void {
  storage.resetAll();
  setState({ reviews: [], drills: [], settings: storage.DEFAULT_SETTINGS });
}
