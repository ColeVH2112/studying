# Symmetry

When a setup is invariant under relabeling or rotation, quantities that the
symmetry maps onto each other must be equal. Exploiting that often collapses a
calculation: fix one object "without loss of generality" and reason about the
rest.

## When it fires

- Objects placed "uniformly at random" around a circle, in a row, or in a deck.
- "By symmetry, the probability that A beats B equals the probability that B beats A."
- Every position / player / card is interchangeable in the problem's description.
- You can fix one element's location to kill a degree of freedom for free.

## Worked micro-example

Two specific people seated at random around a round table of $n$: fix the first
person anywhere; the second is uniform over the remaining $n-1$ seats, $2$ of
which are adjacent, so

$$P(\text{adjacent}) = \tfrac{2}{n-1}.$$

Fixing one seat by symmetry removed the rotational freedom at no cost.

## Related problems

- `couples-round-table`
