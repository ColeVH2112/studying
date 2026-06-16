# Optional stopping

If $M_n$ is a martingale and $\tau$ is a stopping time satisfying a regularity
condition (bounded $\tau$, or bounded increments with $E[\tau] < \infty$, or a
bounded process), then $E[M_\tau] = E[M_0]$. The fair game stays fair even when
you get to choose when to quit.

## When it fires

- A fair (zero-drift) random walk with absorbing barriers — "stop at $0$ or $N$."
- "What is the probability of hitting $A$ before $B$?" or "expected time to absorption?"
- A quantity that is conserved in expectation each step ("on average your wealth doesn't change").
- You want to avoid summing an infinite first-step-analysis recursion by hand.

## Worked micro-example

Symmetric walk from $i$, absorbed at $0$ or $N$. Position $W_n$ is a martingale and
$W_\tau \in \{0, N\}$, so

$$i = E[W_\tau] = N\cdot P(\text{hit }N) + 0 \;\Rightarrow\; P(\text{hit }N) = \tfrac{i}{N}.$$

To get expected duration, apply optional stopping to the second martingale
$W_n^2 - n$.

## Related problems

- `ruin-2-of-5`
- `gen-gamblers-ruin`
