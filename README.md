# QuantFeed

A static, locally-hosted quant-interview trainer. One problem per screen,
doomscroll navigation, forced attempt-before-reveal, and spaced repetition
driving the feed order. No backend, no accounts, no analytics — all state lives
in your browser's `localStorage`, with JSON export/import.

The pedagogy (active recall, spaced repetition, interleaving, technique
consolidation, pressure calibration, generator variation) and the full build
contract live in [`SPEC.md`](./SPEC.md), which is the source of truth. Notable
implementation choices are logged in [`DECISIONS.md`](./DECISIONS.md).

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

| script              | what it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Vite dev server                                      |
| `npm run build`     | production build to `dist/`                          |
| `npm run preview`   | serve the production build locally                   |
| `npm run typecheck` | `tsc --noEmit` (strict)                              |
| `npm test`          | Vitest (engine + render suites); add `-- --run` once |
| `npm run validate`  | zod-validate all content, check ids/hints/techniques |

The full quality gate (run before every commit):

```bash
npm run typecheck && npm test -- --run && npm run validate && npm run build
```

## Using it

- **Feed** (`#feed`) — the default route. Each card forces an attempt before the
  solution. Type a numeric/multiple-choice answer, or climb the three-hint
  ladder (orient → arm → launch); each hint slides in as a margin note. Grading
  schedules the next review and scrolls you on.
- **Drill** (`#drill`) — timed mental arithmetic. *Optiver pace* is 80 questions
  in 8:00; *Sprint* is 30 in 3:00; *Custom* lets you pick categories, count, and
  time. A pace strip shows whether you're ahead or behind.
- **Stats** (`#stats`) — per-topic accuracy, a 7-day due forecast, your daily
  streak, drill personal-best trend, and data export/import/reset.
- **Techniques** (`#techniques`) — one page per reusable technique: what it is,
  when it fires, a worked micro-example, and the problems tagged with it.
- **Settings** (`#settings`) — topic toggles, new-cards-per-session, the due:new
  ratio, and data controls.

### Keyboard shortcuts (feed)

| key                | action                       |
| ------------------ | ---------------------------- |
| `j` / `↓`          | next card                    |
| `k` / `↑`          | previous card                |
| `Space` / `Enter`  | advance stage (reveal hint → solution) |
| `s`                | jump to the solution         |
| `1` `2` `3` `4`    | grade Failed / Hard / Good / Easy |

(While the answer field is focused, `Enter` checks the answer instead.)

## Authoring content

Content is plain TypeScript validated by `npm run validate`. Follow `SPEC.md`
§5 (types), §6 (content rules), and the prompt templates in
[`PROMPTS.md`](./PROMPTS.md).

- **Problems** live in `content/problems/<topic>.ts`, exported as
  `satisfies Problem[]`. Use `String.raw` template literals so LaTeX backslashes
  need no escaping. Each problem needs exactly three escalating hints
  (orient / arm / launch, §6.3) and a solution that ends with a `**Pattern:**`
  paragraph and an `**Interview follow-ups:**` list (§6.4).
- **Generators** live in `content/generators/`. A `GeneratorProblem` re-randomizes
  its numbers on every review (seeded by `problemId + reviewCount`) so the SRS
  tests the method, not a memorized answer. `mental-math.ts` holds the drill
  categories.
- **Techniques** live in `content/techniques/<id>.md`. Every technique tagged by
  a problem must have a page here, or `validate` fails.
- **Verify every numeric answer two independent ways** before committing (§6.5).
  Display the exact form (e.g. `20/19`) via `answer.display` and the decimal via
  `answer.value`.

After registering new files, add them to `content/index.ts`.

## Architecture

- `src/engine/` — pure, unit-tested functions: `scheduler.ts` (SM-2-lite),
  `feedBuilder.ts` (the review queue dressed as a feed), `grading.ts` (answer
  parsing), `rng.ts` (seeded mulberry32), `materialize.ts`, `dates.ts`. No DOM
  or storage access here.
- `src/engine/storage.ts` — the one module that touches `localStorage`
  (versioned keys `qf.v1.*`, debounced writes, zod-validated import/export).
- `src/store.ts` — a tiny `useSyncExternalStore` store (no state library).
- `src/components/` — the feed, cards, drill, stats, techniques, settings, and
  the `MathMarkdown` renderer (react-markdown + remark-math + rehype-katex).
- `src/styles/` — `tokens.css` (the design system) and `app.css`. The look is
  "scratch paper under exam pressure": a graph-paper grid, IBM Plex, KaTeX for
  math, and the margin-note hint as the signature element. No CSS framework.

## Deploying to GitHub Pages

Local use needs nothing below — Pages is a bonus. This repo is configured for
[`ColeVH2112/studying`](https://github.com/ColeVH2112/studying): `REPO_NAME` in
`vite.config.ts` is `studying`, so the production build serves assets under
`/studying/` (dev/preview stay at `/`).

To launch:

1. Push `main` to the repo (the remote is already set):
   ```bash
   git push -u origin main
   ```
2. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` runs the gate, builds, and
   publishes on every push to `main`.

The site appears at **https://colevh2112.github.io/studying/**.

> **Repo visibility:** publishing Pages from a **private** repo requires a paid
> GitHub plan (Pro/Team/Enterprise). On the **free** plan, make the repo
> **public** for the Pages launch to succeed — there's nothing secret in the
> code. (Local `npm run dev` works either way.) To host a private repo for free
> instead, point Netlify/Vercel/Cloudflare Pages at it and set `REPO_NAME` back
> to `''` so the base is `/`.

If you rename the repo later, update `REPO_NAME` to match.
