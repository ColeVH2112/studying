import type { Problem } from '../../src/types';
const r = String.raw;

export const bayes = [
  {
    id: 'bayes-two-coins-heads',
    topic: 'bayes',
    techniques: ['bayes-grid', 'conditioning'],
    difficulty: 2,
    source: 'classic-rewrite',
    statement: r`A drawer holds two coins: one ordinary fair coin, and one
double-headed coin. You grab a coin at random, flip it, and it shows heads. What
is the probability that you grabbed the double-headed coin?`,
    hints: [
      r`Before flipping, each coin was equally likely. The heads you saw is
stronger evidence for one coin than the other — by how much?`,
      r`Bayes by natural frequencies: imagine repeating this many times and tally
how many of the "heads" outcomes come from each coin.`,
      r`The double-headed coin yields heads twice as often as the fair coin ($1$ vs
$\tfrac12$); weight the two equal priors by that.`,
    ],
    solution: r`Imagine grabbing-and-flipping $4$ times (a grid of equally likely
flips). The double-headed coin, chosen half the time, shows heads on both of its
imagined flips; the fair coin, the other half, shows heads on one of its two:

$$\text{heads from double-headed} : \text{heads from fair} = 2 : 1.$$

So

$$P(\text{double-headed}\mid \text{heads})
= \frac{P(H\mid DH)\,P(DH)}{P(H)}
= \frac{1\cdot\tfrac12}{1\cdot\tfrac12 + \tfrac12\cdot\tfrac12}
= \frac{\tfrac12}{\tfrac34} = \tfrac23.$$

Sanity check: heads is evidence *for* the double-headed coin, so the posterior
must exceed the $\tfrac12$ prior — and $\tfrac23 > \tfrac12$.

**Pattern:** Bayes by natural frequencies — rather than plugging into the formula,
populate a small representative population and read the posterior as a ratio of
counts. It makes priors and base rates impossible to drop.

**Interview follow-ups:**
- You flip the same coin again and again get heads — update to $\tfrac45$.
- $n$ coins, one of them double-headed: after a single heads, $P(DH)=\tfrac{2}{n+1}$.`,
    answer: { type: 'numeric', value: 2 / 3, display: '2/3', tolerance: 0.001 },
    estMinutes: 4,
  },
  {
    id: 'bayes-rare-disease',
    topic: 'bayes',
    techniques: ['bayes-grid', 'law-of-total-probability', 'conditioning'],
    difficulty: 3,
    source: 'classic-rewrite',
    statement: r`A disease affects $1\%$ of a population. A test catches $99\%$ of
true cases (it is $99\%$ sensitive) and has a $5\%$ false-positive rate. A randomly
chosen person tests positive. What is the probability they actually have the
disease?`,
    hints: [
      r`The test sounds accurate, but the healthy group is $99$ times larger than
the sick group. Which group will supply most of the positive results?`,
      r`Use the law of total probability for the denominator, then Bayes — or just
count a concrete population of $10{,}000$.`,
      r`In $10{,}000$ people: $100$ sick (of whom $99$ test positive) and $9900$
healthy (of whom $5\%$ test positive).`,
    ],
    solution: r`Take $10{,}000$ people. Sick: $100$, of whom $0.99\cdot100 = 99$ test
positive. Healthy: $9900$, of whom $0.05\cdot9900 = 495$ test positive. Total
positives $= 99 + 495 = 594$, so

$$P(\text{disease}\mid +) = \frac{99}{594} = \tfrac16 \approx 0.167.$$

Equivalently, the law of total probability gives
$P(+) = (0.99)(0.01) + (0.05)(0.99) = 0.0594$, and
$P(\text{disease}\mid +) = \tfrac{0.0099}{0.0594} = \tfrac16$.

Sanity check: despite a "$99\%$ accurate" test, most positives are false because
the base rate is tiny — the false positives ($495$) swamp the true positives
($99$), so the answer sits well below $\tfrac12$.

**Pattern:** With a rare base rate, the false-positive *count* dominates even when
the false-positive *rate* is small. A natural-frequency table exposes this at a
glance; the law of total probability supplies the denominator $P(+)$.

**Interview follow-ups:**
- What specificity would push $P(\text{disease}\mid +)$ above $\tfrac12$? (Set the
true-positive count $\ge$ the false-positive count.)
- Two independent positive tests in a row — re-apply Bayes with the new prior.`,
    answer: { type: 'numeric', value: 1 / 6, display: '1/6', tolerance: 0.001 },
    estMinutes: 5,
  },
  {
    id: 'bayes-two-children-boys',
    topic: 'bayes',
    techniques: ['conditioning'],
    difficulty: 2,
    source: 'classic-rewrite',
    statement: r`A family has two children. You learn that at least one of them is a
boy (each child is independently a boy or girl with probability $\tfrac12$). What
is the probability that **both** children are boys?`,
    hints: [
      r`Write down the equally likely possibilities for an ordered pair of children
before using any information, then see which survive the evidence.`,
      r`Condition on the evidence: restrict the sample space to outcomes consistent
with "at least one boy," then renormalize.`,
      r`The four outcomes $\{BB, BG, GB, GG\}$ are equally likely; the evidence
rules out only $GG$.`,
    ],
    solution: r`Order the children. The four equally likely outcomes are
$BB,\, BG,\, GB,\, GG$. "At least one boy" eliminates $GG$, leaving three equally
likely cases $\{BB, BG, GB\}$. Only $BB$ has two boys:

$$P(BB \mid \text{at least one boy}) = \tfrac13.$$

Sanity check: the evidence is consistent with three of the four original worlds
and only one of them is $BB$, so the answer must fall below the naive $\tfrac12$ —
and $\tfrac13 < \tfrac12$.

**Pattern:** Conditioning = shrink the sample space to the outcomes consistent
with the evidence, then renormalize. The subtlety: "at least one boy" is *not* the
same evidence as "the older child is a boy," which would give $\tfrac12$.

**Interview follow-ups:**
- "At least one boy born on a Tuesday" — the extra detail shifts the answer to
$\tfrac{13}{27}$.
- "The older child is a boy" — now the answer is $\tfrac12$; explain why the two
conditioning sets differ.`,
    answer: { type: 'multiple-choice', options: ['1/2', '1/3', '1/4', '2/3'], correctIndex: 1 },
    estMinutes: 3,
  },
] satisfies Problem[];
