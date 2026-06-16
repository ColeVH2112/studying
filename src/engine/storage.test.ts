import { describe, it, expect, beforeEach } from 'vitest';

// Minimal in-memory localStorage stub (DECISIONS.md: no jsdom dependency).
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
(globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();

import {
  loadReviews, loadDrills, loadSettings, DEFAULT_SETTINGS,
  buildExport, parseImport, applyImport, resetAll,
  saveReviews, flush,
} from './storage';
import type { ExportBlob, ReviewState } from '../types';

beforeEach(() => { resetAll(); });

describe('storage defaults', () => {
  it('returns empty/default state on a clean store', () => {
    expect(loadReviews()).toEqual([]);
    expect(loadDrills()).toEqual([]);
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('export / import round-trip', () => {
  const blob: ExportBlob = {
    version: 1,
    reviews: [{ problemId: 'p', ease: 2.5, intervalDays: 3, due: '2026-06-20', reps: 1, lapses: 0,
      history: [{ date: '2026-06-16', grade: 2, hintsUsed: 1, ms: 1000 }] }],
    drills: [{ date: '2026-06-16', preset: 'optiver', total: 80, correct: 60, seconds: 480, perCategory: { 'mul-2x2': { n: 10, correct: 8 } } }],
    settings: { enabledTopics: ['martingales'], newPerSession: 5, newRatio: 2 },
  };

  it('buildExport reflects current state after applyImport', () => {
    applyImport(blob);
    const exported = buildExport(loadReviews(), loadDrills(), loadSettings());
    expect(exported).toEqual(blob);
  });

  it('parseImport validates a good blob and rejects junk', () => {
    expect(parseImport(JSON.stringify(blob))).toEqual({ ok: true, blob });
    expect(parseImport('not json').ok).toBe(false);
    expect(parseImport(JSON.stringify({ version: 2 })).ok).toBe(false);
    expect(parseImport(JSON.stringify({ version: 1, reviews: 'nope' })).ok).toBe(false);
  });

  it('resetAll wipes persisted state', () => {
    applyImport(blob);
    expect(loadReviews().length).toBe(1);
    resetAll();
    expect(loadReviews()).toEqual([]);
  });
});

describe('debounced write durability', () => {
  it('flush() persists a pending (not-yet-fired) debounced write', () => {
    const reviews: ReviewState[] = [{ problemId: 'q', ease: 2.5, intervalDays: 1, due: '2026-06-17', reps: 1, lapses: 0, history: [] }];
    saveReviews(reviews); // debounced — not written yet
    flush();             // should persist synchronously
    expect(loadReviews()).toEqual(reviews);
  });
});
