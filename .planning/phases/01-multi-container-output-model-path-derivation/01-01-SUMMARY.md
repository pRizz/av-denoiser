---
generated_by: gsd-execute-plan
phase: 01-multi-container-output-model-path-derivation
plan: "01"
generated_at: "2026-05-03T00:00:00Z"
---

## Outcome

Domain layer carries **MULTI-01 / MULTI-02** groundwork: **`PlannedContainer`** includes **`webm`**, **`planMediaOutputPrelude`**, **`implicitDefaultOutputExtWithDot`**, and **`resolveOutputPath`** / **`defaultOutputPathBesideInput`** accept optional implicit extension when the user omits **`--output`**. **`evaluateStreamCopyFeasibility`** comment documents future **`video-copy-…`** naming without changing MP4-row behavior.

## Verification

- `bun test` (includes `output-plan`, `output-path`, `batch-output-path`)
- `bun run verify` (Biome CI, `tsc --noEmit`, full test suite)

## Tests added or extended

- `test/domain/output-plan.test.ts` — implicit extension matrix, prelude vs full plan unsupported parity
- `test/domain/output-path.test.ts` — implicit `.mp4` for `.mov`, malformed implicit ignored
