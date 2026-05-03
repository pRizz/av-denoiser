---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 04-2026-05-02T00-13-28
generated_at: 2026-05-02T00:13:28.458Z
---

# Phase 4: Core Audio Pipeline & SoX Cleanup - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning
**Mode:** Yolo

<domain>
## Phase Boundary

Phase 4 delivers **MEDIA-01** and **PIPE-01 … PIPE-06** plus **TOOL-02**: a **sequential**, **preset-driven** cleanup path for **a single audio file** input that yields a **cleaned audio output file**, using **transparent** ordered steps (FFmpeg core + optional **SoX / SoX_ng** when available), **PCM-oriented intermediates by default**, and **explicit warnings** for aggressive, slow, model-backed, or artifact-prone steps.

**Explicitly defer to Phase 5:** final **video+audio** remux execution, VIDEO-04-style run reports beyond what Phase 4 needs locally, and full **TOOL-01** “always-on” FFmpeg filter execution as the only path (Phase 4 still requires FFmpeg for decode/encode at minimum).

**Explicitly defer to Phase 8:** Demucs, Audacity, Kdenlive/MLT integrations (TOOLS 03–08).

Interactive guided UX and flag-for-non-interactive parity (**CLI-04**, UX-*) remain **Phase 6**—Phase 4 should still define **deterministic typed requests** so later phases mirror the same underlying plan/run model.
</domain>

<decisions>
## Implementation Decisions

### Execute surface and modality gate (MEDIA-01 alignment)

- **D-01:** Introduce a **dedicated execution subcommand** (exact name implementation detail — e.g. `clean`) rather than turning `inspect` into a blended plan+execute command. **Inspect stays plan-only for all modalities**; the new command owns “run pipeline when safe.”
- **D-02:** Phase 4 **audio execute path** gates on **`OutputPlan.modality === "audio-only"`**. Inputs that resolve to `video-copy-safe`, `fallback-required`, or `unsupported` are **plan-time rejected** from this command with stable outcomes (reuse **Phase 1** exit taxonomy — e.g. `invalid-input`, `fallback-required`, or a dedicated **`unsupported-input-modality`** if cleaner). **Phase 5** will add execution for mixed A/V once remux/reporting lands.
- **D-03:** Preserve **collision-safe defaults** from Phase 2 (`output-path` rules, sibling naming, overwrite opt-in)** for audio outputs.**

### Preset transparency (PIPE-01, PIPE-02)

- **D-04:** Ship a **small, named preset set** authored as **typed data in the functional core** (e.g. `src/domain/` registry + discriminated unions + Zod at boundaries)—not arbitrary user FFmpeg filtergraphs (see REQUIREMENTS Out of Scope).
- **D-05:** Every preset **expands to an ordered list of pipeline steps** (tool + step kind + bounded options) surfaced in **`--dry-run` / textual summary before execution** alongside resolved binary paths after discovery (**doctor-style** readiness still optional for Phase 4 but mismatches fail with actionable errors).

### Per-step tuning (PIPE-03)

- **D-06:** Bounded **preset-level knobs** only for v1 (e.g. overall strength / profile enum / a few numeric fields validated per step)—no open-ended filter strings. Prefer **explicit flags** mirrored later in Phase 6 rather than YAML/JSON authoring (**AUTO-04** deferred).

### Sequential execution and intermediates (PIPE-04, PIPE-05)

- **D-07:** Runner executes **exactly one step at a time**; step *k* consumes the previous artifact path and writes the next. Fail fast preserves partial artifacts only when useful for debugging (implementation discretion; default bias: **cleanup temps on success**, **leave on failure** configurable later).
- **D-08:** Default intermediate serialization is **`wav` PCM (e.g. s16le)** for maximum compatibility across FFmpeg ⇄ SoX handoffs; ** FLAC** remains an allowable implementation optimization only if equivalently lossless and covered by tests.

### FFmpeg vs SoX responsibilities (PIPE-*, TOOL-02)

- **D-09:** **FFmpeg** owns **decode from source container**, **encode to final planned audio codec/container** aligned with **`OutputPlan` / Phase 2** defaults for audio-only (**AAC + MP4 today** unless planning introduces an audio-only divergent branch—prefer **reuse `plannedAudioCodec` / `plannedContainer`** fields rather than silently inventing defaults in the runner).
- **D-10:** **Native FFmpeg denoise / dynamics / EQ filters** belong in **typed FFmpeg substeps**. **SoX / SoX_ng** substeps handle **effects-based cleanup** only when **`sox_ng` preferred, `sox` fallback** discovery matches STACK + existing **doctor-report** tooling names.
- **D-11:** If SoX unavailable for a preset that includes SoX, **surface a clear planning/runtime error** (“missing optional tool”)—no silent omission of billed steps unless preset metadata explicitly marks alternate FFmpeg-only degraded paths (**default: no silent degradation without user-visible preset variant**).

### Risk warnings (PIPE-06)

- **D-12:** Attach **`pipelineWarnings[]`** (stable string IDs + human titles) during preset expansion and/or preflight—not only stderr from tools. Warn for **heavy CPU**, **artifact risk**, **double dynamics**, **narrowband speech destruction**, etc., following product tone (“honest companion,” not alarming spam).

### Trust and observability continuity

- **D-13:** All external tool invocations continue **argv-only** (`ProcessRunner` pattern). Log **effective argv arrays** into structured summaries where TRUST-focused reporting exists; raw media noise remains **never** the only error signal (align mindset with Phase 5 **TRUST-02**/03 even if fuller reporting waits).

### Claude's Discretion

- Exact preset names, default FFmpeg filter choices (**afftdn** vs **anlmdn** ordering), tempfile naming schema, parallelism (none in Phase 4), and whether **`arnndn`** appears in presets before optional models are ergonomically surfaced (bias: **defer model-file UX** toward Phase 8 / ADV-* unless trivially guarded).
- Whether **Phase 4** exposes a minimal `--json` for pipeline plans before run (recommended for parity with inspect, but schema can evolve in planning).

### Folded Todos

_None — `todo match-phase` returned no matches._

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements

- `.planning/ROADMAP.md` — Phase 4 goal, success criteria (**MEDIA-01**, **PIPE-01 … PIPE-06**, **TOOL-02** trace lines).
- `.planning/REQUIREMENTS.md` — Acceptance IDs cited above plus Out of Scope (**no raw filtergraph UX**).

### Prior phase contracts

- `.planning/phases/01-bun-cli-foundation-trust-model/01-CONTEXT.md` — argv-only execution, exit outcomes, CLI trust model.
- `.planning/phases/02-media-probing-output-planning/02-CONTEXT.md` — `MediaProbe`, `OutputPlan`, `plannedAudioCodec` / `plannedContainer`, inspect-only CLI scope.
- `.planning/phases/03-video-preservation-fallback-control/03-CONTEXT.md` — stream-copy modality versus execute gating (**Phase 4 audio-only runner** rejects non–audio-only modalities by design).

### Research / stack intent

- `.planning/research/STACK.md` — FFmpeg-first denoise filters, SoX_ng preference + `sox` fallback discovery contract.

### Deferred / adjacent

- `.planning/REQUIREMENTS.md` sections **VIDEO-04**, **TOOL-01**/03+, **CLI-04**, UX-*, BATCH-*, **ADV-\***, **AUTO-\*** — not Phase 4 exit criteria unless called out explicitly in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/domain/output-plan.ts` — `planMediaOutput`, `audio-only` modality branch, planned codec/container wiring for summaries.
- `src/domain/output-path.ts` — collision-safe resolution for outputs.
- `src/domain/command-outcome.ts` / `src/domain/exit-codes.ts` — map planning failures (`unsupported`, `fallback-required`, …) consistently for new commands.
- `src/adapters/process-runner.ts`, `src/domain/process-command.ts` — argv-only spawning for FFmpeg/SoX invokes.
- `src/adapters/tool-discovery.ts`, `src/domain/doctor-report.ts` — SoX vs SoX_ng optional tool modeling.
- `src/cli/command.ts`, `src/domain/cli-request.ts` — Commander + typed `CliRequest` extension point for a new subcommand.

### Established Patterns

- **Functional core** builds serializable pipeline plans **before** spawning tools; adapters perform I/O only.
- **Inspect** orchestration (`src/app/inspect.ts`) demonstrates probe → path → plan sequencing to mirror for execute preflight (**dry-run**).

### Integration Points

- Phase 5 will consume the same preset/pipeline representations for audio replacement + remux; avoid one-off procedural scripts that cannot be reused.
- **Doctor** can later summarize pipeline capability beyond PATH presence (**ffmpeg -filters**)—reuse facts shape where feasible.

</code_context>

<specifics>
## Specific Ideas

- Preset cards should read like recipes: ordered steps (“Extract PCM → FFmpeg afftdn → SoX gentleness → AAC/MP4”) with **risk badge** parity in text + JSON summaries.
- Favor presets that degrade **predictably**: e.g., “speech cleanup (FFmpeg-only)” sibling preset when SoX absent instead of silently dropping SoX (**only** if enumerated as alternate preset in summaries — ties to **D-11** default stance).

</specifics>

<deferred>
## Deferred Ideas

- **Demucs / Audacity / melt** integration paths (**Phase 8**).
- **Video output** execution + **final human reports** verifying stream copy (**Phase 5** + VIDEO-04 / TRUST-02/03).
- **Interactive wizard** equivalents + copied command strings (**Phase 6**, CLI-04).
- Full **AUTO-04** authored pipeline config files vs Phase 4 bounded knobs.

### Reviewed Todos (not folded)

_None._

</deferred>

---
*Phase: 04-core-audio-pipeline-sox-cleanup*
*Context gathered: 2026-05-02*
