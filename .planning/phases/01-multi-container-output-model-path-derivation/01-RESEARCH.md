# Phase 01 — Technical research

## RESEARCH COMPLETE

### Questions answered (for planning)

1. **Ordering deadlock (`planMediaOutput` vs `resolveOutputPath`)**  
   `OutputPathSuccess` today embeds `resolvedOutputPath`; `planMediaOutput` reads it but does not use it for modality. **Extract** a pure prelude (probe → modality, reasonCodes, `plannedContainer`, `plannedAudioCodec`, selected audio index, unsupported branches) **without** paths—then derive implicit `outputExtWithDot`, then build final `OutputPlan` with `resolveOutputPath` using that extension **only when** `maybeExplicitOutput` is unset.

2. **Extension mapping (D-03 / CONTEXT)**  
   Closed mapping from `plannedContainer`: `mp4`→`.mp4`, `matroska`→`.mkv`, `webm`→`.webm`, `wav`→`.wav`. **Audio-only + `plannedContainer` mp4**: preserve input extension (existing `clip.avdn.m4a` behavior). **Video-bearing + mp4**: use **`.mp4`** default even when input is `.mov` / `.mkv` (CONTEXT bias).

3. **Feasibility**  
   Extend `evaluateStreamCopyFeasibility` only enough to compile against `PlannedContainer` adding `webm` (branch for `plannedContainer !== "mp4"` unchanged semantically).

4. **Batch**  
   `allocateBatchOutputPaths` uses input extension today; allocations happen **before** per-item probe. **`runBatchRequest`** must probe (or reuse a lightweight map) **before** allocation to supply per-input implicit extension via a **pure** callback **`getImplicitExt: (resolvedInputPath: string) => string`** keyed by a pre-scan result.

5. **Tests**  
   Unit tests lock: existing MP4 H.264 path default output extension; audio-only preserves `.m4a`; **constructed** preview rows for `.mkv` / `.webm` literals (MULTI roadmap success #2).

### References

- `src/domain/output-plan.ts`, `src/domain/output-path.ts`, `src/app/inspect.ts`, `src/app/clean.ts`, `src/app/batch.ts`, `src/domain/batch-output-path.ts`
- `.planning/phases/01-multi-container-output-model-path-derivation/01-CONTEXT.md`

---

## Validation Architecture

Not required — **workflow.nyquist_validation** disabled for this workspace; VERIFY via `bun test` / `bun run verify` in plans.
