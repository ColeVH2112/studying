// Grade bar — SPEC §8.1 / §7.1. Four buttons (Failed / Hard / Good / Easy) with
// the suggested default preselected (and Easy visually nudged for fast, hint-free
// solves). Each button previews the interval it would schedule.

import type { Grade, ReviewState } from '../types';
import { newReviewState, schedule, suggestGrade } from '../engine/scheduler';

interface Props {
  problemId: string;
  priorState: ReviewState | undefined;
  today: string;
  estMinutes: number;
  hintsUsed: 0 | 1 | 2 | 3;
  ms: number;
  /** null for self-graded problems (no auto-correctness signal). */
  correct: boolean | null;
  onGrade: (g: Grade) => void;
}

const META: Record<Grade, { label: string; key: string }> = {
  0: { label: 'Failed', key: '1' },
  1: { label: 'Hard', key: '2' },
  2: { label: 'Good', key: '3' },
  3: { label: 'Easy', key: '4' },
};

function intervalLabel(days: number): string {
  if (days <= 0) return 'again';
  if (days === 1) return '1d';
  return `${days}d`;
}

export function GradeBar({ problemId, priorState, today, estMinutes, hintsUsed, ms, correct, onGrade }: Props) {
  const suggestion = correct === null
    ? { suggested: 2 as Grade, nudgeEasy: false }
    : suggestGrade({ correct, hintsUsed, ms, estMinutes });

  const prior = priorState ?? newReviewState(problemId, today);

  return (
    <div className="gradebar">
      <span className="gradebar__label">
        How did that go? {correct === null ? 'Grade yourself.' : 'A default is preselected — override if needed.'}
      </span>
      <div className="gradebar__btns" role="group" aria-label="Grade">
        {([0, 1, 2, 3] as Grade[]).map((g) => {
          const days = schedule(prior, g, today).intervalDays;
          const isDefault = g === suggestion.suggested;
          const nudge = suggestion.nudgeEasy && g === 3;
          return (
            <button
              key={g}
              type="button"
              className={`grade${isDefault ? ' grade--preselected' : ''}${nudge ? ' grade--nudge' : ''}`}
              onClick={() => onGrade(g)}
              aria-pressed={isDefault}
            >
              <span>{META[g].label}</span>
              <span className="ivl">{intervalLabel(days)}</span>
              <span className="k">{META[g].key}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
