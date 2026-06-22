# Conditioning

Split a hard probability into cases by the outcome of a first event or piece of
information. Once you know which case you are in, the rest of the problem is
usually easy; weight the cases by their probabilities to recombine.

## When it fires

- Evidence is given ("at least one is a boy", "the test was positive") — shrink
  the sample space to outcomes consistent with it, then renormalize.
- A natural "first step" (first flip, first card, first arrival) makes the
  remaining problem a smaller copy of itself.
- You can answer the question easily *if only* you knew one extra fact — so
  condition on that fact.

## Worked micro-example

Two fair dice; given that the first shows an even number, the probability the sum
is $7$. Restrict to the even first-die worlds $\{2,4,6\}$; each pairs with exactly
one second die making $7$:

$$P(\text{sum }7 \mid \text{first even}) = \tfrac{3}{18} = \tfrac16.$$

## Related problems

- `bayes-two-children-boys`
- `bayes-rare-disease`
- `bayes-two-coins-heads`
