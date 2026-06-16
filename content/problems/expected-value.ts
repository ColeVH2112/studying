import type { Problem } from '../../src/types';
const r = String.raw;

export const expectedValue = [
  {
    id: 'ev-die-one-reroll',
    topic: 'expected-value',
    techniques: ['backward-induction', 'threshold-strategy'],
    difficulty: 2,
    source: 'classic-rewrite',
    statement: r`You roll a fair six-sided die and are paid its face value in
dollars. Before being paid, you may discard the roll and roll once more — the
second roll is final. Playing optimally, what is the fair value of this game?`,
    hints: [
      r`You never decide anything before seeing the first roll, so think about
what the *second* roll is worth before you see it.`,
      r`Backward induction: a fresh roll is worth $3.5$ in expectation, so the
optimal rule is a threshold — reroll exactly when the current face is below it.`,
      r`Keep $4,5,6$; reroll $1,2,3$. Compute
$E = P(\text{keep}) \cdot E[\text{face}\mid\text{keep}] + P(\text{reroll}) \cdot 3.5$.`,
    ],
    solution: r`The second roll, unseen, is worth $E[X] = 3.5$. So after the first
roll you keep face $x$ iff $x > 3.5$, i.e. keep $\{4,5,6\}$, reroll $\{1,2,3\}$.

$$E = \tfrac{3}{6}\cdot\tfrac{4+5+6}{3} + \tfrac{3}{6}\cdot 3.5
    = \tfrac12 (5) + \tfrac12(3.5) = 4.25.$$

Sanity check: it must land strictly between $3.5$ (no option) and $5$ (keeping
only the best face is impossible half the time) — it does.

**Pattern:** Backward induction with a threshold — value the final stage first,
then the earlier decision collapses to "act iff current value beats the
continuation value." The continuation value *is* the threshold.

**Interview follow-ups:**
- Two rerolls allowed — show the threshold rises and $E = 14/3 \approx 4.67$.
- $n$ rerolls: write the recursion $E_{n} = E[\max(X, E_{n-1})]$ and its limit.`,
    answer: { type: 'numeric', value: 4.25, display: '4.25' },
    estMinutes: 4,
  },
] satisfies Problem[];
