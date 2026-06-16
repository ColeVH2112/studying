// Feed/queue construction — SPEC §7.2. Pure (RNG passed in).

import type {
  ContentItem, ContentMeta, GeneratorProblem, Problem,
  QueueItem, ReviewState, Settings, TopicId,
} from '../types';
import { diffDays } from './dates';

// --------------------------------------------------------------------- helpers

export function metaOf(item: ContentItem): ContentMeta {
  const p = item.problem;
  return {
    id: p.id, topic: p.topic, techniques: p.techniques,
    difficulty: p.difficulty, estMinutes: p.estMinutes,
  };
}

function toContentItems(problems: Problem[], generators: GeneratorProblem[]): ContentItem[] {
  return [
    ...problems.map((problem): ContentItem => ({ kind: 'static', problem })),
    ...generators.map((problem): ContentItem => ({ kind: 'generator', problem })),
  ];
}

/** Topic weakness weight w(t) = 1 + lapses(t)/max(1, attempts(t)) — §7.2 step 2.
 *  attempts(t) = total recorded attempts (history entries) over topic t;
 *  lapses(t) = total lapses over topic t. */
export function topicWeights(
  items: ContentItem[],
  reviews: ReviewState[],
): Map<TopicId, number> {
  const topicOf = new Map<string, TopicId>();
  for (const it of items) topicOf.set(it.problem.id, it.problem.topic);

  const attempts = new Map<TopicId, number>();
  const lapses = new Map<TopicId, number>();
  for (const s of reviews) {
    const t = topicOf.get(s.problemId);
    if (!t) continue;
    attempts.set(t, (attempts.get(t) ?? 0) + s.history.length);
    lapses.set(t, (lapses.get(t) ?? 0) + s.lapses);
  }

  const weights = new Map<TopicId, number>();
  for (const it of items) {
    const t = it.problem.topic;
    if (weights.has(t)) continue;
    weights.set(t, 1 + (lapses.get(t) ?? 0) / Math.max(1, attempts.get(t) ?? 0));
  }
  return weights;
}

/** Weighted sampling WITHOUT replacement. Returns up to k items, order = draw
 *  order (so the most-weighted topics tend to come first). */
function weightedSample(
  rng: () => number,
  pool: ContentItem[],
  weightOf: (it: ContentItem) => number,
  k: number,
): ContentItem[] {
  const remaining = pool.slice();
  const out: ContentItem[] = [];
  while (out.length < k && remaining.length > 0) {
    const total = remaining.reduce((acc, it) => acc + Math.max(1e-9, weightOf(it)), 0);
    let target = rng() * total;
    let idx = 0;
    for (; idx < remaining.length; idx++) {
      target -= Math.max(1e-9, weightOf(remaining[idx] as ContentItem));
      if (target <= 0) break;
    }
    if (idx >= remaining.length) idx = remaining.length - 1;
    out.push(remaining.splice(idx, 1)[0] as ContentItem);
  }
  return out;
}

/** Interleave so no two consecutive items share a topic when a swap within a
 *  3-item lookahead can prevent it — §7.2 step 4. In place on a copy. */
export function interleave(queue: QueueItem[]): QueueItem[] {
  const q = queue.slice();
  for (let i = 1; i < q.length; i++) {
    const prevTopic = metaOf((q[i - 1] as QueueItem).item).topic;
    if (metaOf((q[i] as QueueItem).item).topic !== prevTopic) continue;
    // collision: find a swap candidate in the next 3 positions whose topic differs
    // from prev (and, ideally, won't itself collide with i's new left neighbor).
    const limit = Math.min(i + 3, q.length - 1);
    for (let j = i + 1; j <= limit; j++) {
      if (metaOf((q[j] as QueueItem).item).topic !== prevTopic) {
        const tmp = q[i] as QueueItem;
        q[i] = q[j] as QueueItem;
        q[j] = tmp;
        break;
      }
    }
  }
  return q;
}

// ------------------------------------------------------------------ main build

export interface BuildFeedArgs {
  problems: Problem[];
  generators: GeneratorProblem[];
  reviews: ReviewState[];
  settings: Settings;
  today: string;
  rng: () => number;
}

/** Build the session queue: due list mixed with weakness-weighted new items,
 *  then interleaved by topic. */
export function buildFeed(args: BuildFeedArgs): QueueItem[] {
  const { problems, generators, reviews, settings, today, rng } = args;
  const items = toContentItems(problems, generators);
  const byId = new Map<string, ContentItem>();
  for (const it of items) byId.set(it.problem.id, it);
  const stateById = new Map<string, ReviewState>();
  for (const s of reviews) stateById.set(s.problemId, s);

  // 1. Due list — states due today or earlier whose content still exists.
  // diffDays(due, today) = today − due, so ≥ 0 means due now or overdue.
  const due: QueueItem[] = reviews
    .filter((s) => diffDays(s.due, today) >= 0 && byId.has(s.problemId))
    .map((s): QueueItem => ({
      item: byId.get(s.problemId) as ContentItem,
      reason: { kind: 'review', overdueDays: diffDays(s.due, today) },
      state: s,
    }))
    .sort((a, b) => (b.reason as { overdueDays: number }).overdueDays
      - (a.reason as { overdueDays: number }).overdueDays);

  // 2. New pool — no state, topic enabled, weighted by topic weakness.
  const weights = topicWeights(items, reviews);
  const enabled = new Set(settings.enabledTopics);
  const newPool = items.filter(
    (it) => !stateById.has(it.problem.id) && enabled.has(it.problem.topic),
  );
  const sampledNew = weightedSample(
    rng, newPool, (it) => weights.get(it.problem.topic) ?? 1, settings.newPerSession,
  ).map((item): QueueItem => ({ item, reason: { kind: 'new' } }));

  // 3. Mix — after every `ratio` due items, inject one new (§7.2 step 3).
  const mixed = mix(due, sampledNew, Math.max(1, Math.round(settings.newRatio)));

  // 4. Interleave by topic.
  return interleave(mixed);
}

/** Round-robin mix: `ratio` due items, then one new, repeat; flush leftovers. */
function mix(due: QueueItem[], fresh: QueueItem[], ratio: number): QueueItem[] {
  if (due.length === 0) return fresh.slice(); // nothing due → new only
  const out: QueueItem[] = [];
  let di = 0;
  let ni = 0;
  while (di < due.length || ni < fresh.length) {
    for (let k = 0; k < ratio && di < due.length; k++) out.push(due[di++] as QueueItem);
    if (ni < fresh.length) out.push(fresh[ni++] as QueueItem);
    else if (di >= due.length) break; // both budgets spent for the mix loop
  }
  while (di < due.length) out.push(due[di++] as QueueItem); // remaining due
  return out;
}

// --------------------------------------------------------------- infinite feed

export interface ExtendFeedArgs extends BuildFeedArgs {
  /** Ids already shown this session (won't be re-served). */
  excludeIds: string[];
  /** New-item budget still unspent this session. */
  newBudgetLeft: number;
  /** How many cards to add (default 5). */
  count?: number;
}

/** Extend the feed when fewer than 5 cards remain — §7.2 step 5. Pulls more new
 *  items if the budget allows, otherwise the earliest-due future reviews tagged
 *  "ahead of schedule." */
export function extendFeed(args: ExtendFeedArgs): QueueItem[] {
  const { problems, generators, reviews, settings, today, rng } = args;
  const count = args.count ?? 5;
  const exclude = new Set(args.excludeIds);
  const items = toContentItems(problems, generators);
  const byId = new Map<string, ContentItem>();
  for (const it of items) byId.set(it.problem.id, it);
  const stateById = new Map<string, ReviewState>();
  for (const s of reviews) stateById.set(s.problemId, s);

  const out: QueueItem[] = [];

  // a) more new items, within the remaining budget and enabled topics. Serve new
  //    OR future reviews, not both: only fall through to "ahead" once the new
  //    budget is spent (or no new items remain) — SPEC §7.2 step 5.
  if (args.newBudgetLeft > 0) {
    const weights = topicWeights(items, reviews);
    const enabled = new Set(settings.enabledTopics);
    const newPool = items.filter(
      (it) => !stateById.has(it.problem.id)
        && enabled.has(it.problem.topic)
        && !exclude.has(it.problem.id),
    );
    const take = Math.min(args.newBudgetLeft, count);
    for (const item of weightedSample(rng, newPool, (it) => weights.get(it.problem.topic) ?? 1, take)) {
      out.push({ item, reason: { kind: 'new' } });
      exclude.add(item.problem.id);
    }
    if (out.length > 0) return interleave(out); // budget not yet spent → new only
  }

  // b) new budget spent (or no new available) → pull earliest-due FUTURE reviews,
  //    tagged "ahead of schedule". diffDays(due, today) < 0 ⟺ due is still future.
  const future = reviews
    .filter((s) => diffDays(s.due, today) < 0 && byId.has(s.problemId) && !exclude.has(s.problemId))
    .sort((a, b) => diffDays(today, a.due) - diffDays(today, b.due));
  for (const s of future) {
    if (out.length >= count) break;
    out.push({ item: byId.get(s.problemId) as ContentItem, reason: { kind: 'ahead' }, state: s });
    exclude.add(s.problemId);
  }

  return interleave(out);
}
