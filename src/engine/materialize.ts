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

export function materialize(item: ContentItem, reviewCount: number): RenderProblem {
  if (item.kind === 'static') {
    const p = item.problem;
    return { ...p, isGenerated: false };
  }
  const g = item.problem;
  const rng = rngFromString(`${g.id}|${reviewCount}`);
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
