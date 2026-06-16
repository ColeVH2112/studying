# Backward induction

Solve a multi-stage decision by valuing the **last** stage first, then working
backward: at each earlier stage you already know the value of continuing, so the
decision collapses to "act now iff the current payoff beats the continuation
value." The continuation value is exactly the threshold to compare against.

## When it fires

- "You may stop now or continue; the future is some known random process." (optimal stopping)
- A game with a fixed number of rounds and a decision each round.
- "When should you accept / reroll / exercise / quit?" — a threshold rule is expected.
- The naive forward approach needs the whole strategy at once, but the final step is trivial to value.

## Worked micro-example

One reroll of a fair $6$-sided die. The final (forced) roll is worth its mean,
$3.5$. So at the first roll you keep $x$ iff $x > 3.5$:

$$E = \tfrac12\cdot\tfrac{4+5+6}{3} + \tfrac12\cdot 3.5 = 2.5 + 1.75 = 4.25.$$

The threshold $3.5$ *is* the continuation value, read straight off the last stage.

## Related problems

- `ev-die-one-reroll`
- `gen-die-reroll`
