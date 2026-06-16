// Generator-backed feed problems — SPEC §7.4. Each re-randomizes its numbers on
// every review (seeded by problemId + reviewCount), so the SRS tests the method,
// not a memorized answer. The three-hint ladder and §6.4 solution format are
// preserved per instance.

import type { GeneratorProblem } from '../../src/types';
import { randInt, pick } from '../../src/engine/rng';

const r = String.raw;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const dieReroll: GeneratorProblem = {
  id: 'gen-die-reroll',
  topic: 'expected-value',
  techniques: ['backward-induction', 'threshold-strategy'],
  difficulty: 2,
  estMinutes: 4,
  generate(rng) {
    const n = pick(rng, [4, 6, 8, 10, 12]); // even faces avoid the threshold-tie case
    const t = (n + 1) / 2;                   // value of an unseen fresh roll
    const keepFrom = n / 2 + 1;              // smallest face worth keeping (face > t)
    let keptSum = 0;
    for (let f = keepFrom; f <= n; f++) keptSum += f;
    const keptCount = n - keepFrom + 1;
    const E = keptSum / n + ((n - keptCount) / n) * t;
    const keptList = Array.from({ length: keptCount }, (_, k) => keepFrom + k).join(',');
    const rerollList = Array.from({ length: n - keptCount }, (_, k) => 1 + k).join(',');
    return {
      statement: r`You roll a fair ${n}-sided die (faces $1$–$${n}$) and are paid its
face value in dollars. Before being paid you may discard it and roll once more —
the second roll is final. Playing optimally, what is the fair value of the game?`,
      hints: [
        r`You only ever decide *after* seeing the first roll, so ask what the
second roll is worth before you see it.`,
        r`Backward induction: an unseen fresh roll is worth $${t}$, so the optimal
rule is a threshold — reroll exactly when the current face is below it.`,
        r`Keep $\{${keptList}\}$, reroll $\{${rerollList}\}$. Compute
$E = P(\text{reroll})\cdot ${t} + \tfrac1{${n}}\sum_{\text{kept faces}} f$.`,
      ],
      solution: r`The unseen second roll is worth $E[X] = \tfrac{${n}+1}{2} = ${t}$.
Keep face $x$ iff $x > ${t}$, i.e. keep $\{${keptList}\}$ and reroll
$\{${rerollList}\}$.

$$E = \frac{${keptSum}}{${n}} + \frac{${n - keptCount}}{${n}}\cdot ${t} = ${E}.$$

Sanity check: $E$ must sit strictly between $${t}$ (rerolling blindly) and $${n}$
(always landing the top face, impossible) — and it does.

**Pattern:** Backward induction with a threshold — value the final stage first,
then the earlier decision collapses to "keep iff the current value beats the
continuation value." The continuation value *is* the threshold.

**Interview follow-ups:**
- Allow two rerolls: the threshold rises; recompute with $E_1 = ${E}$ as the new continuation value.
- General $n$ rerolls: $E_k = E[\max(X, E_{k-1})]$, $E_0 = \tfrac{n+1}{2}$.`,
      answer: { type: 'numeric', value: E, display: String(E) },
    };
  },
};

const gamblersRuin: GeneratorProblem = {
  id: 'gen-gamblers-ruin',
  topic: 'martingales',
  techniques: ['optional-stopping', 'gamblers-ruin', 'first-step-analysis'],
  difficulty: 2,
  estMinutes: 4,
  generate(rng) {
    const N = randInt(rng, 4, 12);
    const i = randInt(rng, 1, N - 1);
    const g = gcd(i, N);
    const display = `${i / g}/${N / g}`;
    const p = i / N;
    return {
      statement: r`You start with \$${i} and bet \$1 on fair coin flips, winning or
losing \$1 each flip. You stop when you hit \$0 or \$${N}. What is the probability
you reach \$${N}?`,
      hints: [
        r`Track your wealth flip by flip. Under fair \$1 bets, what is conserved in
expectation?`,
        r`Fair wealth is a martingale; optional stopping says expected wealth at the
stopping time equals the starting wealth.`,
        r`Let $p = P(\text{hit } ${N})$. Then $${i} = ${N}\,p + 0\,(1-p)$.`,
      ],
      solution: r`Wealth $W_n$ is a martingale (fair bets), the stopping time is
almost-surely finite and wealth is bounded in $[0,${N}]$, so optional stopping
applies:

$$E[W_\tau] = W_0 \;\Rightarrow\; ${N}\,p = ${i} \;\Rightarrow\; p = \tfrac{${i}}{${N}} = ${display}.$$

Sanity check: starting from \$${i} of \$${N}, the hitting probability should be the
fraction of the way you start — $${i}/${N}$. ✓ (First-step recursion
$p_j = \tfrac12 p_{j-1} + \tfrac12 p_{j+1}$ has the linear solution $p_j = j/${N}$.)

**Pattern:** Gambler's ruin, fair case — hitting probabilities are linear in the
starting state: $P(\text{hit } N \text{ from } i) = i/N$. Optional stopping turns
the whole problem into a single equation.

**Interview follow-ups:**
- Biased coin: the linear solution becomes geometric; derive it from $E[W_{\tau}]=W_0$ failing and a new martingale.
- Expected number of flips from \$${i}: $i(N-i) = ${i * (N - i)}$.`,
      answer: { type: 'numeric', value: p, display },
    };
  },
};

export const generators: GeneratorProblem[] = [dieReroll, gamblersRuin];
