// Answer entry + verdict strip — SPEC §7.3 / §8.1 / §9.
// Numeric: parse decimals/fractions, check tolerance. Multiple-choice: index match.
// A submission resolves the card straight to its solution with a verdict strip.

import { useState } from 'react';
import type { AnswerSpec } from '../types';
import { canonicalAnswer, checkAnswer } from '../engine/grading';

interface Props {
  answer: Extract<AnswerSpec, { type: 'numeric' } | { type: 'multiple-choice' }>;
  /** Called once the answer is checked; passes whether it was correct. */
  onResolved: (correct: boolean) => void;
  autoFocus?: boolean;
}

export function AnswerInput({ answer, onResolved, autoFocus }: Props) {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<{ correct: boolean; you: string } | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);

  const submitted = verdict !== null;

  function submitNumeric() {
    if (submitted) return;
    const outcome = checkAnswer(answer, { raw });
    if (outcome.kind === 'numeric-invalid') {
      setError(outcome.error);
      return;
    }
    if (outcome.kind === 'numeric') {
      setError(null);
      setVerdict({ correct: outcome.correct, you: raw.trim() });
      onResolved(outcome.correct);
    }
  }

  function chooseMC(i: number) {
    if (submitted) return;
    const outcome = checkAnswer(answer, { choiceIndex: i });
    if (outcome.kind === 'multiple-choice') {
      setChosen(i);
      setVerdict({ correct: outcome.correct, you: answer.type === 'multiple-choice' ? (answer.options[i] ?? '') : '' });
      onResolved(outcome.correct);
    }
  }

  const verdictStrip = verdict && (
    <div
      className={`verdict ${verdict.correct ? 'verdict--correct' : 'verdict--wrong'}`}
      role="status"
    >
      {verdict.correct
        ? `correct · ${canonicalAnswer(answer)}`
        : `not quite — you said ${verdict.you || '—'}`}
    </div>
  );

  if (answer.type === 'multiple-choice') {
    return (
      <div className="answer">
        <div className="mc" role="group" aria-label="Answer choices">
          {answer.options.map((opt, i) => {
            const isCorrect = submitted && i === answer.correctIndex;
            const isWrongPick = submitted && i === chosen && i !== answer.correctIndex;
            return (
              <button
                key={i}
                type="button"
                className={`mc__opt${isCorrect ? ' mc__opt--correct' : ''}${isWrongPick ? ' mc__opt--wrong' : ''}`}
                onClick={() => chooseMC(i)}
                disabled={submitted}
              >
                <span className="key mono">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
        {verdictStrip}
      </div>
    );
  }

  // numeric
  return (
    <div className="answer">
      <div className="answer__row">
        <input
          className="answer__input"
          type="text"
          inputMode="decimal"
          placeholder="your answer"
          aria-label="Your answer"
          autoFocus={autoFocus}
          value={raw}
          disabled={submitted}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            // Enter submits; keep it local so the feed's global nav keys don't also fire.
            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submitNumeric(); }
            else { e.stopPropagation(); }
          }}
        />
        <button type="button" className="btn" onClick={submitNumeric} disabled={submitted}>
          Check answer
        </button>
      </div>
      {error && <div className="answer__help answer__help--error" role="alert">{error}</div>}
      {!error && !submitted && (
        <div className="answer__help">Decimal (0.4) or fraction (2/5).</div>
      )}
      {verdictStrip}
    </div>
  );
}
