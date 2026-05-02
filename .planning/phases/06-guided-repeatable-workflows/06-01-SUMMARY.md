# Phase 6 Plan 01 — Summary

**Completed:** 2026-05-02

- `package.json` / `bun.lock` — `@clack/prompts` dependency for interactive guided mode.
- `src/domain/guided-clean-selection.ts` — `GuidedCleanSelections` binding all clean-relevant wizard fields.
- `src/domain/guided-clean-equivalent.ts` — `quoteArgvSegment`, `argvTokensForEquivalentClean`, `formatNoiseStrength` for spawn-safe replay tokens.
- `src/domain/guided-clean-parse.ts` — `parseGuidedNoiseStrength` for prompt input.
- `test/domain/guided-clean-equivalent.test.ts` — equivalence cases (minimal, `speech-soft-sox`, fallback/force/output).

Verification: `bun run verify`.
