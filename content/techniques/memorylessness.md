# Memorylessness

The geometric and exponential distributions forget the past: given that you have
already waited, the remaining wait has the *same* distribution as a fresh one.
This collapses "expected additional time" arguments to a single unconditional
expectation.

## When it fires

- Waiting for the next success in independent identical trials (geometric).
- "Given no success yet after $k$ trials, expected further wait" — it's unchanged.
- Decomposing a long wait into independent geometric stages (coupon collector).

## Worked micro-example

Rolling a die until the first six: each roll is an independent $\tfrac16$ chance,
so the wait is Geometric$(\tfrac16)$ with mean $6$ — and after any number of
failures the expected remaining rolls is still $6$.

## Related problems

- `ev-coupon-collector-die`
