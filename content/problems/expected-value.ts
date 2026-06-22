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
  {
    id: 'ev-coupon-collector-die',
    topic: 'expected-value',
    techniques: ['linearity-of-expectation', 'memorylessness'],
    difficulty: 3,
    source: 'classic-rewrite',
    statement: r`You repeatedly roll a fair six-sided die. What is the expected
number of rolls until you have seen all six faces at least once?`,
    hints: [
      r`Break the journey into stages by how many *distinct* faces you have
collected so far. Within a stage, every roll has the same chance of being "new."`,
      r`Linearity of expectation over the six stages; each stage's wait is
geometric, and a geometric wait has no memory.`,
      r`With $k$ faces already seen, a new face appears with probability
$\tfrac{6-k}{6}$, so that stage takes $\tfrac{6}{6-k}$ rolls on average. Sum over
$k = 0,\dots,5$.`,
    ],
    solution: r`Let $T_k$ be the rolls spent going from $k$ distinct faces to
$k+1$. A new face has probability $\tfrac{6-k}{6}$, so $T_k$ is Geometric with mean
$E[T_k] = \tfrac{6}{6-k}$. By linearity,

$$E[T] = \sum_{k=0}^{5}\frac{6}{6-k}
= 6\left(\tfrac16 + \tfrac15 + \tfrac14 + \tfrac13 + \tfrac12 + 1\right)
= 6\cdot\tfrac{147}{60} = 14.7.$$

Sanity check: the last face alone takes $6$ rolls on average and the first takes
$1$, so a total comfortably above $6$ but well below $36$ is reasonable;
$6H_6 = 6(2.45) = 14.7$.

**Pattern:** Coupon collector — partition a "collect them all" wait into per-item
stages, each a geometric (hence memoryless) wait, and add the means by linearity.
The harmonic sum $nH_n \approx n\ln n$ is the signature.

**Interview follow-ups:**
- General $n$ coupons: $nH_n \approx n\ln n + \gamma n$.
- Expected rolls to see each face *twice*, or with a biased die (the stages no
longer share a clean success probability).`,
    answer: { type: 'numeric', value: 14.7, display: '14.7', tolerance: 0.01 },
    estMinutes: 5,
  },
  {
    id: 'ev-max-two-uniforms',
    topic: 'expected-value',
    techniques: ['order-statistics', 'symmetry'],
    difficulty: 2,
    source: 'classic-rewrite',
    statement: r`Two numbers are drawn independently and uniformly from $[0,1]$. What
is the expected value of the larger of the two?`,
    hints: [
      r`The larger of two values exceeds a threshold $t$ exactly when *not both*
fall below $t$ — a statement about the whole sample at once.`,
      r`Use the order-statistic CDF $P(\max \le t) = t^2$, then either differentiate
for the density or integrate the tail $P(\max > t)$.`,
      r`Tail formula: $E[\max] = \int_0^1 P(\max > t)\,dt = \int_0^1 (1 - t^2)\,dt$.`,
    ],
    solution: r`The max is $\le t$ iff both draws are $\le t$, so $P(\max \le t) = t^2$
and $P(\max > t) = 1 - t^2$ on $[0,1]$. Using $E[X] = \int_0^1 P(X > t)\,dt$ for a
variable bounded in $[0,1]$:

$$E[\max] = \int_0^1 (1 - t^2)\,dt = 1 - \tfrac13 = \tfrac23.$$

Sanity check (density route): $f_{\max}(t) = 2t$, so
$E[\max] = \int_0^1 t\cdot 2t\,dt = \tfrac23$; and it must exceed $\tfrac12$, the
mean of a single draw, which it does.

**Pattern:** Order statistics — the max/min of i.i.d. draws has a CDF you can write
down by independence ($P(\max \le t) = F(t)^n$), and the tail integral
$E[X] = \int P(X > t)\,dt$ often beats computing a density. For $n$ uniforms,
$E[\max] = \tfrac{n}{n+1}$.

**Interview follow-ups:**
- $E[\min] = \tfrac13$; note $E[\min] + E[\max] = 1$ by the symmetry $x \mapsto 1-x$.
- Expected gap $E[\max - \min] = \tfrac13$, and the general $E[\max] = \tfrac{n}{n+1}$.`,
    answer: { type: 'numeric', value: 2 / 3, display: '2/3', tolerance: 0.001 },
    estMinutes: 4,
  },
] satisfies Problem[];
