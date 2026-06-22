# State space

Compress the entire history into a minimal "state" that captures everything the
future depends on. Once the states and transition probabilities are written down,
first-step analysis or a linear system finishes the job.

## When it fires

- The future depends on the past only through a small summary (a Markov property).
- Waiting for a pattern: the state is "how much of the target you've matched."
- Random walks / absorbing chains where position is all that matters.

## Worked micro-example

Waiting for two heads in a row, the only thing that matters about the past is
whether the previous flip was a (pending) head. So three states suffice — "no
pending head", "one pending head", "done" — and each gets one equation.

## Related problems

- `markov-expected-flips-hh`
- `markov-expected-flips-ht`
