# First-step analysis

Condition on the very first transition: write the quantity you want (a hitting
probability, an expected time) as a weighted average over where the first step
lands, producing a recurrence you can solve. It turns a process question into
algebra on boundary conditions.

## When it fires

- A Markov chain or random walk where each state's value depends on its neighbors'.
- "Expected number of steps until ___" or "probability of ___ before ___."
- You can fix the absorbing states' values and need the interior ones.
- The chain is small enough that a recurrence + boundary conditions is tractable.

## Worked micro-example

Fair walk, $p_i = P(\text{hit }N\text{ from }i)$ with $p_0=0,\ p_N=1$:

$$p_i = \tfrac12 p_{i-1} + \tfrac12 p_{i+1} \;\Rightarrow\; p_i \text{ is linear} \;\Rightarrow\; p_i = \tfrac{i}{N}.$$

The single recurrence plus two boundary values pins down every interior state.

## Related problems

- `ruin-2-of-5`
- `gen-gamblers-ruin`
