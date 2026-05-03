---
generated_by: gsd-execute-plan
phase: 01-multi-container-output-model-path-derivation
plan: "02"
generated_at: "2026-05-03T00:00:00Z"
---

## Outcome

**inspect**, **clean**, and **batch** derive default output basename extensions from **`planMediaOutputPrelude`** + **`implicitDefaultOutputExtWithDot`** before **`resolveOutputPath`**. **Batch** runs **ffprobe** per expanded input, fails fast on unsupported probes with inspect-aligned messaging, and passes per-input implicit extensions into **`allocateBatchOutputPaths`**. **`encodeDeliverableArgs`** documents **webm** as provisional; **`src/index.ts`** re-exports the new public helpers.

## Fix: batch tests and `runCliRequest`

`deps.clean.outputExists` is used for **input existence** as well as output collision detection. Batch and run-command tests now use **`existsSync`** instead of **`() => false`** so precondition checks pass while temp dirs still have no output collisions.

## Verification

- `bun run verify`

## Tests added or extended

- `test/app/batch.test.ts`, `test/app/run-command.test.ts` — ffprobe stubs + **`existsSync`** output predicate
- `test/domain/batch-output-path.test.ts` — **`getImplicitExtWithDot`** → **`.mov` → `.avdn.mp4`**
