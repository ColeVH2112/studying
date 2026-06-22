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
  {
    id: 'combinatorics-permutation-records',
    topic: 'combinatorics',
    techniques: ['indicator-variables', 'linearity-of-expectation', 'symmetry'],
    difficulty: 3,
    source: 'classic-rewrite',
    statement: r`The numbers $1$ through $5$ are arranged in a uniformly random
order. Reading left to right, a "record" is an entry larger than everything before
it (the first entry is always a record). What is the expected number of records?`,
    hints: [
      r`Finding the distribution of the record *count* is painful. Attach a $0/1$
variable to each position and ask only about that position in isolation.`,
      r`Indicator variables + linearity: position $j$ is a record exactly when the
largest of the first $j$ entries happens to sit at position $j$.`,
      r`By symmetry the maximum of the first $j$ entries is equally likely to be in
any of those $j$ positions, so $P(\text{record at } j) = \tfrac1j$.`,
    ],
    solution: r`Let $I_j = 1$ if position $j$ holds a record. Among the first $j$
entries, each is equally likely (by symmetry) to be the largest, and a record at
$j$ means that largest one lands last — probability $\tfrac1j$. By linearity,

$$E[\text{records}] = \sum_{j=1}^{5}\frac1j
= 1 + \tfrac12 + \tfrac13 + \tfrac14 + \tfrac15 = \tfrac{137}{60} \approx 2.283.$$

Sanity check: the first entry is always a record ($\tfrac11$) and later entries are
increasingly unlikely to set one; a total of $H_5 \approx 2.28$ for five entries
fits the $\ln n$ growth.

**Pattern:** Indicator variables + linearity of expectation turn an "expected
count" into a sum of per-item probabilities, and symmetry hands you each
probability ($\tfrac1j$) in one line — no independence required.

**Interview follow-ups:**
- General $n$: $E[\text{records}] = H_n \approx \ln n + \gamma$.
- Variance of the record count — the $I_j$ are in fact independent here, a pleasant
surprise worth proving.`,
    answer: { type: 'numeric', value: 137 / 60, display: '137/60', tolerance: 0.001 },
    estMinutes: 5,
  },
] satisfies Problem[];
