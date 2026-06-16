# Indicator variables

Replace a hard-to-count quantity with a sum of $0/1$ random variables, one per
event you care about. Because expectation is linear, $E[\sum_j I_j] = \sum_j E[I_j]$
regardless of how the indicators depend on one another.

## When it fires

- "What is the **expected number** of [collisions / fixed points / adjacent pairs / records]?"
- You can describe the count as "how many of these $n$ things have property $P$."
- A direct count would force you to track a joint distribution or do inclusion–exclusion.
- Symmetry makes every individual event equally likely, so one $E[I_j]$ settles all of them.

## Worked micro-example

Expected fixed points of a uniform random permutation of $n$ elements. Let
$I_j = 1$ if item $j$ maps to position $j$. Then $E[I_j] = \tfrac1n$, so

$$E\Big[\sum_{j=1}^n I_j\Big] = \sum_{j=1}^n \tfrac1n = 1,$$

independent of $n$ — and the $I_j$ are *not* independent, which never mattered.

## Related problems

- `couples-round-table`
