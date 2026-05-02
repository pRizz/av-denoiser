# Phase 7 Research: Batch Processing & Manifests

## Questions

1. How should multi-file invocation compose with existing **`runCleanRequest`** / **`CleanRunInput`** without fork-lifting the single-file planner?
2. How do we satisfy **glob safety** (STACK: confirmation before expansion) while keeping expansion in the imperative shell?
3. What manifest shape is useful for **audit** (BATCH-05) yet stable for tests?
4. How should **process exit codes** aggregate when some files succeed and others fail (BATCH-03)?

## Findings

### Orchestration

- **Per-file loop** calling **`runCleanRequest`** with a **`CleanRunInput`** built from shared batch-level flags plus **per-file `inputPath`** and **resolved `maybeOutputPath`** preserves Phase 4–5 semantics (probe, plan, dry-run, execute, verify).
- **`CleanDeps.reportProgress`** can receive labels like **`batch:3/10`** + existing phases — optional enhancement after core loop ships.
- **Concurrency**: **`p-limit`** wraps async per-file work; default **1** keeps ordering deterministic and matches CONTEXT **D-05**.

### Input expansion

- **`fast-glob`** runs in an adapter (e.g. **`src/adapters/batch-glob.ts`**) after CLI validates **`--accept-glob-risk`** (exact flag name is planner/implementation discretion per CONTEXT).
- **`--from-dir`** walks one directory with an **extension allowlist** shared or duplicated from probe-related expectations (audio/video containers); return sorted unique absolute paths.
- **Dedupe** paths after expansion (case/normalization sensitive — use `resolve` + `normalize` consistent with **`resolveOutputPath`**).

### Output collisions (BATCH-04)

- Single-file **`resolveOutputPath`** handles **exists / force / default `.avdn.` stem** but does not coordinate **cross-input collisions** when **`--output-dir`** converges two inputs to the same basename.
- Add pure **`allocateBatchOutputPaths`** (or equivalent) in **`src/domain/`**: given ordered inputs and per-input tentative outputs, assign **`stem-2.avdn.ext`** style disambiguation **before** calling **`runCleanRequest`** (CONTEXT **D-09**).

### Manifest (BATCH-02, BATCH-05)

- **JSON** array **`items[]`** with **`schemaVersion: 1`** top-level field for evolution.
- Each item: **`inputPath`**, **`resolvedOutputPath`**, **`outcome`** (`success` | `skipped` | `failure`), **`exitReasonKind`** (mirror **`CommandFailureReason.kind`** or `null`), **`message`**, **`plannedSummary`** (subset of **`CleanPlanSummary`** or dry-run snapshot), **`maybeToolVersions`** (subset of **`DoctorReport`** facts captured once per batch run).
- **Dry-run**: populate **`plannedSummary`** without execution fields; **`outcome`** reflects planning-only success/failure.

### Exit code aggregation

- Compute **`worstExitCode = max(non-zero per-file exit codes)`** using numeric **`ExitCode`** values; if all files **`0`**, batch exits **`0`**.
- **Fail-fast**: stop scheduling remaining files after first failure; still write manifest entries for **not-started** items if useful (planner: optional **`skipped`** rows).

### CLI shape

- **`batch`** subcommand mirrors **`clean`** options (preset, noise-strength, dry-run, json, force, allow-video-fallback, output semantics).
- Batch-only: **`--input`** repeatable **and/or** variadic positionals, **`--glob`**, **`--from-dir`**, **`--output-dir`**, **`--manifest`**, **`--concurrency`**, **`--fail-fast`**, **`--accept-glob-risk`**.

### Dependencies

- Add **`p-limit`** and **`fast-glob`** to **`package.json`** for this phase (CONTEXT **D-05**, STACK).

## RESEARCH COMPLETE
