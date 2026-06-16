# QuantFeed — Terminal Prompts

How to use: steps 1–3 once, then drive everything from Claude Code with the
prompts below.

## 1. Setup (once)

```bash
mkdir quant-feed && cd quant-feed && git init
# copy SPEC.md into the repo root
# create CLAUDE.md with the contents in section 2
claude
```

## 2. CLAUDE.md (create this file verbatim in the repo root)

```markdown
# Working conventions

- SPEC.md is the source of truth. Re-read the relevant section before
  implementing it. If you deviate, add one line to DECISIONS.md saying what and
  why.
- Before every commit: `npm run typecheck && npm test -- --run && npm run validate
  && npm run build` — all must pass.
- No dependencies beyond SPEC §3. No CSS frameworks. No router libraries.
- Engine code (src/engine/*) is pure functions with vitest coverage; no DOM or
  storage access inside engines.
- Content modules use String.raw literals; every numeric answer is verified by a
  second independent derivation before it is written down.
- Commit per phase: `phase N: <summary>`.
```

## 3. Kickoff prompt (paste into Claude Code in the repo)

```text
Read SPEC.md in full before writing anything, then build the project by working
through the phases in SPEC §13 strictly in order.

Rules of engagement:
- The data model in §5 and the engine specs in §7 are canonical — implement them
  exactly, including the SM-2 constants, the suggested-default-grade rule, and
  the feed mixing/interleaving behavior.
- Phase 1 ships the exact seed content in §14 (fix nothing about the math; it is
  verified) plus the mental-math generators and three technique stubs.
- Implement the design system in §9 as written: tokens.css first, graph-paper
  background, margin-note hint reveal as the signature element, IBM Plex via
  @fontsource, KaTeX untouched for math. Do not substitute a generic dark theme
  or a component library look.
- After each phase, run typecheck, tests, validate, and build; fix everything
  before committing `phase N: <summary>`. Do not start the next phase with a red
  script.
- Make reasonable judgment calls yourself instead of asking me; log anything
  non-obvious in DECISIONS.md.
- Stop after phase 5 with a README covering local dev, the authoring workflow
  (content rules in SPEC §6), keyboard shortcuts, and GitHub Pages setup.

When you finish, print: each phase's commit hash, the test count, and anything
in DECISIONS.md.
```

## 4. Content generation prompt (reuse per topic)

Replace TOPIC / N / MIX, e.g. `markov-chains`, `12`, `2×d2, 6×d3, 4×d4`.

```text
Generate N new problems for topic "TOPIC" in content/problems/TOPIC.ts,
difficulty mix MIX, following SPEC §5 (types), §6.3 (three-hint ladder:
orient / arm / launch), §6.4 (solution ends with **Pattern:** and
**Interview follow-ups:**), and §6.5 (authoring rules).

Hard requirements:
- Original wording everywhere. Classic setups are fine as source:
  'classic-rewrite' with fresh numbers and framing — never reproduce a book's
  text.
- Verify every numeric answer two independent ways (e.g. direct derivation +
  recursion, or symmetry argument + brute small-case enumeration) and show both
  verifications to me in your summary before writing the file.
- Prefer answers that are exact fractions; set `display` to the exact form and
  `value` to its decimal.
- Tag 1–3 techniques per problem from SPEC §6.2; if a problem genuinely needs a
  new technique id, create its page in content/techniques/ in the §8.4 format.
- Vary the surface stories (games, decks, urns, tick sizes, order books) so no
  two problems in the file feel like reskins of each other.
- Finish with `npm run validate` and `npm run typecheck` green.
```

## 5. Technique pages prompt

```text
Write technique pages in content/techniques/ for: LIST. Each page, per SPEC
§8.4: a two-sentence definition, a "when it fires" section of 3–4 trigger cues
phrased the way a problem statement would actually sound, one worked
micro-example (3–6 lines of math), and a "related problems" line listing the ids
currently tagged with it. Keep each page under 60 lines.
```

## 6. Design QA prompt (run after phase 5, and after big UI changes)

```text
Do a design pass against SPEC §9 only — no functional changes. Walk every route
(#feed #drill #stats #techniques #settings) and check: all colors come from
tokens.css; the graph-paper background renders on every route; hint reveals use
the margin-note treatment; timers/scores/inputs are Plex Mono with tabular
numerals; focus outlines are visible in --ballpoint; prefers-reduced-motion
swaps slides for fades; nothing uses a drop-shadow card look. Fix violations,
list what changed.
```

## 7. Maintenance prompts

Tune the scheduler:

```text
My reviews are bunching up / too easy. Adjust only the constants in SPEC §7.1
style within scheduler.ts (ease deltas, Easy multiplier, fuzz), update the
vitest expectations, and append the change + rationale to DECISIONS.md.
```

Add a parameterized (generator) problem:

```text
Convert problem id "ID" into a GeneratorProblem in content/generators/: keep the
structure and hints templated, randomize the parameters over ranges where the
technique still applies, and compute the answer from the parameters inside
generate(). Add a vitest that instantiates it with 3 seeds and re-derives each
answer independently.
```

Deploy check:

```text
Set vite base to '/REPO_NAME/' and confirm .github/workflows/deploy.yml matches
SPEC §12. Walk me through the one-time GitHub Pages settings I need to click.
```
