// Central content registry. Every Problem and GeneratorProblem the app and the
// validate script know about is aggregated here.

import type { Problem } from '../src/types';
import { expectedValue } from './problems/expected-value';
import { martingales } from './problems/martingales';
import { combinatorics } from './problems/combinatorics';
import { generators } from './generators';

export const problems: Problem[] = [
  ...expectedValue,
  ...martingales,
  ...combinatorics,
];

export { generators };
