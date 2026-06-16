# QuantFeed — Build Specification

A static, locally-hosted quant interview trainer. One problem per screen, doomscroll
navigation, forced attempt-before-reveal, spaced repetition driving the feed order.
No backend. Runs via `npm run dev`, optionally deploys to GitHub Pages.

This document is the source of truth. Where code and spec disagree, the spec wins.
Deviations require a note in `DECISIONS.md`.

---

## 1. Goals and constraints

- **Goal:** the highest-leverage daily study loop for quant interviews (Green-Book-style
  probability/EV/Markov/combinatorics, brainteasers, plus timed mental math).
- **Constraints:** fully static (Vite build), no server, no accounts, no analytics.
  All state in `localStorage` with export/import. Works on desktop (primary) and
  mobile (snap-scroll feed).
- **Content:** all problems are original or original rewrites of classic/public ideas.
  No verbatim copyrighted text.

## 2. Pedagogy (why each mechanic exists)

1. **Active recall** — the answer input / hint ladder forces an attempt before anything
   is revealed. Passive reading is the failure mode this app exists to prevent.
2. **Spaced repetition** — every problem carries SM-2-style review state. The feed is
   not random; it is the review queue wearing a doomscroll costume.
3. **Interleaving** — adjacent cards avoid sharing a topic. Mixed practice beats
   blocked practice for transfer, which is exactly what interviews test.
4. **Technique consolidation** — every solution ends with a named, reusable pattern
   ("indicator variables + linearity") linking to a technique page. The unit of
   learning is the technique, not the problem.
5. **Pressure calibration** — drill mode reproduces timed-arithmetic screens
   (Optiver-style 80-in-8) with a visible pace clock.
6. **Variation** — generator-backed problems re-randomize their numbers on every
   review, so the SRS tests the method, not the memorized answer.

## 3. Stack and dependencies

- Vite + React 18 + TypeScript (strict).
- Runtime deps: `react`, `react-dom`, `katex`, `react-markdown`, `remark-math`,
  `rehype-katex`, `zod`, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono`.
- Dev deps: `typescript`, `vite`, `@vitejs/plugin-react`, `vitest`, `@types/react`,
  `@types/react-dom`, `tsx`.
- **No other dependencies.** No router (use hash routing), no state library
  (React state + small stores), no CSS framework (hand-written CSS with custom
  properties per §9). Adding a dep requires a `DECISIONS.md` entry.

npm scripts:

```
dev / build / preview       vite
typecheck                   tsc --noEmit
test                        vitest
validate                    tsx scripts/validate-content.ts
```

## 4. Repository layout

```
quant-feed/
├── SPEC.md                     # this file
├── CLAUDE.md                   # working conventions for the agent
├── DECISIONS.md                # running log of deviations/choices
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts              # base: '/<REPO_NAME>/' for Pages
├── .github/workflows/deploy.yml
├── scripts/validate-content.ts # zod-validates all content, checks id uniqueness
├── content/
│   ├── problems/               # TS modules, one per topic
│   │   ├── expected-value.ts
│   │   ├── martingales.ts
│   │   └── combinatorics.ts
│   ├── generators/             # parameterized problems + drill generators
│   │   ├── index.ts
│   │   └── mental-math.ts
│   └── techniques/             # markdown, one page per technique id
│       ├── indicator-variables.md
│       └── ...
└── src/
    ├── main.tsx
    ├── App.tsx                 # hash router: #feed #drill #stats #techniques #settings
    ├── types.ts                # canonical types (§5)
    ├── engine/
    │   ├── scheduler.ts        # SM-2-lite (§7.1) — pure
    │   ├── feedBuilder.ts      # queue construction (§7.2) — pure
    │   ├── grading.ts          # answer parsing/checking (§7.3) — pure
    │   ├── rng.ts              # mulberry32 seeded RNG
    │   └── storage.ts          # localStorage wrapper, versioning, export/import
    ├── components/
    │   ├── Feed.tsx, ProblemCard.tsx, StageReveal.tsx, AnswerInput.tsx,
    │   ├── GradeBar.tsx, DrillMode.tsx, StatsView.tsx, TechniquePage.tsx,
    │   └── SettingsView.tsx, MathMarkdown.tsx
    └── styles/
        ├── tokens.css
        └── app.css
```

## 5. Data model (canonical — do not drift)

```ts
// src/types.ts
export type TopicId =
  | 'brainteasers' | 'probability' | 'combinatorics' | 'expected-value'
  | 'bayes' | 'markov-chains' | 'martingales' | 'distributions'
  | 'calculus' | 'linear-algebra' | 'statistics' | 'stochastic-processes'
  | 'options-intuition' | 'market-making' | 'mental-math';

export type TechniqueId = string; // kebab-case, must match a file in content/techniques/

export type AnswerSpec =
  | { type: 'numeric'; value: number; tolerance?: number; display?: string }
    // display: canonical form shown in solution, e.g. "20/19"
  | { type: 'multiple-choice'; options: string[]; correctIndex: number }
  | { type: 'self-graded' }; // proofs, market-making banter, estimation defenses

export interface Problem {
  id: string;                    // kebab-case, globally unique
  topic: TopicId;
  techniques: TechniqueId[];     // 1–3
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 phone-screen warmup … 5 final-round
  source: 'original' | 'classic-rewrite';
  statement: string;             // markdown + KaTeX ($...$, $$...$$)
  hints: [string, string, string]; // exactly 3, per §6.3
  solution: string;              // per §6.4
  answer: AnswerSpec;
  estMinutes: number;
  followUps?: string[];
}

export interface GeneratedInstance {
  statement: string; hints: [string, string, string];
  solution: string; answer: AnswerSpec;
}

export interface GeneratorProblem {
  id: string; topic: TopicId; techniques: TechniqueId[];
  difficulty: 1 | 2 | 3 | 4 | 5; estMinutes: number;
  generate(rng: () => number): GeneratedInstance; // fresh numbers each review
}

export type Grade = 0 | 1 | 2 | 3; // Failed | Hard | Good | Easy

export interface ReviewState {
  problemId: string;             // Problem.id or GeneratorProblem.id
  ease: number;                  // start 2.5, clamp [1.3, 3.0]
  intervalDays: number;          // 0 = unlearned
  due: string;                   // ISO date (yyyy-mm-dd)
  reps: number;
  lapses: number;
  history: Array<{ date: string; grade: Grade; hintsUsed: 0|1|2|3; ms: number }>;
}

export interface DrillResult {
  date: string; preset: string; total: number; correct: number;
  seconds: number; perCategory: Record<string, { n: number; correct: number }>;
}
```

Content modules export `satisfies Problem[]` arrays and use `String.raw` template
literals so LaTeX backslashes need no escaping (avoid a literal `${` inside; write
`$\{` if ever needed).

## 6. Content rules

### 6.1 Topic taxonomy
The 15 `TopicId`s above. Phase-1 seed content covers `expected-value`,
`martingales`, `combinatorics`, plus the `mental-math` generators.

### 6.2 Technique taxonomy (initial set — each gets a page eventually)
symmetry, indicator-variables, linearity-of-expectation, conditioning,
law-of-total-probability, first-step-analysis, recursion, state-space,
optional-stopping, gamblers-ruin, complement-counting, inclusion-exclusion,
stars-and-bars, pairing, invariants, extreme-cases, memorylessness,
order-statistics, bayes-grid, backward-induction, threshold-strategy,
scaling-parity.

### 6.3 Hint philosophy (exactly three, escalating)
- **Hint 1 — Orient.** Point at the structure worth noticing. Never names a tool.
  ("You never have to decide anything before seeing the current roll.")
- **Hint 2 — Arm.** Name the technique. ("This is backward induction: value the
  last decision first.")
- **Hint 3 — Launch.** The first concrete step or equation, leaving the finish
  to the solver.

### 6.4 Solution format
Full derivation (markdown + LaTeX) → one-line sanity check → a paragraph starting
exactly with `**Pattern:**` stating the reusable technique in general form →
`**Interview follow-ups:**` with 2–3 escalations an interviewer would ask.

### 6.5 Authoring rules
Original wording always; classic setups allowed as `classic-rewrite` with fresh
numbers/framing. Every numeric answer must be verified by a second independent
method before committing. `npm run validate` must pass.

## 7. Engines (pure functions in `src/engine/`, all unit-tested)

### 7.1 Scheduler — SM-2-lite (`scheduler.ts`)

`schedule(state, grade, today) -> ReviewState`

- New card (`reps === 0`): grade 0 → requeue this session (interval 0);
  grade 1 → interval 1d; grade 2 → interval 1d, reps 1; grade 3 → interval 3d, reps 1.
- Review card:
  - 0 (Failed): `lapses+1`, `ease = max(1.3, ease − 0.2)`, interval 1d, requeue
    in-session.
  - 1 (Hard): `interval = max(interval + 1, round(interval × 1.2))`,
    `ease = max(1.3, ease − 0.15)`.
  - 2 (Good): `interval = round(interval × ease)`.
  - 3 (Easy): `interval = round(interval × ease × 1.35)`, `ease = min(3.0, ease + 0.1)`.
- Apply ±5% deterministic fuzz (seeded by problemId + date) to intervals ≥ 3d;
  cap at 180d. `due = today + intervalDays`.
- **Suggested default grade** (UI preselects, user can override): wrong answer → 0;
  correct with ≥2 hints → 1; correct with 1 hint → 2; correct with 0 hints → 2,
  with 3 visually nudged if solve time < estMinutes.

### 7.2 Feed builder (`feedBuilder.ts`)

`buildFeed({problems, generators, reviews, settings, today, rng}) -> QueueItem[]`

1. **Due list:** all states with `due <= today`, sorted by days overdue (desc).
2. **New pool:** items with no state, weighted by topic weakness
   `w(t) = 1 + lapses(t) / max(1, attempts(t))`, restricted to topics enabled in
   settings.
3. **Mix:** after every 3 due items, inject 1 new item (defaults:
   `newPerSession = 8`, ratio 3:1; both in settings). If nothing is due, serve new
   only.
4. **Interleave:** no two consecutive items share a topic when any swap within a
   3-item lookahead can prevent it.
5. **Infinite scroll:** when < 5 items remain, extend — more new items, or if the
   new budget is spent, pull the earliest-due future reviews and tag the card
   "ahead of schedule."

### 7.3 Grading (`grading.ts`)

- Numeric parsing accepts: decimals (`0.4`, `-1.25`), fractions (`2/5`, `-20/19`).
  Trim whitespace; reject anything else (show inline format help).
- Correct iff `|x − v| ≤ max(1e-9, tolerance ?? 0.005 × |v|)` (i.e. default 0.5%
  relative, per-problem override available).
- Multiple-choice: index match. Self-graded: skip input; reveal then grade.

### 7.4 RNG and generators

- `mulberry32(seed)`; seed from a string hash. Review instances seed on
  `problemId + reviewCount` (fresh numbers each review, reproducible within one).
- `content/generators/mental-math.ts` exposes drill categories:
  2-digit × 2-digit, 3-digit ± 3-digit, division to 2dp, percent-of,
  fraction→decimal, decimal→fraction, squares of 2-digit numbers.
  Each returns `{ prompt, answer, category }`.

## 8. UI specification

### 8.1 Feed (`#feed`, default route)

Vertical feed, one full-viewport card per problem. `scroll-snap-type: y mandatory`.
Keyboard: `j`/`↓` next card, `k`/`↑` previous, `Space`/`Enter` advance stage,
`1–4` grade, `s` jump to solution. Touch: native snap scroll, taps advance stages.

**Card state machine:** `statement → hint1 → hint2 → hint3 → solution → graded`.
- Header row: topic label, difficulty dots, due badge ("review · 3d overdue" /
  "new" / "ahead of schedule"), elapsed timer (Plex Mono, tabular numerals).
- Statement rendered by `MathMarkdown` (react-markdown + remark-math + rehype-katex).
- Numeric/MC problems show `AnswerInput` from the start; a correct or incorrect
  submission jumps straight to `solution` with a verdict strip. `Show hint` is the
  alternative path; each press reveals the next hint as a **margin note** (§9) and
  increments `hintsUsed`.
- At `solution`: full solution, the **Pattern** block links each technique chip to
  its page, then `GradeBar` (Failed / Hard / Good / Easy with the §7.1 default
  preselected). Grading records history, schedules, and auto-scrolls to the next
  card.

### 8.2 Drill mode (`#drill`)

Preset picker → countdown → rapid-fire prompts (one at a time, giant Plex Mono),
input auto-checks on Enter, `Esc` skips (counts wrong). Pace strip shows
question-rate needed vs. actual. Presets:
- **Optiver pace:** 80 questions / 8:00, all categories.
- **Sprint:** 30 / 3:00.
- **Custom:** category toggles + counts + time.
End screen: score, accuracy, s/question, per-category table, personal best, save
to `DrillResult` history.

### 8.3 Stats (`#stats`)

Per-topic table (attempts, accuracy, avg hints, lapses), 7-day due forecast bars,
current daily streak, totals, drill PB trend. Export / import buttons (§10).

### 8.4 Techniques (`#techniques`)

Index of technique pages; each page is rendered markdown: definition, when it
fires (trigger cues), worked micro-example, links to problems tagged with it.

### 8.5 Settings (`#settings`)

Topic toggles, newPerSession, ratio, theme is fixed (no toggle in v1), data
export/import/reset.

## 9. Design direction

**Concept: scratch paper under exam pressure.** These problems get solved with a
pen on graph paper; the interface is that sheet. Not a dark terminal theme, not a
cream-serif landing page.

Tokens (`styles/tokens.css`):

```
--paper:      #F7F8F5;   /* cool off-white sheet */
--grid:       #E4E9E2;   /* faint graph rules */
--ink:        #1B1E22;   /* primary text */
--ink-soft:   #5A6066;   /* secondary text */
--ballpoint:  #2545D8;   /* single accent: links, reveals, focus, active states */
--grading-red:#C2382E;   /* incorrect verdicts only */
--ledger-green:#2E7D4F;  /* correct verdicts only */
```

- Background: `--paper` with a subtle CSS graph grid (24px `linear-gradient` lines
  in `--grid`); cards sit directly on the grid — no drop-shadow card chrome.
- Type: IBM Plex Sans for UI/body; IBM Plex Mono (tabular) for timers, scores,
  difficulty dots, and answer inputs; KaTeX's Latin Modern carries the math and is
  deliberately left as-is — math should look like math.
- **Signature element — the margin note:** each revealed hint slides in as a note
  set off by a 2px `--ballpoint` rule on the left, slightly inset, like an
  annotation written beside the problem. Hints are the product; they get the
  identity.
- Motion: 160ms ease-out reveals; snap scrolling; honor `prefers-reduced-motion`
  by replacing slides with fades. Nothing else animates.
- Verdicts: a thin full-width strip under the input — `--ledger-green` "correct ·
  20/19" or `--grading-red` "not quite — you said 1.2".
- Quality floor: visible keyboard focus (`--ballpoint` outline), 680px max content
  column, mobile-safe tap targets, sentence-case labels, buttons say what they do
  ("Show hint", "Check answer", "Grade: Good").

## 10. Persistence

`storage.ts` wraps localStorage under versioned keys: `qf.v1.reviews`,
`qf.v1.drills`, `qf.v1.settings`, `qf.v1.meta`. Export = single JSON blob
(`{ version: 1, reviews, drills, settings }`) downloaded as
`quantfeed-backup-<date>.json`; import validates with zod and replaces. All writes
go through one debounced save function. A `version` field gates future migrations.

## 11. Validation and testing

- `scripts/validate-content.ts`: zod schemas mirroring §5; loads every content
  module; asserts unique ids, hints.length === 3, techniques exist as files,
  numeric answers finite, solution contains `**Pattern:**`. Exits non-zero on
  failure.
- Vitest (target ≥ 90% of engine lines): scheduler transitions incl. clamps, fuzz
  determinism, and the suggested-grade rule; feedBuilder mixing/interleaving/
  extension; grading parser (fractions, tolerance edges, garbage input); rng
  reproducibility.
- UI is verified manually per phase; no component tests in v1.

## 12. Local use and deployment

Primary: `npm run dev`. The Pages deploy is a bonus:
- `vite.config.ts`: `base: '/<REPO_NAME>/'` (replace at scaffold time).
- `.github/workflows/deploy.yml`: on push to main → setup Node 20 →
  `npm ci` → `typecheck && test --run && validate` → `build` →
  `actions/upload-pages-artifact` (dist) → `actions/deploy-pages`. Repo Pages
  setting: "GitHub Actions" source. If the repo stays private, Pages requires a
  paid plan — local mode is unaffected.

## 13. Build phases and acceptance criteria

Work strictly in order. After each phase: `npm run typecheck && npm test -- --run
&& npm run build` must pass; commit as `phase N: <summary>`.

1. **Skeleton + one card.** Scaffold, tokens.css with full §9 system, types,
   content loading, validate script, seed content (§14), single ProblemCard with
   the full stage machine and margin-note hints, MathMarkdown working.
   *AC: dev server shows the die-reroll problem; LaTeX renders; stages advance by
   click and Space; validate passes.*
2. **Feed + grading + persistence.** Snap-scroll feed over all seed problems,
   AnswerInput with §7.3 parsing, GradeBar, storage.ts.
   *AC: typing `2/5` or `0.4` both grade correct on the ruin problem; grades and
   timers survive a refresh; keyboard map works.*
3. **Scheduler + feed builder + settings.** Wire §7.1/§7.2; due badges; settings
   view.
   *AC: engine test suite green; failing a card requeues it this session; next-day
   simulation (inject `today`) surfaces due cards first.*
4. **Generators + drill + stats.** Mental-math generators, drill presets with
   timer and end screen, generator-backed review instances, StatsView.
   *AC: Optiver preset runs end-to-end and saves history; a generator problem
   shows different numbers on its second review.*
5. **Techniques + polish + deploy.** Technique pages (seed: indicator-variables,
   optional-stopping, backward-induction), §9 design pass against every screen,
   a11y floor, README (setup, authoring guide, prompt pointers), deploy workflow.
   *AC: full script chain green; Pages workflow valid; README accurate.*

## 14. Seed content (ship exactly these in phase 1)

`content/problems/expected-value.ts`:

```ts
import type { Problem } from '../../src/types';
const r = String.raw;

export const expectedValue = [
  {
    id: 'ev-die-one-reroll',
    topic: 'expected-value',
    techniques: ['backward-induction', 'threshold-strategy'],
    difficulty: 2,
    source: 'classic-rewrite',
    statement: r`You roll a fair six-sided die and are paid its face value in
dollars. Before being paid, you may discard the roll and roll once more — the
second roll is final. Playing optimally, what is the fair value of this game?`,
    hints: [
      r`You never decide anything before seeing the first roll, so think about
what the *second* roll is worth before you see it.`,
      r`Backward induction: a fresh roll is worth $3.5$ in expectation, so the
optimal rule is a threshold — reroll exactly when the current face is below it.`,
      r`Keep $4,5,6$; reroll $1,2,3$. Compute
$E = P(\text{keep}) \cdot E[\text{face}\mid\text{keep}] + P(\text{reroll}) \cdot 3.5$.`,
    ],
    solution: r`The second roll, unseen, is worth $E[X] = 3.5$. So after the first
roll you keep face $x$ iff $x > 3.5$, i.e. keep $\{4,5,6\}$, reroll $\{1,2,3\}$.

$$E = \tfrac{3}{6}\cdot\tfrac{4+5+6}{3} + \tfrac{3}{6}\cdot 3.5
    = \tfrac12 (5) + \tfrac12(3.5) = 4.25.$$

Sanity check: it must land strictly between $3.5$ (no option) and $5$ (keeping
only the best face is impossible half the time) — it does.

**Pattern:** Backward induction with a threshold — value the final stage first,
then the earlier decision collapses to "act iff current value beats the
continuation value." The continuation value *is* the threshold.

**Interview follow-ups:**
- Two rerolls allowed — show the threshold rises and $E = 14/3 \approx 4.67$.
- $n$ rerolls: write the recursion $E_{n} = E[\max(X, E_{n-1})]$ and its limit.`,
    answer: { type: 'numeric', value: 4.25, display: '4.25' },
    estMinutes: 4,
  },
] satisfies Problem[];
```

`content/problems/martingales.ts`:

```ts
import type { Problem } from '../../src/types';
const r = String.raw;

export const martingales = [
  {
    id: 'ruin-2-of-5',
    topic: 'martingales',
    techniques: ['optional-stopping', 'gamblers-ruin', 'first-step-analysis'],
    difficulty: 2,
    source: 'classic-rewrite',
    statement: r`You start with \$2 and bet \$1 on fair coin flips, winning or
losing \$1 each flip. You stop at \$0 or \$5. What is the probability you reach
\$5?`,
    hints: [
      r`Track your wealth flip by flip. Under fair bets, what stays constant
about it in expectation?`,
      r`Fair wealth is a martingale; optional stopping says expected wealth at
the stopping time equals the starting wealth.`,
      r`Let $p = P(\text{hit } 5)$. Then $2 = 5p + 0\,(1-p)$.`,
    ],
    solution: r`Wealth $W_n$ is a martingale (fair bets), the stopping time is
almost-surely finite and wealth is bounded in $[0,5]$, so optional stopping
applies:

$$E[W_\tau] = W_0 \;\Rightarrow\; 5p + 0(1-p) = 2 \;\Rightarrow\; p = \tfrac{2}{5}.$$

Sanity check: from \$2 you are closer to ruin than to \$5, so $p < \tfrac12$. ✓
(First-step recursion $p_i = \tfrac12 p_{i-1} + \tfrac12 p_{i+1}$ with linear
solution $p_i = i/5$ confirms it.)

**Pattern:** Gambler's ruin, fair case — hitting probabilities are linear in the
starting state: $P(\text{hit } N \text{ from } i) = i/N$. Optional stopping turns
the whole problem into one equation.

**Interview follow-ups:**
- Biased coin $q \neq \tfrac12$: derive $p_i = \frac{1-(q/(1-q))^{\,i}}{1-(q/(1-q))^{N}}$… careful with direction of bias.
- Expected number of flips from \$2 (answer: $i(N-i) = 6$).`,
    answer: { type: 'numeric', value: 0.4, display: '2/5' },
    estMinutes: 4,
  },
] satisfies Problem[];
```

`content/problems/combinatorics.ts`:

```ts
import type { Problem } from '../../src/types';
const r = String.raw;

export const combinatorics = [
  {
    id: 'couples-round-table',
    topic: 'combinatorics',
    techniques: ['indicator-variables', 'linearity-of-expectation', 'symmetry'],
    difficulty: 3,
    source: 'classic-rewrite',
    statement: r`Ten couples (20 people) are seated uniformly at random around a
circular table. What is the expected number of couples sitting next to each
other?`,
    hints: [
      r`Counting seatings where exactly $k$ couples are adjacent is painful.
What's the move that avoids ever computing a joint distribution?`,
      r`Indicator variables + linearity of expectation: the indicators don't need
to be independent.`,
      r`Fix one partner's seat by symmetry; the other partner is uniform over the
remaining $19$ seats, $2$ of which are adjacent.`,
    ],
    solution: r`Let $I_j$ indicate that couple $j$ is adjacent. By the circle's
symmetry, fix one partner anywhere; the other is uniform over the other $19$
seats and exactly $2$ are neighbors, so $E[I_j] = \tfrac{2}{19}$. Linearity
(no independence needed):

$$E\Big[\sum_{j=1}^{10} I_j\Big] = 10 \cdot \tfrac{2}{19} = \tfrac{20}{19} \approx 1.053.$$

Sanity check: about one adjacent couple on average feels right for 10 couples in
20 seats — and it exceeds 1 slightly because each couple has two chances (left
or right neighbor).

**Pattern:** When asked for an expected *count*, sum indicator expectations.
Dependence between events is irrelevant; symmetry usually hands you each
$E[I_j]$ in one line.

**Interview follow-ups:**
- Variance of the count (now dependence matters — covariance of $I_i, I_j$).
- Same question in a row: a couple's two seats are uniform over $\binom{20}{2}=190$
pairs, of which $19$ are adjacent, so $E[I_j]=\tfrac{19}{190}=\tfrac1{10}$ and the
expected count is exactly $1$.
- $P(\text{no couple adjacent})$ via inclusion–exclusion.`,
    answer: { type: 'numeric', value: 1.0526315789, tolerance: 0.001, display: '20/19' },
    estMinutes: 6,
  },
] satisfies Problem[];
```

Plus `content/generators/mental-math.ts` implementing the §7.4 categories, and
three technique stubs (`indicator-variables.md`, `optional-stopping.md`,
`backward-induction.md`) following §8.4's page format.
