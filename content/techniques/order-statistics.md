# Order statistics

The min, max, or $k$-th smallest of a sample has a distribution you can write down
directly from independence: $P(\max \le t) = F(t)^n$ and
$P(\min > t) = (1 - F(t))^n$. Pair this with the tail formula
$E[X] = \int_0^\infty P(X > t)\,dt$ (for $X \ge 0$) to get expectations without a
density.

## When it fires

- "Expected value of the largest / smallest of $n$ draws."
- The extreme of i.i.d. samples, or the time of the first/last of several arrivals.
- You can write the CDF by independence even when the density is awkward.

## Worked micro-example

For $n$ i.i.d. Uniform$(0,1)$ draws, $P(\max \le t) = t^n$, so

$$E[\max] = \int_0^1 \big(1 - t^n\big)\,dt = \frac{n}{n+1}.$$

## Related problems

- `ev-max-two-uniforms`
