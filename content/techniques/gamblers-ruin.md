# Gambler's ruin

A random walk between two absorbing barriers at $0$ and $N$. In the **fair** case
the probability of hitting $N$ before $0$ from state $i$ is linear, $i/N$, and the
expected time to absorption is $i(N-i)$. The biased case replaces the line with a
geometric ratio.

## When it fires

- "Start with \$$i$, bet \$1 on a coin until you reach \$$N$ or go broke."
- Any one-dimensional walk with two absorbing endpoints.
- "Probability of reaching the upper barrier first?" or "expected number of steps?"
- A symmetric setup where you suspect the answer is "the fraction of the way you start."

## Worked micro-example

Fair walk from $i=3$, barriers $0$ and $N=10$:

$$P(\text{hit }10) = \tfrac{3}{10}, \qquad E[\text{steps}] = 3\,(10-3) = 21.$$

The hitting probability is read straight off the linear solution $p_i = i/N$.

## Related problems

- `ruin-2-of-5`
- `gen-gamblers-ruin`
