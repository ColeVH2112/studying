# Threshold strategy

When you repeatedly choose between a known continuation value and the current
draw, the optimum is always a cutoff: accept iff the current value exceeds the
value of continuing. You never need a complicated rule — just the threshold,
which the backward-induction value hands you.

## When it fires

- "You may keep the current [roll / offer / card] or draw again."
- A secretary-style problem: observe values one at a time, decide stop-or-go.
- "Reroll if the face is below ___" — the structure of the answer is a single number.
- The continuation value is computable (a mean, or a previously-solved stage).

## Worked micro-example

Draw $U \sim \text{Uniform}(0,1)$; you may keep it or take a fresh draw worth
$\tfrac12$ in expectation. Keep iff $U > \tfrac12$, so

$$E = \tfrac12\cdot E[U \mid U > \tfrac12] + \tfrac12\cdot\tfrac12 = \tfrac12\cdot\tfrac34 + \tfrac14 = \tfrac58.$$

The cutoff $\tfrac12$ is just the continuation value.

## Related problems

- `ev-die-one-reroll`
- `gen-die-reroll`
