// The signature element — a revealed hint as a margin note (SPEC §9): set off by
// a 2px --ballpoint rule on the left, slid/faded in. Labelled Orient / Arm / Launch
// after the three-hint ladder (§6.3).

import { MathMarkdown } from './MathMarkdown';

const LABELS = ['Hint 1 · orient', 'Hint 2 · arm', 'Hint 3 · launch'] as const;

export function MarginNote({ index, text }: { index: 0 | 1 | 2; text: string }) {
  return (
    <aside className="margin-note" aria-label={LABELS[index]}>
      <span className="margin-note__label">{LABELS[index]}</span>
      <MathMarkdown>{text}</MathMarkdown>
    </aside>
  );
}
