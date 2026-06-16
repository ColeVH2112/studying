# Decisions log

Running log of deviations from SPEC.md and non-obvious choices. Where code and
spec disagree, the spec wins; anything here is a documented, intentional choice.

## Scaffold

- **Project root.** The repo lives directly in this directory (the spec's layout
  names it `quant-feed/`); `SPEC.md`, `PROMPTS.md`, `package.json`, etc. all sit
  at the root. No nested `quant-feed/` folder was created.
- **Vite `base`.** SPEC §12 asks for `base: '/<REPO_NAME>/'`. We apply that base
  only for `command === 'build'` (the Pages artifact) and keep `/` for `dev` and
  `preview`, so local development serves cleanly at `http://localhost:5173/`.
  `REPO_NAME` is set to `studying` in `vite.config.ts` to match the GitHub repo
  `ColeVH2112/studying` (Pages URL `https://colevh2112.github.io/studying/`).
- **TypeScript `exactOptionalPropertyTypes`.** Left off. The canonical types in
  §5 use plain optional properties (`tolerance?`, `display?`, `followUps?`) and
  the content/engine code assigns/reads them as ordinary optionals; enabling the
  strict optional-exactness flag would add noise without improving correctness
  here. All other strict flags are on.
- **Vitest environment.** `node` (engines are pure). `storage.ts` is the single
  module that touches `localStorage`; its test supplies a minimal in-memory
  `localStorage` stub rather than pulling in `jsdom` (which is not a SPEC §3 dep).

## Content & engines

- **`MentalMathItem` carries `value` (+ optional `tolerance`).** SPEC §7.4 states
  drill generators return `{ prompt, answer, category }`. We keep those and add a
  numeric `value` (and per-category `tolerance`) so the drill can grade input
  numerically (e.g. accept `0.75` for a `3/4` decimal→fraction prompt) instead of
  string-matching. `answer` remains the canonical display string.
- **Accuracy is correct/attempted.** The drill end screen divides correct answers
  by the number attempted, not the preset target (§8.2 names "accuracy" without a
  formula); dividing by the target would understate accuracy whenever a run times
  out before completion — the normal case for the 80-question Optiver preset. The
  score stat still shows `correct/total` to convey completion.

## Rendering

- **Display-math normalization (`normalizeDisplayMath` in `MathMarkdown`).** The
  SPEC §14 seed content writes display math inline, e.g. `$$E = … = 4.25.$$` and
  even across two lines. `remark-math`/`micromark-extension-math` only renders a
  `$$…$$` block as centered *display* math when the fences are on their own
  lines; a multi-line block with content on the fence line desyncs the
  tokenizer and swallows the rest of the solution (KaTeX parse error). Rather
  than edit the verbatim content, `MathMarkdown` rewrites every `$$…$$` so the
  fences sit on their own lines before handing the string to react-markdown. At
  render time the only `$$` sequences are real display fences — template
  `$${x}` artifacts have already collapsed to a single `$` — so the rewrite is
  safe. Guarded by `src/components/render.test.ts`.
