import type { Problem } from '../../src/types';
const r = String.raw;

export const martingales = [
  {
    id: 'ruin-2-of-5',
    topic: 'martingales',
    techniques: ['optional-stopping', 'gamblers-ruin', 'first-step-analysis'],
    difficulty: 2,
    source: 'classic-rewrite',
    statement: r`You start with \$2 and bet \$1 on fair coin flips, winning or
losing \$1 each flip. You stop at \$0 or \$5. What is the probability you reach
\$5?`,
    hints: [
      r`Track your wealth flip by flip. Under fair bets, what stays constant
about it in expectation?`,
      r`Fair wealth is a martingale; optional stopping says expected wealth at
the stopping time equals the starting wealth.`,
      r`Let $p = P(\text{hit } 5)$. Then $2 = 5p + 0\,(1-p)$.`,
    ],
    solution: r`Wealth $W_n$ is a martingale (fair bets), the stopping time is
almost-surely finite and wealth is bounded in $[0,5]$, so optional stopping
applies:

$$E[W_\tau] = W_0 \;\Rightarrow\; 5p + 0(1-p) = 2 \;\Rightarrow\; p = \tfrac{2}{5}.$$

Sanity check: from \$2 you are closer to ruin than to \$5, so $p < \tfrac12$. ✓
(First-step recursion $p_i = \tfrac12 p_{i-1} + \tfrac12 p_{i+1}$ with linear
solution $p_i = i/5$ confirms it.)

**Pattern:** Gambler's ruin, fair case — hitting probabilities are linear in the
starting state: $P(\text{hit } N \text{ from } i) = i/N$. Optional stopping turns
the whole problem into one equation.

**Interview follow-ups:**
- Biased coin $q \neq \tfrac12$: derive $p_i = \frac{1-(q/(1-q))^{\,i}}{1-(q/(1-q))^{N}}$… careful with direction of bias.
- Expected number of flips from \$2 (answer: $i(N-i) = 6$).`,
    answer: { type: 'numeric', value: 0.4, display: '2/5' },
    estMinutes: 4,
  },
] satisfies Problem[];
