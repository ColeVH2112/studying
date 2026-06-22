# Law of total probability

For a partition $B_1,\dots,B_n$ of the sample space,

$$P(A) = \sum_i P(A \mid B_i)\,P(B_i).$$

It is the engine that builds the denominator $P(A)$ in Bayes' rule: average the
conditional probabilities, weighted by how likely each case is.

## When it fires

- You know $P(A \mid B_i)$ in each scenario but want the unconditional $P(A)$.
- Computing the denominator of a Bayes update ("$P(\text{positive test})$").
- A quantity is easy *given* a hidden cause; sum over the causes.

## Worked micro-example

A test is positive on $99\%$ of sick people and $5\%$ of healthy people; $1\%$ are
sick. The overall positive rate:

$$P(+) = (0.99)(0.01) + (0.05)(0.99) = 0.0594.$$

## Related problems

- `bayes-rare-disease`
