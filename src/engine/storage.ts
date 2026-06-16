// localStorage persistence — SPEC §10. Versioned keys, debounced writes,
// zod-validated export/import. This is the single module permitted to touch
// browser storage; everything else stays pure.

import { z } from 'zod';
import type { DrillResult, ExportBlob, ReviewState, Settings, TopicId } from '../types';

const K = {
  reviews: 'qf.v1.reviews',
  drills: 'qf.v1.drills',
  settings: 'qf.v1.settings',
  meta: 'qf.v1.meta',
} as const;

export const ALL_TOPICS: TopicId[] = [
  'brainteasers', 'probability', 'combinatorics', 'expected-value',
  'bayes', 'markov-chains', 'martingales', 'distributions',
  'calculus', 'linear-algebra', 'statistics', 'stochastic-processes',
  'options-intuition', 'market-making', 'mental-math',
];

export const DEFAULT_SETTINGS: Settings = {
  enabledTopics: ALL_TOPICS.slice(),
  newPerSession: 8,
  newRatio: 3,
};

// ------------------------------------------------------------------- schemas

const gradeSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

const reviewStateSchema: z.ZodType<ReviewState> = z.object({
  problemId: z.string(),
  ease: z.number(),
  intervalDays: z.number(),
  due: z.string(),
  reps: z.number(),
  lapses: z.number(),
  history: z.array(z.object({
    date: z.string(),
    grade: gradeSchema,
    hintsUsed: gradeSchema,
    ms: z.number(),
  })),
});

const drillResultSchema: z.ZodType<DrillResult> = z.object({
  date: z.string(),
  preset: z.string(),
  total: z.number(),
  correct: z.number(),
  seconds: z.number(),
  perCategory: z.record(z.object({ n: z.number(), correct: z.number() })),
});

const settingsSchema: z.ZodType<Settings> = z.object({
  enabledTopics: z.array(z.string()) as unknown as z.ZodType<TopicId[]>,
  newPerSession: z.number(),
  newRatio: z.number(),
});

export const exportBlobSchema: z.ZodType<ExportBlob> = z.object({
  version: z.literal(1),
  reviews: z.array(reviewStateSchema),
  drills: z.array(drillResultSchema),
  settings: settingsSchema,
});

// ------------------------------------------------------------------ read/write

function read<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export function loadReviews(): ReviewState[] {
  return read(K.reviews, z.array(reviewStateSchema), []);
}
export function loadDrills(): DrillResult[] {
  return read(K.drills, z.array(drillResultSchema), []);
}
export function loadSettings(): Settings {
  const s = read(K.settings, settingsSchema, DEFAULT_SETTINGS);
  // forward-compat: ensure required fields exist
  return { ...DEFAULT_SETTINGS, ...s };
}

interface Meta { version: 1; createdDate: string }
const metaSchema: z.ZodType<Meta> = z.object({ version: z.literal(1), createdDate: z.string() });

export function loadMeta(today: string): Meta {
  const existing = read<Meta | null>(K.meta, metaSchema.nullable(), null);
  if (existing) return existing;
  const fresh: Meta = { version: 1, createdDate: today };
  writeNow(K.meta, fresh);
  return fresh;
}

// ---- debounced writes (all writes funnel through here, §10) ----

interface Pending { value: unknown; timer: ReturnType<typeof setTimeout>; }
const pending = new Map<string, Pending>();

function writeNow(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable — silently drop; export remains the backup path */
  }
}

function debouncedWrite(key: string, value: unknown, delay = 300): void {
  const existing = pending.get(key);
  if (existing) clearTimeout(existing.timer);
  const timer = setTimeout(() => { writeNow(key, value); pending.delete(key); }, delay);
  pending.set(key, { value, timer });
}

/** Cancel pending writes WITHOUT persisting them — used before an authoritative
 *  replace (import/reset) so a stale debounced write can't clobber the new state. */
function cancelPending(): void {
  for (const { timer } of pending.values()) clearTimeout(timer);
  pending.clear();
}

export function saveReviews(reviews: ReviewState[]): void { debouncedWrite(K.reviews, reviews); }
export function saveDrills(drills: DrillResult[]): void { debouncedWrite(K.drills, drills); }
export function saveSettings(settings: Settings): void { debouncedWrite(K.settings, settings); }

/** Persist any pending debounced writes immediately, then clear (e.g. on pagehide
 *  so a fast tab-close within the debounce window doesn't lose the latest write). */
export function flush(): void {
  for (const [key, { value }] of pending) writeNow(key, value);
  cancelPending();
}

// ------------------------------------------------------------------ export/import

export function buildExport(reviews: ReviewState[], drills: DrillResult[], settings: Settings): ExportBlob {
  return { version: 1, reviews, drills, settings };
}

/** Trigger a browser download of the backup JSON. */
export function downloadExport(blob: ExportBlob, today: string): void {
  const json = JSON.stringify(blob, null, 2);
  const file = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quantfeed-backup-${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportResult =
  | { ok: true; blob: ExportBlob }
  | { ok: false; error: string };

/** Validate an imported JSON string with zod; on success the caller replaces
 *  all state with `blob`. */
export function parseImport(json: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Not valid JSON.' };
  }
  const parsed = exportBlobSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: 'File does not match the QuantFeed backup format.' };
  }
  return { ok: true, blob: parsed.data };
}

/** Persist an imported blob immediately, replacing existing state. Pending
 *  debounced writes are cancelled first so none can fire afterward and clobber. */
export function applyImport(blob: ExportBlob): void {
  cancelPending();
  writeNow(K.reviews, blob.reviews);
  writeNow(K.drills, blob.drills);
  writeNow(K.settings, blob.settings);
}

/** Wipe all QuantFeed state (§8.5 reset). Cancels pending writes first. */
export function resetAll(): void {
  cancelPending();
  for (const key of Object.values(K)) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}
