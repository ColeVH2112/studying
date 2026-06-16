import type { Problem } from '../../src/types';
const r = String.raw;

export const combinatorics = [
  {
    id: 'couples-round-table',
    topic: 'combinatorics',
    techniques: ['indicator-variables', 'linearity-of-expectation', 'symmetry'],
    difficulty: 3,
    source: 'classic-rewrite',
    statement: r`Ten couples (20 people) are seated uniformly at random around a
circular table. What is the expected number of couples sitting next to each
other?`,
    hints: [
      r`Counting seatings where exactly $k$ couples are adjacent is painful.
What's the move that avoids ever computing a joint distribution?`,
      r`Indicator variables + linearity of expectation: the indicators don't need
to be independent.`,
      r`Fix one partner's seat by symmetry; the other partner is uniform over the
remaining $19$ seats, $2$ of which are adjacent.`,
    ],
    solution: r`Let $I_j$ indicate that couple $j$ is adjacent. By the circle's
symmetry, fix one partner anywhere; the other is uniform over the other $19$
seats and exactly $2$ are neighbors, so $E[I_j] = \tfrac{2}{19}$. Linearity
(no independence needed):

$$E\Big[\sum_{j=1}^{10} I_j\Big] = 10 \cdot \tfrac{2}{19} = \tfrac{20}{19} \approx 1.053.$$

Sanity check: about one adjacent couple on average feels right for 10 couples in
20 seats — and it exceeds 1 slightly because each couple has two chances (left
or right neighbor).

**Pattern:** When asked for an expected *count*, sum indicator expectations.
Dependence between events is irrelevant; symmetry usually hands you each
$E[I_j]$ in one line.

**Interview follow-ups:**
- Variance of the count (now dependence matters — covariance of $I_i, I_j$).
- Same question in a row: a couple's two seats are uniform over $\binom{20}{2}=190$
pairs, of which $19$ are adjacent, so $E[I_j]=\tfrac{19}{190}=\tfrac1{10}$ and the
expected count is exactly $1$.
- $P(\text{no couple adjacent})$ via inclusion–exclusion.`,
    answer: { type: 'numeric', value: 1.0526315789, tolerance: 0.001, display: '20/19' },
    estMinutes: 6,
  },
] satisfies Problem[];
