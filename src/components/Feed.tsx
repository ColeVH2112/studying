// The doomscroll feed — SPEC §8.1 / §7.2. Builds the session queue once, renders
// one full-viewport card each, snap-scrolls, drives the keyboard map, requeues
// failed cards in-session, and extends infinitely when the tail runs low.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ContentItem, DueReason, Grade, ReviewState } from '../types';
import { buildFeed, extendFeed } from '../engine/feedBuilder';
import { materialize, type RenderProblem } from '../engine/materialize';
import { rngFromString } from '../engine/rng';
import { generators, problems } from '../content';
import { getState, recordGrade, useApp } from '../store';
import { ProblemCard, type CardHandle } from './ProblemCard';

interface FeedEntry {
  key: string;
  render: RenderProblem;
  item: ContentItem;
  reason: DueReason;
  priorState: ReviewState | undefined;
}

const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Feed({ today }: { today: string }) {
  const app = useApp();
  const keySeq = useRef(0);
  const rngRef = useRef<() => number>(rngFromString(`${today}|${Date.now()}`));

  const makeEntry = useCallback((item: ContentItem, reason: DueReason, state: ReviewState | undefined): FeedEntry => {
    const reviewCount = state?.reps ?? 0;
    const key = `e${keySeq.current++}`;
    return {
      key,
      // Seed generator instances with the unique card key so a problem re-served
      // within one session (requeue / "ahead" / recycled practice) gets fresh
      // numbers rather than repeating the exact same instance.
      render: materialize(item, reviewCount, key),
      item,
      reason,
      priorState: state,
    };
  }, []);

  // Build the session queue once (snapshot of state at mount).
  const [entries, setEntries] = useState<FeedEntry[]>(() => {
    const s = getState();
    const queue = buildFeed({
      problems, generators, reviews: s.reviews, settings: s.settings, today, rng: rngRef.current,
    });
    return queue.map((q) => makeEntry(q.item, q.reason, q.state));
  });

  const shownIds = useRef(new Set(entries.map((e) => e.item.problem.id)));
  const newBudgetLeft = useRef(
    Math.max(0, app.settings.newPerSession - entries.filter((e) => e.reason.kind === 'new').length),
  );

  const elMap = useRef(new Map<string, HTMLElement>());
  const handleMap = useRef(new Map<string, CardHandle>());
  const [activeKey, setActiveKey] = useState<string | null>(entries[0]?.key ?? null);

  // Track the most-visible card as active.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (records) => {
        let best: { key: string; ratio: number } | null = null;
        for (const rec of records) {
          const key = (rec.target as HTMLElement).dataset.key;
          if (!key) continue;
          if (!best || rec.intersectionRatio > best.ratio) best = { key, ratio: rec.intersectionRatio };
        }
        if (best && best.ratio > 0.5) setActiveKey(best.key);
      },
      { threshold: [0.25, 0.5, 0.75] },
    );
    for (const el of elMap.current.values()) obs.observe(el);
    return () => obs.disconnect();
  }, [entries]);

  const scrollToIndex = useCallback((i: number) => {
    const target = entries[Math.max(0, Math.min(entries.length - 1, i))];
    if (!target) return;
    const el = elMap.current.get(target.key);
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }, [entries]);

  const maybeExtend = useCallback(() => {
    const idx = entries.findIndex((e) => e.key === activeKey);
    if (idx < 0 || entries.length - idx - 1 >= 5) return;
    const s = getState();
    const more = extendFeed({
      problems, generators, reviews: s.reviews, settings: s.settings, today, rng: rngRef.current,
      excludeIds: [...shownIds.current], newBudgetLeft: newBudgetLeft.current, count: 5,
    });
    if (more.length === 0) return;
    const fresh = more.map((q) => makeEntry(q.item, q.reason, q.state));
    for (const e of fresh) {
      shownIds.current.add(e.item.problem.id);
      if (e.reason.kind === 'new') newBudgetLeft.current = Math.max(0, newBudgetLeft.current - 1);
    }
    setEntries((prev) => [...prev, ...fresh]);
  }, [entries, activeKey, today, makeEntry]);

  useEffect(() => { maybeExtend(); }, [activeKey, maybeExtend]);

  const onGrade = useCallback((entry: FeedEntry, g: Grade, hintsUsed: 0 | 1 | 2 | 3, ms: number) => {
    recordGrade({ problemId: entry.item.problem.id, grade: g, hintsUsed, ms, today });
    if (g === 0) {
      // Requeue this session (§7.1) — re-inject a fresh instance at the tail.
      const latest = getState().reviews.find((r) => r.problemId === entry.item.problem.id);
      const requeued = makeEntry(entry.item, { kind: 'review', overdueDays: 0 }, latest);
      setEntries((prev) => [...prev, requeued]);
    }
    const idx = entries.findIndex((e) => e.key === entry.key);
    window.setTimeout(() => scrollToIndex(idx + 1), 220);
  }, [entries, today, makeEntry, scrollToIndex]);

  // Keyboard map (§8.1). Ignored while typing in the answer input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const idx = entries.findIndex((x) => x.key === activeKey);
      const handle = activeKey ? handleMap.current.get(activeKey) : undefined;
      switch (e.key) {
        case 'j': case 'ArrowDown': e.preventDefault(); scrollToIndex(idx + 1); break;
        case 'k': case 'ArrowUp': e.preventDefault(); scrollToIndex(idx - 1); break;
        case ' ': case 'Enter': e.preventDefault(); handle?.advance(); break;
        case 's': case 'S': e.preventDefault(); handle?.showSolution(); break;
        case '1': case '2': case '3': case '4':
          e.preventDefault(); handle?.grade((Number(e.key) - 1) as Grade); break;
        default: break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entries, activeKey, scrollToIndex]);

  if (entries.length === 0) {
    return (
      <div className="scroll-route">
        <div className="empty">
          <h2>Nothing queued.</h2>
          <p>No reviews are due and no new problems are enabled. Turn topics on in{' '}
            <a href="#settings">settings</a>, or run a <a href="#drill">mental-math drill</a>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed">
      {entries.map((entry, i) => (
        <div
          key={entry.key}
          data-key={entry.key}
          ref={(el) => {
            if (el) elMap.current.set(entry.key, el);
            else elMap.current.delete(entry.key);
          }}
        >
          <ProblemCard
            ref={(h) => {
              if (h) handleMap.current.set(entry.key, h);
              else handleMap.current.delete(entry.key);
            }}
            problem={entry.render}
            reason={entry.reason}
            priorState={entry.priorState}
            today={today}
            isActive={entry.key === activeKey || (activeKey === null && i === 0)}
            onGrade={(g, hintsUsed, ms) => onGrade(entry, g, hintsUsed, ms)}
          />
        </div>
      ))}
    </div>
  );
}
