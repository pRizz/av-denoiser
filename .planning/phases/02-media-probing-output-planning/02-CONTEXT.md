---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 02-2026-05-01T23-43-24
generated_at: 2026-05-01T23:43:24.694Z
---

# Phase 2: Media Probing & Output Planning - Context

**Gathered:** 2026-05-01
**Status:** Implemented (yolo retrospective refresh)
**Mode:** Yolo

<domain>
## Phase Boundary

Phase 2 delivers structured inspection of input media (via FFprobe) and deterministic output planning before any denoise or transcoding work runs. It implements MEDIA-03, MEDIA-04, MEDIA-05, and VIDEO-05 at the planning layer: users see factual probe results, safe paths, output modality classification, and explicit audio/container intent—not implicit FFmpeg defaults.

Discussion refresh (this pass): reaffirm decisions against the codebase as-built after plan execution; do not expand scope beyond Phase 2. **`fallback-required`** exists as a modality type but is not materially populated until Phase 3’s compatibility matrix—the planner currently uses a Phase 2 stub that labels mixed A/V probes as **`video-copy-safe`** with reason codes documenting the stub (`phase-2-stub-video-copy-safe`).
</domain>

<decisions>
## Implementation Decisions

### Probe ingestion and domain model

- **D-01:** Parse `ffprobe -print_format json -show_format -show_streams` output at the adapter boundary with Zod into explicit domain types for stream index, codec type/name, disposition defaults, channels, sample rate, and optional format duration (`src/domain/media-probe.ts`).
- **D-02:** Fail fast with a typed parse error when JSON is invalid or the schema rejects required fields (`invalid-json`, `schema-mismatch`); avoid carrying `unknown` into the functional core.
- **D-03:** Run FFprobe through `ProcessCommand` argv arrays via `runFfprobeProbe` (`src/adapters/ffprobe.ts`), consistent with Phase 1 trust decisions.

### Output path safety (MEDIA-04)

- **D-04:** Treat overwriting an existing output as opt-in via `--force` on `inspect`; default rejects collisions (`output-exists`) with a stable planning outcome.
- **D-05:** Forbid resolving output identical to normalized input (`output-equals-input`); no silent in-place source modification for v1.
- **D-06:** Deterministic sibling default naming: `<stem>.avdn.<ext>` (`DEFAULT_OUTPUT_SUFFIX_SEGMENT` in `src/domain/output-path.ts`).

### Plan classification and user visibility (MEDIA-05)

- **D-07:** Modality as a tagged union (`audio-only` | `video-copy-safe` | `fallback-required` | `unsupported`) with `reasonCodes` on `OutputPlan` (`src/domain/output-plan.ts`).
- **D-08:** Human-readable text summary plus optional **`--json`** on `inspect` using `InspectPlanSummary` (`src/domain/inspect-summary.ts`, `src/cli/render.ts`).

### Deliberate codec and container choices (VIDEO-05)

- **D-09:** Planned delivery defaults coded in pure logic: **`plannedAudioCodec: "aac"`**, **`plannedContainer: "mp4"`** where the plan supports output (non-unsupported); types allow `aac` \| `opus` \| `pcm_s16le` and `mp4` \| `matroska` \| `wav` for later phases.
- **D-10:** Default audio stream selection prefers **explicit `disposition.default`**, else **highest channel count**, else first stream (`selectAudioStream` in `output-plan.ts`).

### Implemented CLI surface (Claude’s discretion — now fixed)

- **D-11:** **`av-denoiser inspect <input>`** with **`-o, --output`**, **`--force`**, **`--json`** (`src/cli/command.ts`). No separate “dump raw FFprobe JSON” flag in Phase 2; introspection focuses on typed summary and plan.

### Claude's Discretion

- Fine-grained wording and column layout in **`renderInspectPlanText`** remain flexible as long as modality, paths, codec, container, selected stream index, and reason codes are obvious.

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

- `.planning/REQUIREMENTS.md` (sections **MEDIA2-\*** / **v2 Requirements**) — Multi-track depth, exhaustive compatibility matrices—explicitly broader than Phase 2’s minimal stream-selection rule.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/adapters/ffprobe.ts` — `runFfprobeProbe`, JSON stdout → `parseFfprobeJson`.
- `src/domain/media-probe.ts` — Zod schemas and `parseFfprobeJson`.
- `src/domain/output-path.ts` — collision-safe path resolution and `DEFAULT_OUTPUT_SUFFIX_SEGMENT`.
- `src/domain/output-plan.ts` — `planMediaOutput`, modality union, Phase 3 stub commentary.
- `src/domain/inspect-summary.ts` — `outputPlanToInspectSummary`.
- `src/app/inspect.ts` — Missing-tool handling, orchestration glue.
- `src/cli/command.ts` — `inspect` subcommand and flags.
- `src/adapters/process-runner.ts`, `src/domain/process-command.ts` — argv-only spawn path.

### Established Patterns

- Functional core (`planMediaOutput`, `resolveOutputPath`, parsers) stays pure; CLI and subprocess I/O remain in adapters/app.
- Tests target parsers and planners with fixtures/mocks (`bun test`).

### Integration Points

- Phase 3 replaces stub modality/reason-code logic when real stream-copy feasibility and **`fallback-required`** causes are modeled.
- Phase 5+ consumes `OutputPlan` fields when generating FFmpeg graphs; Phase 6 may add guided parity with `inspect` flags.

</code_context>

<specifics>
## Specific Ideas

- Inspect output should keep the eventual video-copy vs fallback story obvious in text—even while Phase 3 owns the detailed matrix.
- **“No hidden FFmpeg defaults”** is upheld at the planning layer by naming explicit **`plannedAudioCodec`** and **`plannedContainer`** on supported plans.

</specifics>

<deferred>
## Deferred Ideas

- Interactive confirmations for collisions and presets belong primarily to Phase 6; Phase 2 keeps deterministic CLI flags (`--force`, `--output`).
- Full container/stream matrices and MEDIA2-* depth belong to v2/later roadmap items.
- Actual transcoding/remux/reporting belong to Phases 4–5.

### Reviewed Todos (not folded)

_None._

</deferred>

---
*Phase: 02-media-probing-output-planning*
*Context gathered: 2026-05-01*
