---
phase: 06-guided-repeatable-workflows
plan: "03"
requirements-completed:
  - UX-05
  - CLI-04
generated_by: manual-retrofit
completed: "2026-05-02"
---

# Phase 6 Plan 03 — Summary

**Completed:** 2026-05-02

- `src/app/clean.ts` — optional `CleanDeps.reportProgress` at probe, pipeline steps (with video step indices), and verify/finalize milestones.
- `src/app/guided-clean.ts` — `@clack` spinner wired to `reportProgress` during real runs; summary includes clean run report when present.
- `src/cli/render.ts` — default help/guidance mentions `av-denoiser guided`.
- `test/cli/command.test.ts` — `argvTokensForEquivalentClean` round-trips through `parseCliRequest`.
- `test/cli/main.test.ts` — guided parses to `guided-clean`; guidance includes guided line.

Verification: `bun run verify`.
