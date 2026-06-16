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
