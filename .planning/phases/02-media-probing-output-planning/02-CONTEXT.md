---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 02-2026-05-01T22-28-29
generated_at: 2026-05-01T22:28:29.532Z
---

# Phase 2: Media Probing & Output Planning - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning
**Mode:** Yolo

<domain>
## Phase Boundary

Phase 2 delivers structured inspection of input media (via FFprobe) and deterministic output planning before any denoise or transcoding work runs. It implements MEDIA-03, MEDIA-04, MEDIA-05, and VIDEO-05 at the planning layer: users see factual probe results, safe paths, output modality classification, and explicit audio/container intent—not implicit FFmpeg defaults.
</domain>

<decisions>
## Implementation Decisions

### Probe ingestion and domain model

- **D-01:** Parse `ffprobe -print_format json -show_format -show_streams` output at the adapter boundary with Zod (or equivalent narrow parsers) into explicit domain types for format summary and per-stream facts the planner needs (codec, codec_type, index, disposition, tags subset).
- **D-02:** Prefer failing fast with a typed parse error when required probe fields are missing or malformed, rather than carrying `unknown` into the functional core. Optional tolerance only where FFmpeg versions omit fields documented as optional in our schema.
- **D-03:** Run FFprobe through the existing `ProcessCommand` + process-runner path (argv only, no shell strings), consistent with Phase 1 trust decisions.

### Output path safety (MEDIA-04)

- **D-04:** Treat overwriting an existing output file as an explicit opt-in (`--force` or future guided confirmation); default behavior rejects collisions with a clear planning failure outcome.
- **D-05:** Forbid silent in-place modification of the source path: planned output must differ from input unless the product later defines an explicit dangerous mode (out of scope for v1 per REQUIREMENTS).
- **D-06:** Default output naming should be deterministic and boring—for example `<input-stem>.<suffix>.<ext>` or a documented sibling pattern—so scripts and tests can predict paths without interactive prompts in Phase 2.

### Plan classification and user visibility (MEDIA-05)

- **D-07:** Represent modality as a tagged union on the pure planning side (e.g. audio-only output intent, video-copy-safe, fallback-required, unsupported) with machine-readable reason codes that stable exit outcomes can map to later.
- **D-08:** Phase 2 ships a human-readable plan summary for CLI users (structured sections or a compact table) grounded on that union; optional JSON plan output can align with later Phase 6 non-interactive parity but is not required to block Phase 2 if text rendering plus typed domain types are complete.

### Deliberate codec and container choices (VIDEO-05)

- **D-09:** Final-output audio codec and container choices must be fields on the typed output plan with documented defaults (e.g. sensible AAC or Opus for delivery, lossless PCM/FLAC-class choices for intermediate-heavy phases later), not “whatever FFmpeg picks.”
- **D-10:** Where multiple streams exist, Phase 2 should define which audio stream is selected by default (e.g. default/disposition/highest channel count) and surface that choice in the plan summary; multi-track policies remain deferred per MEDIA2-01.

### Claude's Discretion

- Exact CLI flag names for “show probe JSON,” “show plan JSON,” and default suffix strings.
- Formatting of the human-readable plan summary (colors, column order) as long as classifications and reasons remain obvious.

### Folded Todos

_None — no matching pending todos for this phase._

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements

- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, dependencies (Phase 1).
- `.planning/REQUIREMENTS.md` — MEDIA-03, MEDIA-04, MEDIA-05, VIDEO-05 acceptance IDs for this phase.
- `.planning/PROJECT.md` — Core value, constraints, and media integrity expectations.

### Prior phase context

- `.planning/phases/01-bun-cli-foundation-trust-model/01-CONTEXT.md` — Trust model, argv-only execution, Zod-at-boundaries, functional core vs imperative shell.

### Research and architecture

- `.planning/research/STACK.md` — FFmpeg/FFprobe roles and discovery contract.
- `.planning/research/ARCHITECTURE.md` — Layering for adapters vs domain.

### Deferred specification

- `.planning/REQUIREMENTS.md` (sections **MEDIA2-\*** / **v2 Requirements**) — Multi-track, compatibility matrix depth—explicitly out of v1 phase scope except where Phase 2 picks a minimal default audio-stream rule.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/adapters/process-runner.ts` and `src/domain/process-command.ts` — spawn FFprobe with argv arrays.
- `src/adapters/tool-discovery.ts` — resolves `ffprobe` path and records `ffprobe.json-output` as a capability stub (`not-checked-yet`, Phase 01); Phase 2 should replace or satisfy that capability check where appropriate.
- `src/domain/doctor-report.ts` — patterns for structured tool facts; probe failures can align with similar structured diagnostics later.

### Established Patterns

- Functional core holds pure planning decisions; CLI and FFprobe invocation stay in adapters.
- Tests inject `maybeWhich` / `runProcess` so probe parsing and planning tests avoid requiring real media binaries beyond optional integration fixtures.

### Integration Points

- New domain modules for probe parse results and output plans feed future Phase 3–5 execution layers without rewriting Phase 1 CLI routing patterns.
- `doctor` may eventually reflect real JSON probe capability; Phase 2 focuses on runtime probe/plan behavior rather than expanding doctor aesthetics.

</code_context>

<specifics>
## Specific Ideas

- Planning output should make the video-copy vs fallback story legible before Phase 3 adds approval UX for fallbacks.
- Preserve alignment with “no hidden FFmpeg defaults” by naming explicit encoder/container selections even when they match common FFmpeg presets.

</specifics>

<deferred>
## Deferred Ideas

- Interactive guided prompts for plan confirmation belong primarily to Phase 6; Phase 2 establishes the data model and non-guided CLI surfaces first.
- Full container compatibility matrices and exhaustive multi-track policies belong to v2 (MEDIA2-\*) or later roadmap phases.
- Actual FFmpeg execution, remuxing, and SoX/Demucs steps belong to Phases 4–5.

### Reviewed Todos (not folded)

_None._

</deferred>

---
*Phase: 02-media-probing-output-planning*
*Context gathered: 2026-05-01*
