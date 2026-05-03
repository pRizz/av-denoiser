# Phase 8 Research: Optional Heavy & Editor Integrations

## User Constraints

Synthesized from `.planning/phases/08-optional-heavy-editor-integrations/08-CONTEXT.md` — planner MUST honor:

- **Demucs (D-01–D-04):** External CLI only (`demucs` then `python3 -m demucs`); typed sequential logical step; **two-stems / vocal isolation** handoff as PCM WAV unless research forces otherwise; deterministic stem paths at plan time; **never** default-on — explicit preset/flag/guided opt-in only.
- **TOOL-04 (D-05–D-06):** Structured warnings on dry-run and before execute (CPU/GPU, model download, RAM/disk, slow-step copy); batch manifest carries the same facts when Demucs runs.
- **Audacity (D-07–D-09):** Explicit opt-in acknowledging `mod-script-pipe` + GUI; preflight pipe + app running + macro/script id; **documented-scriptable** commands only; honest limits (noise reduction scripting).
- **TOOL-06 (D-10):** Categorized diagnostics (pipe, not running, macro, export, unsupported feature) for doctor + planning errors.
- **Kdenlive/MLT (D-11–D-12):** FFmpeg / `ladspa` first; `melt` optional for MLT render only if maintainable; TOOL-08 graceful fallback when absent.
- **Pipeline (D-13–D-15):** Extend `LogicalPipelineStep` / argv builders; argv-only; PCM intermediates; batch concurrency caution when heavy steps run.
- **Doctor (D-16):** Honest capability signals — avoid claiming pipe readiness without reliable probes.

**Deferred (ignore in plans):** DeepFilterNet, audition snippets, full `.mlt` import UX as primary.

## Questions

1. What **Demucs 4.x CLI** argv shape and **output directory layout** should we target so planners can compute a **single deterministic vocal WAV path** after separation? [CITED: Demucs CLI README / `--help`]
2. What is the minimal **Audacity mod-script-pipe** command sequence that is **safe to automate** for v1 (macro run + export) without promising unsupported NR scripting?
3. Where should **`ladspa` / `melt`** capability surface: doctor-only vs plan-time gates for optional presets?

## Findings

### Demucs integration

- **Invocation:** Prefer `demucs` on `PATH`; fallback **`python3 -m demucs`** with the same argv tail — matches STACK and Phase 8 CONTEXT. [VERIFIED: `.planning/research/STACK.md`]
- **Typical separation:** `--two-stems=vocals` (or equivalent) with a named model (e.g. `htdemucs`) produces a **vocals stem** under a user-specified **output directory**; exact subdirectory naming follows Demucs’ `dora`-style layout (model / track / `vocals.wav`). Executor should pass **`-o <absoluteTempSubdir>`** and resolve the vocal file with a **pure helper** that encodes the known layout for the pinned Demucs major version assumptions, with tests locked to **relative segments** we document in code comments. [ASSUMED: layout — confirm against installed Demucs during implementation; add fixture or golden path test if feasible without bundling weights]
- **Warnings (TOOL-04):** Add stable `PipelineWarning` ids for **model download**, **GPU/CPU heavy**, **RAM**, **long runtime** — emit during `expandPreset` / pre-execution summary, not only when stderr appears.

### Audacity integration

- **Gate:** Opt-in flag pair pattern: e.g. **`--audacity-macro <name>`** plus **`--accept-audacity-pipe-risk`** (exact names planner discretion) mirrors glob-risk pattern from batch. [VERIFIED: Phase 7 `--accept-glob-risk` precedent]
- **Runtime:** Small adapter module under `src/adapters/` writes UTF-8 lines to the platform pipe path, reads responses with timeout; **no shell** — `Bun.writeFile` / `Bun.file` or `fs` streams as appropriate. [ASSUMED: pipe path resolution from Audacity prefs — document per-OS in RESEARCH follow-up during execute]
- **Diagnostics:** Map failures to **`AudacityAutomationReason`** enum (or string union) consumed by `doctor` text and planning failures. CONTEXT D-10.

### MLT / Kdenlive / LADSPA (TOOL-07 / TOOL-08)

- **Primary:** Extend **doctor** to report `ffmpeg -filters` contains **`ladspa`** when FFmpeg is available (capability row), and `melt -version` when `melt` exists — both **optional**, never block core clean. [VERIFIED: existing `doctor-report` capability pattern]
- **Product:** Phase 8 does **not** require generating `.mlt` for v1 unless a plan task stays minimal; CONTEXT allows **FFmpeg-first**. Prefer documenting **“use melt only when a project template exists”** over shipping a full MLT generator. **Claude's Discretion** per CONTEXT.

### Codebase integration points

- **`LogicalPipelineStep`** / **`buildLogicalStepCommand`** — add arms for **`demucs`** (and later **`audacity`**) parallel to **`sox`**. [VERIFIED: `src/domain/audio-pipeline-plan.ts`, `src/domain/audio-pipeline-argv.ts`]
- **`runSequentialPipeline`** — branch on `logical.tool` for non-FFmpeg/non-Sox executables; reuse `mapProcessFailure` with label `demucs`. [VERIFIED: `src/app/clean.ts`]
- **`CleanPlanSummary` / batch manifest** — ensure optional integration warnings appear in **`pipelineWarnings`** and propagate to manifest **`plannedSummary`** JSON. [VERIFIED: `src/domain/batch-manifest.ts`]

## RESEARCH COMPLETE
