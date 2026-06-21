import { describe, it, expect } from 'vitest';
import { buildFeed, extendFeed, interleave, metaOf, topicWeights } from './feedBuilder';
import { mulberry32 } from './rng';
import { addDays } from './dates';
import type { Problem, QueueItem, ReviewState, Settings, TopicId } from '../types';

const TODAY = '2026-06-16';

function P(id: string, topic: TopicId): Problem {
  return {
    id, topic, techniques: ['symmetry'], difficulty: 2, source: 'original',
    statement: 's', hints: ['a', 'b', 'c'], solution: '**Pattern:** x',
    answer: { type: 'numeric', value: 1 }, estMinutes: 3,
  };
}

function state(id: string, due: string, extra: Partial<ReviewState> = {}): ReviewState {
  return { problemId: id, ease: 2.5, intervalDays: 5, due, reps: 2, lapses: 0, history: [], ...extra };
}

const settings = (over: Partial<Settings> = {}): Settings => ({
  enabledTopics: ['expected-value', 'martingales', 'combinatorics', 'probability', 'bayes'],
  newPerSession: 8, newRatio: 3, ...over,
});

function qi(id: string, topic: TopicId): QueueItem {
  return { item: { kind: 'static', problem: P(id, topic) }, reason: { kind: 'new' } };
}

describe('interleave', () => {
  it('breaks up consecutive same-topic items when a nearby swap exists', () => {
    const q = [qi('a', 'martingales'), qi('b', 'martingales'), qi('c', 'bayes'), qi('d', 'probability')];
    const out = interleave(q);
    for (let i = 1; i < out.length; i++) {
      expect(metaOf(out[i]!.item).topic).not.toBe(metaOf(out[i - 1]!.item).topic);
    }
  });

  it('leaves an already-interleaved queue intact in topic sequence', () => {
    const q = [qi('a', 'martingales'), qi('b', 'bayes'), qi('c', 'martingales')];
    const out = interleave(q).map((x) => metaOf(x.item).topic);
    expect(out).toEqual(['martingales', 'bayes', 'martingales']);
  });
});

describe('topicWeights', () => {
  it('w(t) = 1 + lapses/max(1, attempts)', () => {
    const items = [{ kind: 'static', problem: P('a', 'martingales') } as const];
    const reviews = [state('a', TODAY, { lapses: 2, history: [
      { date: TODAY, grade: 0, hintsUsed: 0, ms: 1 },
      { date: TODAY, grade: 2, hintsUsed: 0, ms: 1 },
      { date: TODAY, grade: 2, hintsUsed: 0, ms: 1 },
      { date: TODAY, grade: 2, hintsUsed: 0, ms: 1 },
    ] })];
    const w = topicWeights(items, reviews);
    expect(w.get('martingales')).toBeCloseTo(1 + 2 / 4, 10);
  });
});

describe('buildFeed', () => {
  const problems = [
    P('ev1', 'expected-value'), P('ev2', 'expected-value'),
    P('m1', 'martingales'), P('m2', 'martingales'),
    P('c1', 'combinatorics'), P('b1', 'bayes'), P('pr1', 'probability'),
  ];

  it('serves new only when nothing is due', () => {
    const q = buildFeed({ problems, generators: [], reviews: [], settings: settings(), today: TODAY, rng: mulberry32(1) });
    expect(q.length).toBeGreaterThan(0);
    expect(q.every((x) => x.reason.kind === 'new')).toBe(true);
    expect(q.length).toBeLessThanOrEqual(settings().newPerSession);
  });

  it('orders the due list by days overdue (desc)', () => {
    const reviews = [
      state('ev1', addDays(TODAY, -1)),
      state('m1', addDays(TODAY, -10)),
      state('c1', addDays(TODAY, -3)),
    ];
    const q = buildFeed({ problems, generators: [], reviews, settings: settings({ newPerSession: 0 }), today: TODAY, rng: mulberry32(2) });
    const dueIds = q.filter((x) => x.reason.kind === 'review').map((x) => x.item.problem.id);
    expect(dueIds).toEqual(['m1', 'c1', 'ev1']); // 10d, 3d, 1d overdue
  });

  it('restricts the new pool to enabled topics and unseen items', () => {
    const reviews = [state('ev1', TODAY)]; // ev1 has state → not "new"
    const q = buildFeed({
      problems, generators: [], reviews,
      settings: settings({ enabledTopics: ['martingales'], newPerSession: 8 }),
      today: addDays(TODAY, 5), rng: mulberry32(3),
    });
    const newIds = q.filter((x) => x.reason.kind === 'new').map((x) => x.item.problem.id);
    expect(newIds.every((id) => id.startsWith('m'))).toBe(true);
    expect(newIds).not.toContain('ev1');
  });

  it('mixes due and new, capping new at newPerSession', () => {
    const reviews = Array.from({ length: 9 }, (_, i) => state(`d${i}`, addDays(TODAY, -1)));
    const dueProblems = reviews.map((r, i) => P(r.problemId, (['martingales', 'bayes', 'probability'] as TopicId[])[i % 3]!));
    const q = buildFeed({
      problems: [...dueProblems, ...problems], generators: [], reviews,
      settings: settings({ newPerSession: 2, newRatio: 3 }), today: TODAY, rng: mulberry32(4),
    });
    const newCount = q.filter((x) => x.reason.kind === 'new').length;
    expect(newCount).toBeLessThanOrEqual(2);
    expect(q.filter((x) => x.reason.kind === 'review').length).toBe(9);
  });
});

describe('extendFeed', () => {
  const problems = [P('n1', 'martingales'), P('n2', 'bayes'), P('n3', 'probability')];

  it('returns fresh new items while budget remains', () => {
    const ext = extendFeed({
      problems, generators: [], reviews: [], settings: settings(), today: TODAY, rng: mulberry32(5),
      excludeIds: [], newBudgetLeft: 2, count: 5,
    });
    expect(ext.length).toBe(2);
    expect(ext.every((x) => x.reason.kind === 'new')).toBe(true);
  });

  it('serves new-only while budget remains, even if future reviews exist', () => {
    const reviews = [state('n1', addDays(TODAY, 3))]; // a future review is available
    const ext = extendFeed({
      problems: [P('fresh', 'bayes')], generators: [], reviews, settings: settings(),
      today: TODAY, rng: mulberry32(11), excludeIds: [], newBudgetLeft: 1, count: 5,
    });
    expect(ext.length).toBe(1);
    expect(ext[0]!.reason.kind).toBe('new'); // budget not yet spent → no "ahead"
  });

  it('pulls earliest-due future reviews tagged "ahead" when new budget is spent', () => {
    const reviews = [
      state('n1', addDays(TODAY, 5)),
      state('n2', addDays(TODAY, 2)),
    ];
    const ext = extendFeed({
      problems, generators: [], reviews, settings: settings(), today: TODAY, rng: mulberry32(6),
      excludeIds: [], newBudgetLeft: 0, count: 5,
    });
    const ahead = ext.filter((x) => x.reason.kind === 'ahead').map((x) => x.item.problem.id);
    expect(ahead).toContain('n2');
    expect(ext.every((x) => x.reason.kind === 'ahead')).toBe(true);
    // earliest due first (n2 at +2 before n1 at +5)
    expect(ahead[0]).toBe('n2');
  });

  it('recycles content into endless practice once new and future are exhausted', () => {
    // every id excluded and no future reviews → the feed must not dead-end
    const ext = extendFeed({
      problems, generators: [], reviews: [], settings: settings(), today: TODAY, rng: mulberry32(7),
      excludeIds: ['n1', 'n2', 'n3'], newBudgetLeft: 5, count: 5,
    });
    expect(ext.length).toBe(5);
    expect(ext.every((x) => x.reason.kind === 'practice')).toBe(true);
    // pool of 3 recycled to 5 — repeats allowed, but never the same id back-to-back
    for (let i = 1; i < ext.length; i++) {
      expect(ext[i]!.item.problem.id).not.toBe(ext[i - 1]!.item.problem.id);
    }
  });

  it('still prefers future reviews over practice when any remain', () => {
    const reviews = [state('n1', addDays(TODAY, 4))];
    const ext = extendFeed({
      problems, generators: [], reviews, settings: settings(), today: TODAY, rng: mulberry32(8),
      excludeIds: ['n2', 'n3'], newBudgetLeft: 0, count: 5,
    });
    expect(ext.some((x) => x.reason.kind === 'ahead')).toBe(true);
    expect(ext.every((x) => x.reason.kind !== 'practice')).toBe(true);
  });
});

describe('buildFeed never dead-ends', () => {
  it('recycles practice when nothing is due and the new pool is spent', () => {
    // one problem, already reviewed and not due → no due, no new
    const reviews = [state('only', addDays(TODAY, 6))];
    const q = buildFeed({
      problems: [P('only', 'martingales')], generators: [], reviews,
      settings: settings({ newPerSession: 0 }), today: TODAY, rng: mulberry32(9),
    });
    expect(q.length).toBeGreaterThan(0);
    expect(q.every((x) => x.reason.kind === 'practice')).toBe(true);
  });
});
