import type { Problem } from '../../src/types';
const r = String.raw;

export const markovChains = [
  {
    id: 'markov-expected-flips-hh',
    topic: 'markov-chains',
    techniques: ['first-step-analysis', 'state-space', 'recursion'],
    difficulty: 3,
    source: 'classic-rewrite',
    statement: r`You flip a fair coin until you see two heads in a row. What is the
expected number of flips?`,
    hints: [
      r`Track only what matters for the future: how much of the target pattern you
have already built. A tail wipes that progress out.`,
      r`First-step analysis over a small state space: "no progress," "one head so
far," and "done."`,
      r`Let $a$ and $b$ be the expected remaining flips from "no progress" and "one
head." Then $a = 1 + \tfrac12 b + \tfrac12 a$ and $b = 1 + \tfrac12\cdot 0 + \tfrac12 a$.`,
    ],
    solution: r`Let the state be the length of the current run of heads: $S_0$ (none
pending), $S_1$ (one head pending), $S_2$ (done). With $a = E[\text{flips}\mid S_0]$
and $b = E[\text{flips}\mid S_1]$, condition on the next flip:

$$a = 1 + \tfrac12 b + \tfrac12 a, \qquad b = 1 + \tfrac12\cdot 0 + \tfrac12 a.$$

The first gives $a = 2 + b$; substituting $b = 1 + \tfrac12 a$ yields
$a = 3 + \tfrac12 a$, so $a = 6$.

Sanity check: then $b = 1 + 3 = 4$ and $a = 2 + b = 6$ are consistent. The general
formula for a run of $k$ heads, $2^{k+1} - 2$, gives $2^3 - 2 = 6$.

**Pattern:** First-step analysis on a compressed state space — let each state be
the longest suffix of the target you have already matched, write one linear
equation per state by conditioning on the next symbol, and solve. The state, not
the full history, is what the future depends on.

**Interview follow-ups:**
- Expected flips for "heads then tails" ($HT$) instead — only $4$, because a wrong
flip there does not reset you. Explain the asymmetry.
- Three heads in a row: $2^4 - 2 = 14$.`,
    answer: { type: 'numeric', value: 6, display: '6' },
    estMinutes: 5,
  },
  {
    id: 'markov-expected-flips-ht',
    topic: 'markov-chains',
    techniques: ['first-step-analysis', 'state-space'],
    difficulty: 2,
    source: 'classic-rewrite',
    statement: r`You flip a fair coin until you see a heads immediately followed by a
tails (the pattern $HT$). What is the expected number of flips?`,
    hints: [
      r`Notice an asymmetry with the "two heads in a row" version: once you have a
head, a *wrong* next flip (another head) does not destroy your progress.`,
      r`First-step analysis with two states: "no head yet" and "a head is pending."`,
      r`Let $a$ be the expected flips with no head pending and $b$ with a head
pending. Then $b = 1 + \tfrac12 b + \tfrac12\cdot 0$.`,
    ],
    solution: r`States: $S_0$ (no pending head), $S_1$ (a head pending, waiting for a
tail). With $a, b$ the expected remaining flips, condition on the next flip:

$$a = 1 + \tfrac12 b + \tfrac12 a, \qquad b = 1 + \tfrac12 b + \tfrac12\cdot 0.$$

From the second, $\tfrac12 b = 1$, so $b = 2$. The first gives $a = 2 + b = 4$.

Sanity check: from $S_1$ an extra head keeps you in $S_1$ (no progress lost), so
$b$ is just a Geometric$(\tfrac12)$ wait for a tail, mean $2$; reaching $S_1$ needs
one head first (mean $2$ more), total $4$.

**Pattern:** The same first-step machinery as the $HH$ problem, but the transition
structure differs: $HT$ never "resets," so $E[HT] = 4 < 6 = E[HH]$. Identical-
looking patterns can have different waiting times — the overlap structure of the
pattern is what matters.

**Interview follow-ups:**
- Penney's game: against an opponent who picked $HH$, why does $HT$ win more than
half the time despite the waiting-time gap?
- Expected flips for $THT$, where the overlap reappears and lengthens the wait.`,
    answer: { type: 'numeric', value: 4, display: '4' },
    estMinutes: 4,
  },
] satisfies Problem[];
