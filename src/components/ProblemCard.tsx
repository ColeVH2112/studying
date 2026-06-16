// One problem, full viewport — SPEC §8.1. Stage machine:
//   statement → hint1 → hint2 → hint3 → solution → graded.
// Hints reveal as margin notes; numeric/MC show the answer input from the start;
// a submission jumps to the solution with a verdict; grading schedules + advances.

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { DueReason, Grade, ReviewState } from '../types';
import type { RenderProblem } from '../engine/materialize';
import { MathMarkdown } from './MathMarkdown';
import { MarginNote } from './StageReveal';
import { AnswerInput } from './AnswerInput';
import { GradeBar } from './GradeBar';

export interface CardHandle {
  advance: () => void;
  showSolution: () => void;
  grade: (g: Grade) => void;
}

interface Props {
  problem: RenderProblem;
  reason: DueReason;
  priorState: ReviewState | undefined;
  today: string;
  isActive: boolean;
  onGrade: (g: Grade, hintsUsed: 0 | 1 | 2 | 3, ms: number) => void;
}

const TOPIC_LABELS: Record<string, string> = {
  'expected-value': 'expected value',
  'martingales': 'martingales',
  'combinatorics': 'combinatorics',
  'mental-math': 'mental math',
  'markov-chains': 'markov chains',
  'options-intuition': 'options intuition',
  'market-making': 'market making',
  'linear-algebra': 'linear algebra',
  'stochastic-processes': 'stochastic processes',
};
const topicLabel = (t: string) => TOPIC_LABELS[t] ?? t.replace(/-/g, ' ');

function Dots({ n }: { n: number }) {
  return (
    <span className="dots" aria-label={`difficulty ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? '' : 'off'}>●</span>
      ))}
    </span>
  );
}

function Badge({ reason }: { reason: DueReason }) {
  if (reason.kind === 'new') return <span className="badge badge--new">new</span>;
  if (reason.kind === 'ahead') return <span className="badge badge--ahead">ahead of schedule</span>;
  const d = reason.overdueDays;
  return (
    <span className={`badge${d > 0 ? ' badge--overdue' : ''}`}>
      {d > 0 ? `review · ${d}d overdue` : 'review · due today'}
    </span>
  );
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export const ProblemCard = forwardRef<CardHandle, Props>(function ProblemCard(
  { problem, reason, priorState, today, isActive, onGrade }, ref,
) {
  const [revealed, setRevealed] = useState<0 | 1 | 2 | 3>(0);
  const [phase, setPhase] = useState<'solving' | 'solution' | 'graded'>('solving');
  const [correct, setCorrect] = useState<boolean | null>(null);
  const startedRef = useRef<number | null>(null);
  const solveMsRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  const isSelfGraded = problem.answer.type === 'self-graded';

  // Start the clock the first time this card becomes the active one.
  useEffect(() => {
    if (isActive && startedRef.current === null) startedRef.current = Date.now();
  }, [isActive]);

  // Tick the visible timer while solving the active card.
  useEffect(() => {
    if (!isActive || phase === 'graded' || startedRef.current === null) return;
    const id = setInterval(() => {
      if (startedRef.current !== null) setElapsed(Date.now() - startedRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [isActive, phase]);

  function captureSolveMs(): number {
    const ms = startedRef.current !== null ? Date.now() - startedRef.current : 0;
    solveMsRef.current = ms;
    return ms;
  }

  function resolve(isCorrect: boolean | null) {
    if (phase !== 'solving') return;
    captureSolveMs();
    setCorrect(isCorrect);
    setPhase('solution');
  }

  function showSolution() {
    if (phase !== 'solving') return;
    // Jumping to the solution without a correct submission counts as not solved.
    resolve(isSelfGraded ? null : false);
  }

  function advance() {
    if (phase === 'solving') {
      if (revealed < 3) setRevealed((r) => (r + 1) as 0 | 1 | 2 | 3);
      else showSolution();
    }
  }

  function doGrade(g: Grade) {
    if (phase !== 'solution') return;
    setPhase('graded');
    onGrade(g, revealed, solveMsRef.current);
  }

  useImperativeHandle(ref, () => ({ advance, showSolution, grade: doGrade }));

  const canHint = phase === 'solving' && revealed < 3;

  return (
    <article className="card" aria-current={isActive ? 'true' : undefined}>
      <div className="card__inner">
        <header className="card__head">
          <span className="card__topic">{topicLabel(problem.topic)}</span>
          <Dots n={problem.difficulty} />
          <Badge reason={reason} />
          {problem.isGenerated && <span className="badge">generated</span>}
          <span className="spacer" />
          <span className="timer mono" aria-label="elapsed time">{fmt(elapsed)}</span>
        </header>

        <MathMarkdown className="statement">{problem.statement}</MathMarkdown>

        {/* Answer path (numeric / MC). Self-graded skips straight to reveal. */}
        {phase === 'solving' && !isSelfGraded && problem.answer.type !== 'self-graded' && (
          <AnswerInput answer={problem.answer} onResolved={(c) => resolve(c)} />
        )}

        {/* Revealed hints as margin notes. */}
        {revealed >= 1 && <MarginNote index={0} text={problem.hints[0]} />}
        {revealed >= 2 && <MarginNote index={1} text={problem.hints[1]} />}
        {revealed >= 3 && <MarginNote index={2} text={problem.hints[2]} />}

        {phase === 'solving' && (
          <div className="btn-row">
            {canHint && (
              <button type="button" className="btn btn--ghost" onClick={advance}>
                Show hint <span className="kbd">space</span>
              </button>
            )}
            <button type="button" className="btn btn--quiet" onClick={showSolution}>
              {isSelfGraded ? 'Reveal solution' : 'Show solution'} <span className="kbd">s</span>
            </button>
          </div>
        )}

        {phase !== 'solving' && (
          <section className="solution reveal-in">
            <MathMarkdown>{problem.solution}</MathMarkdown>
            {problem.techniques.length > 0 && (
              <div className="technique-chips" aria-label="techniques">
                {problem.techniques.map((t) => (
                  <a key={t} className="chip" href={`#techniques/${t}`}>{t}</a>
                ))}
              </div>
            )}
            {phase === 'solution' && (
              <GradeBar
                problemId={problem.id}
                priorState={priorState}
                today={today}
                estMinutes={problem.estMinutes}
                hintsUsed={revealed}
                ms={solveMsRef.current}
                correct={isSelfGraded ? null : correct}
                onGrade={doGrade}
              />
            )}
            {phase === 'graded' && <p className="muted">Graded — scroll on.</p>}
          </section>
        )}
      </div>
    </article>
  );
});
