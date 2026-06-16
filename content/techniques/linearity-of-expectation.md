# Linearity of expectation

$E[X+Y] = E[X] + E[Y]$ for *any* random variables, dependent or not. This lets
you decompose a complicated total into simple pieces, take each piece's
expectation in isolation, and add — independence is never required.

## When it fires

- "Expected total / count / sum of ___" where the total splits into parts.
- The parts are dependent and a joint distribution looks hopeless.
- Each part's expectation is a one-liner (often via an indicator and symmetry).
- You catch yourself reaching for inclusion–exclusion on an *expectation*.

## Worked micro-example

Expected number of heads in $n$ flips of a coin with bias $p$. Let $X_k$ indicate
heads on flip $k$:

$$E\Big[\sum_{k=1}^n X_k\Big] = \sum_{k=1}^n E[X_k] = \sum_{k=1}^n p = np,$$

with no need to touch the binomial distribution.

## Related problems

- `couples-round-table`
