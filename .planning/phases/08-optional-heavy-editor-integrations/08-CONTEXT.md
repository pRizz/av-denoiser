---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 08-2026-05-02T03-39-48
generated_at: 2026-05-02T03:39:47.980Z
---

# Phase 8: Optional Heavy & Editor Integrations - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning
**Mode:** Yolo

<domain>
## Phase Boundary

Phase 8 delivers **TOOL-03 … TOOL-08**: users can **opt in** to **Demucs** voice/source isolation, **Audacity** automation (when scripting prerequisites are met and accepted), and a **Kdenlive/MLT–oriented** path only when a **practical headless or melt-based** integration is viable — with **clear pre-run warnings** (resource, model download, slowness), **actionable diagnostics** when optional integrations cannot run, and **no regression** for FFmpeg / SoX / existing presets when those tools are absent.

**Explicitly out of scope for Phase 8:** repo-owned Python for Demucs; mandatory Audacity or Kdenlive; cloud processing; full video timeline editing; shipping raw user-authored FFmpeg filtergraphs as the primary UX.

</domain>

<decisions>
## Implementation Decisions

### Demucs adapter (TOOL-03)

- **D-01:** Discover and invoke Demucs only as an **external** runtime: prefer `demucs` on `PATH`, fallback to **`python3 -m demucs`** with argv arrays (no repo-owned Python package or bundled PyTorch).
- **D-02:** Represent Demucs as **typed logical pipeline step(s)** in the same **sequential** model as Phase 4 (one step consumes the previous artifact, produces the next). Default product shape: **two-stems vocals** (or equivalent) producing an **isolated vocal stem** wired into the existing **PCM WAV** interchange unless research forces a different lossless handoff.
- **D-03:** Planning must resolve **output stem paths / naming** deterministically from Demucs CLI behavior and fail at plan time with stable outcomes when invocation would be ambiguous.
- **D-04:** Demucs is **never silent-default** for generic presets: enable only via **explicit preset variant**, flags, or guided choice carried forward from Phase 6 patterns.

### Demucs warnings & preflight (TOOL-04)

- **D-05:** Emit **TOOL-04** class warnings on **dry-run and before execute**: heavy CPU/GPU use, **first-run model download** risk, RAM/disk expectations, and qualitative “slow step” messaging; do not rely on stderr alone.
- **D-06:** In **batch** mode, persist the same warnings and effective Demucs-related facts into the **batch manifest** (Phase 7 contract) per file when applicable.

### Audacity automation (TOOL-05)

- **D-07:** Gate all Audacity automation behind **explicit user opt-in** (CLI flag and/or guided confirmation) that acknowledges **`mod-script-pipe`** security and **GUI-running** requirements.
- **D-08:** Preflight must verify **reachable pipe**, **Audacity running**, and **configured macro/script identifiers** (or equivalent command contract) before enqueueing an Audacity step; otherwise fail planning with structured reasons.
- **D-09:** Keep Audacity as a **secondary** path after FFmpeg/SoX/Demucs viability — STACK and FEATURES research note scripting limits (e.g. noise reduction); Phase 8 implements only **documented-scriptable** workflows and surfaces limitations honestly in help and diagnostics.

### Audacity diagnostics (TOOL-06)

- **D-10:** When Audacity cannot run, return **actionable, categorized diagnostics** (pipe disabled/missing, app not running, macro missing, export path issues, unsupported scripted feature) suitable for both **doctor** summaries and **planning errors**, not opaque failures.

### Kdenlive / MLT scope (TOOL-07, TOOL-08)

- **D-11:** Prefer **FFmpeg-native** paths (including **`ladspa`** when available) for “Kdenlive-derived” cleanup; treat **`melt`** as **optional** for **MLT render** compatibility (e.g. render of a small generated or template `.mlt`) only if implementation research confirms a maintainable headless story.
- **D-12:** **TOOL-08:** If melt/MLT is unavailable or fails preflight, emit clear diagnostics and ensure users can still complete runs that use **FFmpeg / SoX / Demucs** only — no hard coupling.

### Pipeline typing, execution, batch parity

- **D-13:** Extend **`LogicalPipelineStep`** / argv builders so new tools remain **discriminated, typed, and argv-only** through **`ProcessCommand`** / runner adapters (consistent with **TRUST-01**).
- **D-14:** Keep **lossless / PCM-oriented** intermediates at external-tool boundaries unless research documents a necessary exception with explicit tests.
- **D-15:** When Demucs (or other heavy steps) are enabled, **bias batch concurrency** toward safe defaults (respect **`p-limit`**, document that users should not oversubscribe GPU/RAM) — exact numeric policy is implementation discretion with tests/docs.

### Doctor & tooling facts

- **D-16:** Extend **doctor** optional reporting with **honest** capability signals for Demucs (version/help invocation), melt (`melt -version`), and Audacity **only in contexts that avoid false confidence** (e.g. pipe status may remain “not checked” until deep/dedicated mode unless lightweight probes are reliable on all supported platforms).

### Claude's Discretion

- Exact Demucs CLI flag surface exposed as knobs, default model id, segment/overlap tuning, and whether a minimal `.mlt` template ships in-repo versus generate-only.
- Audacity macro naming convention and timeout/retry behavior for pipe round-trips.
- Depth of “deep” doctor probes versus plan-time-only checks.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements

- `.planning/ROADMAP.md` — Phase 8 goal, success criteria, **TOOL-03 … TOOL-08**.
- `.planning/REQUIREMENTS.md` — **TOOL-03 … TOOL-08** acceptance lines and out-of-scope table.

### Stack & research

- `.planning/research/STACK.md` — external Demucs CLI contract, Audacity `mod-script-pipe` cautions, melt/MLT optional path, **no repo-owned Python**.
- `.planning/research/FEATURES.md` — Demucs/Audacity feasibility notes, scripting limitations, concurrency expectations.

### Prior phase contracts

- `.planning/phases/04-core-audio-pipeline-sox-cleanup/04-CONTEXT.md` — sequential pipeline, `LogicalPipelineStep`, PCM interchange, preset transparency (**Phase 8 extends**, does not replace).
- `.planning/phases/07-batch-processing-manifests/07-CONTEXT.md` — manifest fields, concurrency, **`runCleanRequest` per file** (optional-tool facts must fit manifest story).

### Product & CLI docs

- `.planning/PROJECT.md` — optional integration philosophy and dependency risk.
- `docs/doctor.md` — optional tools listing and Phase 1 reporting expectations (Phase 8 deepens where appropriate).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/domain/audio-pipeline-plan.ts` / `src/domain/audio-pipeline-argv.ts` — extend `LogicalPipelineStep` and per-step argv builders for new tools while keeping planning pure.
- `src/app/clean.ts` — `runSequentialPipeline` orchestration, temp layout, and step summaries; integration point for new external steps.
- `src/domain/doctor-report.ts`, `src/adapters/tool-discovery.ts` — optional tool names and hints already list `demucs`, `audacity`, `melt`; extend with Phase 8 capability facts.

### Established Patterns

- **Argv-only** subprocess execution; typed outcomes; dry-run and inspect parity from prior phases.
- **Preset expansion → warnings** (`pipelineWarnings[]` pattern) for heavy or risky steps.

### Integration Points

- **Guided** flows (Phase 6) should surface optional integrations only when consistent with explicit opt-in decisions above.
- **Batch** manifest (Phase 7) should record optional-tool versions and Demucs-related warnings without breaking JSON consumers.

</code_context>

<specifics>
## Specific Ideas

No user-supplied product references in yolo mode — align with existing **PROJECT.md** “SoX/Audacity baseline + Demucs for stronger isolation” direction when choosing preset ordering in planning.

</specifics>

<deferred>
## Deferred Ideas

- **DeepFilterNet / RNNoise / ADV-*** backends — v2 **ADV-02** and related requirements; not Phase 8 unless explicitly pulled in.
- **Audition snippets / ADV-01** — deferred feature family.
- **Full `.mlt` project import** as a primary UX — only investigate if melt path proves simple; otherwise keep FFmpeg-first.

</deferred>

---

*Phase: 08-optional-heavy-editor-integrations*
*Context gathered: 2026-05-02*
