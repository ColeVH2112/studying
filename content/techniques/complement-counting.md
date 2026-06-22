# Complement counting

When an event is an awkward "at least one" union, compute the probability of its
negation — usually "none" — and subtract from $1$. Under independence the
negation factorizes into a clean product, whereas the union itself would need
inclusion–exclusion.

## When it fires

- "Probability of **at least one** [six / success / collision / match]."
- The complement ("none of them happen") is a product of independent events.
- A direct attack would double-count overlapping ways the union can occur.

## Worked micro-example

Probability of at least one head in three fair flips:

$$P(\text{at least one head}) = 1 - P(\text{no heads}) = 1 - \left(\tfrac12\right)^3 = \tfrac78.$$

The complement is one line; the union "$H$ on flip 1, or 2, or 3" would force
inclusion–exclusion over three overlapping events.

## Related problems

- `prob-at-least-one-six`
- `prob-three-letters-derangement`
