# Bayes by natural frequencies (the grid)

Instead of plugging into Bayes' rule, imagine a concrete population and tally it
in a small table. The posterior is then a ratio of counts — base rates become
impossible to forget, and the arithmetic is grade-school.

## When it fires

- Any "given the evidence, probability of the cause" question.
- Base-rate problems where a rare condition meets an imperfect test.
- You want a fast, error-resistant answer without juggling $P(A\mid B)$ vs $P(B\mid A)$.

## Worked micro-example

$1\%$ disease prevalence, $99\%$ sensitivity, $5\%$ false-positive rate. Take
$10{,}000$ people:

| | test $+$ | test $-$ |
|---|---|---|
| sick ($100$) | $99$ | $1$ |
| healthy ($9900$) | $495$ | $9405$ |

Positives total $99 + 495 = 594$, so $P(\text{sick}\mid +) = \tfrac{99}{594} = \tfrac16$.

## Related problems

- `bayes-rare-disease`
- `bayes-two-coins-heads`
- `bayes-two-children-boys`
