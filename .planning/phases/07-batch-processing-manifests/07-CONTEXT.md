---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 07-2026-05-02T01-07-27
generated_at: 2026-05-02T01:07:27.004Z
---

# Phase 7: Batch Processing & Manifests - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning
**Mode:** Yolo

<domain>
## Phase Boundary

Phase 7 delivers **BATCH-01–BATCH-05**: users can run **multi-file** cleanup with **per-file planning outcomes**, **isolated failures** (one bad file does not hide or erase progress on the rest), **collision-safe outputs**, and a **batch manifest / summary** that records **effective presets**, **tool/runtime facts**, **planned commands**, and **fallback decisions** — without implementing Phase 8 optional integrations or a full guided multi-file wizard (guided stays single-file from Phase 6 unless explicitly extended later).

</domain>

<decisions>
## Implementation Decisions

### CLI entry (BATCH-01)

- **D-01:** Add a dedicated **`batch`** subcommand so **`clean`** keeps **single-file** semantics and help text stay simple; **`batch`** accepts the **same planning/clean flags** as **`clean`** (preset, dry-run, json, allow-video-fallback, force, output-related options) plus batch-only controls below.
- **D-02:** Support **multiple explicit inputs** via **repeatable `--input <path>`** and/or **remaining positional arguments** (document one canonical style in help; implementation picks one primary pattern and mirrors the other if low cost).

### Input expansion (BATCH-01, STACK)

- **D-03:** Optional **`--glob <pattern>`** (repeatable), resolved with **`fast-glob`** in the **shell adapter**, passing a **deduped file list** into pure planning — require an explicit safety flag (**`--accept-glob-risk`** or equivalent) before expanding globs, matching the repo STACK note (“after explicit confirmation”).
- **D-04:** Optional **`--from-dir <dir>`** with an **allowlisted media extension set** (reuse or share logic with probing expectations) for directory ingestion; **no** silent recursion into arbitrary trees without **`--from-dir`** (avoid surprising mass selects).

### Concurrency (STACK)

- **D-05:** Default **`--concurrency 1`** (sequential) for predictable disk/CPU behavior and simpler debugging; when **`N > 1`**, cap parallel **`runCleanRequest`** executions with **`p-limit`** (add repo dependencies **`p-limit`** and **`fast-glob`** for this phase).

### Failure isolation & exit codes (BATCH-03, TRUST)

- **D-06:** **Continue-on-failure** by default: finish the queue, collect **per-file status**, and exit **non-zero if any file failed** while still reporting successes (exact exit mapping follows existing CLI taxonomy — planner aligns with **`CliRequest`** / outcome enums).
- **D-07:** Provide **`--fail-fast`** to stop the batch on the first processing/planning failure for CI-style use.

### Collision-safe outputs (BATCH-04)

- **D-08:** Default output path rule: **mirror single-file `clean` behavior per input** when **`--output`** is omitted (same directory/suffix strategy as today); when **`--output-dir <dir>`** is set, write **basename-preserving** outputs under that directory.
- **D-09:** On name collision, apply a **deterministic disambiguator** (**`-2`**, **`-3`**, … before extension, or adjacent numeric suffix per existing codebase conventions if already present).

### Manifest & summary (BATCH-02, BATCH-05)

- **D-10:** Write one **machine-readable manifest** path via **`--manifest <path>`** (default: **`batch-manifest.json`** in cwd or under **`--output-dir`** — planner picks one documented default); schema is an **array or keyed map of per-file records** including **input path**, **planned modality**, **effective preset/knobs**, **warnings**, **stdout/stderr-ish summaries or references**, **exit/outcome**, **output path**, **video-copy / fallback flags**, and **snapshots of planned argv or step list** sufficient for audit (**TOOL versions** as reported by existing doctor/discovery types, not ad hoc shelling).
- **D-11:** Human **`batch`** runs also emit a **concise aggregate summary** (table or bullet list) on stderr or stdout consistent with **`--json`** batch mode: **`--json`** emits **one JSON object** for the whole batch suitable for scripting (**planner details field names**).

### Dry-run & parity

- **D-12:** **`batch --dry-run`** runs **planning per file** without execution, listing **would-run** outputs and **collisions**, and includes **dry-run** artifacts in the manifest summary where applicable (**BATCH-02**).

### Claude's Discretion

- Exact manifest JSON schema version field, glob confirmation flag naming, and **extension allowlist** for **`--from-dir`** — keep documented in code and tests.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements

- `.planning/ROADMAP.md` — Phase 7 goal, success criteria, **BATCH-01–BATCH-05**.
- `.planning/REQUIREMENTS.md` — **BATCH-01–BATCH-05** acceptance lines.

### Prior phase contracts

- `.planning/phases/05-final-media-output-reporting/05-CONTEXT.md` — single-file **`clean`**, run report, verification (**reuse per-file**).
- `.planning/phases/06-guided-repeatable-workflows/06-CONTEXT.md` — **`guided`** stays separate; argv equivalence pattern for future optional guided batch (**not required** for Phase 7).

### Stack / research

- `AGENTS.md` / `.planning/research/STACK.md` (via project stack section) — **`p-limit`**, **`fast-glob`**, batch concurrency and glob confirmation expectations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`runCleanRequest`** / **`CleanRunInput`** (**`src/app/clean.ts`**) — invoke once per batch item with shared **`CleanDeps`**; batch orchestrator is thin imperative shell around this functional core.
- **`CliRequest`** / **`command.ts`** — add **`batch`** routing alongside **`clean`** / **`guided`**.
- **Rendering** (**`src/cli/render.ts`**) — extend or add **`renderBatchOutcome`**-style helpers for summaries and **`--json`**.
- **Doctor / tool discovery types** — reuse for manifest **tool version** fields instead of duplicating probes.

### Established Patterns

- **Argv-only** subprocess execution; **typed outcomes** and exit taxonomy from Phase 1.
- **Dry-run** and **`--json`** parity expectations from **`clean`** / **`inspect`**.

### Integration Points

- Commander **`batch`** action → parse inputs → expand globs/dir → **planning loop** → optional **p-limit** worker pool → **manifest writer** → aggregate exit.

</code_context>

<specifics>
## Specific Ideas

- Batch UX should feel like **“clean, but a queue”** — same mental model as Phase 6’s equivalent **`clean`** line, extended with **per-file rows** in the summary.

</specifics>

<deferred>
## Deferred Ideas

- **Guided multi-file wizard** (`guided-batch`) — nice follow-on after flag-driven **`batch`** ships; out of Phase 7 unless roadmap merges it.
- **Resume / checkpoint** interrupted batches — backlog unless BATCH requirements explicitly expand.

</deferred>

---

*Phase: 07-batch-processing-manifests*
*Context gathered: 2026-05-02*
