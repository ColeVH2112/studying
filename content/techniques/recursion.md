# Recursion

Express an unknown in terms of smaller or neighboring versions of itself, then
solve the resulting equation(s). In probability this usually means conditioning
on the first step so the remaining problem is a shrunken copy of the original.

## When it fires

- The process has a repeating structure (each flip, step, or round looks alike).
- "Expected time / probability to reach a target" with a natural first move.
- A quantity for size $n$ relates cleanly to the same quantity for $n-1$.

## Worked micro-example

Expected fair-coin flips to get one head: $E = 1 + \tfrac12\cdot 0 + \tfrac12 E$,
because after a tail you are back where you started. Solving, $\tfrac12 E = 1$, so
$E = 2$.

## Related problems

- `markov-expected-flips-hh`
