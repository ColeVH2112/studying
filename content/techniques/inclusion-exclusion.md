# Inclusion–exclusion

To count (or find the probability of) a union of overlapping events, add the
sizes of the events, subtract the pairwise intersections, add back the triples,
and so on:

$$\Big|\bigcup_i A_i\Big| = \sum_i |A_i| - \sum_{i<j}|A_i\cap A_j| + \sum_{i<j<k}|A_i\cap A_j\cap A_k| - \cdots$$

## When it fires

- A union of events that overlap, so you cannot just add their sizes.
- "At least one of several constraints holds" — and the constraints can co-occur.
- Counting derangements, surjections, or "no forbidden pattern" arrangements.

## Worked micro-example

How many of the $6$ permutations of $\{1,2,3\}$ fix at least one element? With
$A_i = \{$ position $i$ correct $\}$:

$$|A_1\cup A_2\cup A_3| = 3\cdot 2! - 3\cdot 1! + 1\cdot 0! = 6 - 3 + 1 = 4,$$

so $6 - 4 = 2$ are derangements.

## Related problems

- `prob-three-letters-derangement`
- `prob-at-least-one-six`
