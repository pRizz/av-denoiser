---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 03-2026-05-01T22-59-55
generated_at: 2026-05-01T23:00:15.000Z
---

# Phase 3: Video Preservation & Fallback Control - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning
**Mode:** Yolo

<domain>
## Phase Boundary

Phase 3 delivers truthful stream-copy-first planning and user-controlled fallback handling **before** any FFmpeg execution that could re-encode video or change containers unexpectedly. It implements **VIDEO-01**, **VIDEO-02**, and **VIDEO-03**: default policy favors copying video (`-c:v copy`) when container and stream facts allow it; users always see explicit, structured reasons when that path is impossible; and users can approve or deny fallbacks that would re-encode video or alter the output container compared to the copy-safe baseline.

This phase **replaces** the Phase 2 stub that labels every video+audio input as `video-copy-safe` without compatibility proof (`phase-2-stub-video-copy-safe`). Phase 3 owns the feasibility matrix **at the depth appropriate for v1**—sound engineering defaults and explicit gaps—not the exhaustive v2 compatibility grid (see REQUIREMENTS **MEDIA2-\***).
</domain>

<decisions>
## Implementation Decisions

### Stream-copy feasibility classification (VIDEO-01)

- **D-01:** Treat `video-copy-safe` as **proven**, not hopeful: the planner may emit this modality only when it can justify that the intended output container **and** mux mapping can carry the **existing** video stream without transcoding, together with the **planned** audio encoding/remux described by the typed output plan from Phase 2.
- **D-02:** Use **deterministic, code-backed rules** derived from FFmpeg semantics (muxer/stream-copy constraints) rather than probing FFmpeg at plan time for every path. Start with a **narrow v1 matrix** (common containers/codecs called out in presets/docs) and expand deliberately with tests; unknown combinations must **not** silently upgrade to copy-safe.
- **D-03:** When video exists but stream-copy cannot be proven under those rules, classify as **`fallback-required`** (not `unsupported`) unless inputs are fundamentally unusable—preserving continuity with the Phase 2 modality union and exit-code mapping work from Phase 1.
- **D-04:** Keep multi-track/subtitle/chapter policy aligned with Phase 2 defaults unless **VIDEO-03** forces an explicit user decision; defer rich MEDIA2 policies per REQUIREMENTS **MEDIA2-01**.

### Explicit fallback reasons (VIDEO-02)

- **D-05:** Extend the existing **`reasonCodes`** pattern from Phase 2 with stable, machine-readable identifiers for video preservation (e.g. container incompatibility, codec not allowed in target mux without transcoding, B‑frame/timestamp edge cases **if** modeled in v1—otherwise a conservative umbrella code with a clear human explanation).
- **D-06:** Every `fallback-required` plan MUST carry **at least one** primary reason code plus optional secondary codes; human-readable inspect/plan output MUST surface **what failed** and **what fallback would entail** (video transcode vs container change vs both) without dumping raw FFmpeg logs as the only explanation.
- **D-07:** Align wording with **VIDEO-04** (Phase 5) only where Phase 3 prepares fields—Phase 3 focuses on **plan-time** clarity; final run reports remain Phase 5.

### User approval / rejection of fallbacks (VIDEO-03)

- **D-08:** Introduce an explicit **CLI policy** for non-interactive use (names are implementation details): *deny* fallbacks by default at execution boundaries OR require an explicit opt-in flag before any plan proceeds to spawn FFmpeg that transcodes video or switches containers away from the copy-safe path—**planners must record** whether the selected operation requires user-approved fallback.
- **D-09:** Map denial to the existing **planning / trust outcome** surface from Phase 1 (stable exit family for “fallback required but not approved”) rather than ad hoc stderr strings.
- **D-10:** Reserve interactive confirmation flows for Phase 6; Phase 3 ships **flags + typed outcomes** so automation behaves predictably.

### Claude's Discretion

- Exact flag spellings and enum token names (`allow-video-reencode`, `--video-fallback`, etc.).
- The initial rows of the v1 compatibility table and how aggressively to special-case MOV/MP4/MKV vs “everything else defaults to conservative fallback-required.”
- Whether to run optional lightweight FFmpeg `-f null` dry probes in Phase 3 vs Phase 5—default bias: **pure planning first**, probes only if purely structural rules are insufficient and cost is bounded.

### Folded Todos

_None — no matching pending todos for this phase._

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements

- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, dependency on Phase 2.
- `.planning/REQUIREMENTS.md` — **VIDEO-01**, **VIDEO-02**, **VIDEO-03** acceptance IDs for this phase.
- `.planning/PROJECT.md` — Core value, media integrity constraint (“avoid video recompression whenever possible”).

### Prior phase contracts

- `.planning/phases/02-media-probing-output-planning/02-CONTEXT.md` — `OutputPlan` modality union, reason codes, explicit audio/container fields, inspect summaries.
- `.planning/phases/01-bun-cli-foundation-trust-model/01-CONTEXT.md` — argv-only execution, exit outcomes, functional core vs imperative shell.

### Research

- `.planning/research/STACK.md` — FFmpeg stream copy/remux expectations and discovery contract.

### Deferred / adjacent work

- `.planning/REQUIREMENTS.md` — **VIDEO-04**, **VIDEO-05**, **MEDIA2-\*** — final run reporting, deeper matrices, and rich multi-track policies are partially adjacent but **not** Phase 3 completion criteria except where noted above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/domain/output-plan.ts` — `OutputModality`, `OutputPlan`, and `planMediaOutput()` currently stub `video-copy-safe` for any video+audio input; Phase 3 replaces stub reason codes (`phase-2-stub-video-copy-safe`) with real classification and structured fallback explanations.
- `src/domain/inspect-summary.ts` — renders plan summaries for `inspect`; extend alongside new modalities/reasons while keeping output readable for scripting.
- `src/app/inspect.ts` — orchestrates probe → path resolution → `planMediaOutput`; future execute path should reuse the same planning core before spawning FFmpeg.

### Established Patterns

- Tagged unions and **reason code arrays** at the planning boundary match Phase 2 decisions.
- CLI outcomes should remain typed and mapped to documented exit codes per Phase 1.

### Integration Points

- Phase 4–5 execution layers consume an **`OutputPlan`** that honestly reflects copy vs fallback and records whether user-approved fallback is required.
- Doctor/diagnostics may later advertise planning capabilities; Phase 3 can stay focused on domain + CLI wiring needed for inspect/dry-run parity.

</code_context>

<specifics>
## Specific Ideas

- Prefer **conservative** classification: when in doubt, emit **`fallback-required`** with a clear reason rather than optimistically preserving the Phase 2 stub behavior.
- Fallback explanations should name **user-facing consequences**: “video will be re-encoded”, “output container must change from X to Y”, “audio will be re-encoded as part of remux” — grounded in the typed plan fields from Phase 2.

</specifics>

<deferred>
## Deferred Ideas

- Guided prompts and copied non-interactive command parity for fallback approval live primarily in **Phase 6**, consuming Phase 3 flags and outcomes.
- Exhaustive container compatibility matrices and multi-track/stream disposition policies belong to **v2 MEDIA2-\*** or dedicated roadmap phases—not Phase 3 scope.

### Reviewed Todos (not folded)

_None._

</deferred>

---
*Phase: 03-video-preservation-fallback-control*
*Context gathered: 2026-05-01*
