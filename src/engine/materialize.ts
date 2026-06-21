// Turn a ContentItem (static or generator) into a uniform render shape. Pure.
// Generator instances are seeded by problemId + reviewCount so the numbers are
// fresh each review but stable within one (SPEC §7.4).

import type { AnswerSpec, ContentItem, TechniqueId, TopicId } from '../types';
import { rngFromString } from './rng';

export interface RenderProblem {
  id: string;
  topic: TopicId;
  techniques: TechniqueId[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  estMinutes: number;
  statement: string;
  hints: [string, string, string];
  solution: string;
  answer: AnswerSpec;
  followUps?: string[];
  isGenerated: boolean;
}

/**
 * @param instanceKey  Optional extra seed component. Omitted, a generator is
 *   seeded purely by `id|reviewCount` (SPEC §7.4: reproducible within a review).
 *   The feed passes a per-card unique key so that a generator re-served in the
 *   same session (requeue, "ahead", or recycled practice) shows fresh numbers
 *   instead of repeating — otherwise every appearance within one review count
 *   would be identical.
 */
export function materialize(item: ContentItem, reviewCount: number, instanceKey?: string | number): RenderProblem {
  if (item.kind === 'static') {
    const p = item.problem;
    return { ...p, isGenerated: false };
  }
  const g = item.problem;
  const seed = instanceKey === undefined ? `${g.id}|${reviewCount}` : `${g.id}|${reviewCount}|${instanceKey}`;
  const rng = rngFromString(seed);
  const inst = g.generate(rng);
  return {
    id: g.id,
    topic: g.topic,
    techniques: g.techniques,
    difficulty: g.difficulty,
    estMinutes: g.estMinutes,
    statement: inst.statement,
    hints: inst.hints,
    solution: inst.solution,
    answer: inst.answer,
    isGenerated: true,
  };
}
