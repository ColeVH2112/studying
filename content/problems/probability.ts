import type { Problem } from '../../src/types';
const r = String.raw;

export const probability = [
  {
    id: 'prob-at-least-one-six',
    topic: 'probability',
    techniques: ['complement-counting', 'inclusion-exclusion'],
    difficulty: 1,
    source: 'classic-rewrite',
    statement: r`A fair six-sided die is rolled four times. What is the probability
that at least one roll shows a six?`,
    hints: [
      r`"At least one" is a union of overlapping events — listing the ways it can
happen double-counts. Is there a single event whose probability is easier to pin
down exactly?`,
      r`Complement counting: the negation "no six in any of the four rolls"
factorizes because the rolls are independent.`,
      r`Compute $P(\text{no six}) = (5/6)^4$ and subtract from $1$.`,
    ],
    solution: r`The complement "no six on any roll" is a product of independent
events:

$$P(\text{no six}) = \left(\tfrac56\right)^4 = \tfrac{625}{1296}.$$

So

$$P(\text{at least one six}) = 1 - \tfrac{625}{1296} = \tfrac{671}{1296} \approx 0.5177.$$

Sanity check (inclusion–exclusion, the hard way):
$\binom41\tfrac16 - \binom42\tfrac1{36} + \binom43\tfrac1{216} - \binom44\tfrac1{1296}
= \tfrac{864 - 216 + 24 - 1}{1296} = \tfrac{671}{1296}$ — the same number, far more work.

**Pattern:** Complement counting — when the event is an "at least one" union,
compute the probability of *none* (which factorizes under independence) and
subtract from $1$. The inclusion–exclusion of the union telescopes into one clean
product.

**Interview follow-ups:**
- How many rolls until $P(\text{at least one six}) \ge \tfrac12$? Solve
$(5/6)^n \le \tfrac12$, giving $n = 4$.
- Probability of at least one six *and* at least one one in four rolls (two
complements now — inclusion–exclusion on the two "missing-face" events).`,
    answer: { type: 'numeric', value: 671 / 1296, display: '671/1296', tolerance: 0.001 },
    estMinutes: 3,
  },
  {
    id: 'prob-three-letters-derangement',
    topic: 'probability',
    techniques: ['inclusion-exclusion', 'complement-counting'],
    difficulty: 2,
    source: 'classic-rewrite',
    statement: r`Three distinct letters are placed at random into three
pre-addressed envelopes, one letter per envelope. What is the probability that
**no** letter lands in its correct envelope?`,
    hints: [
      r`Out of all the ways to place the letters, you want the fraction with zero
correct matches. Counting "zero matches" directly is easier once you count its
opposite.`,
      r`Inclusion–exclusion on the events $A_i =$ "letter $i$ is correct," or just
enumerate the $3! = 6$ permutations.`,
      r`Count placements with at least one fixed point via
$|A_1\cup A_2\cup A_3|$, then subtract from $6$.`,
    ],
    solution: r`There are $3! = 6$ equally likely placements. Let $A_i$ be the event
that letter $i$ is correct. By inclusion–exclusion,

$$|A_1\cup A_2\cup A_3| = \underbrace{3\cdot 2!}_{\text{one fixed}}
   - \underbrace{3\cdot 1!}_{\text{two fixed}}
   + \underbrace{1\cdot 0!}_{\text{all three}} = 6 - 3 + 1 = 4.$$

So $4$ placements have at least one match and $6 - 4 = 2$ are derangements:

$$P(\text{no match}) = \tfrac{2}{6} = \tfrac13.$$

Sanity check: the two derangements of $123$ are $231$ and $312$ — exactly $2$,
confirming $D_3 = 2$.

**Pattern:** Inclusion–exclusion counts a union of "bad" events by alternately
adding and subtracting intersection sizes; pairing it with complement counting
turns "none of them" into "total minus the union."

**Interview follow-ups:**
- General $n$: $P(\text{derangement}) = \sum_{k=0}^{n}\tfrac{(-1)^k}{k!}\to e^{-1}\approx 0.368$.
- Expected number of correct matches — linearity gives exactly $1$, for every $n$.`,
    answer: { type: 'numeric', value: 1 / 3, display: '1/3', tolerance: 0.001 },
    estMinutes: 4,
  },
] satisfies Problem[];
