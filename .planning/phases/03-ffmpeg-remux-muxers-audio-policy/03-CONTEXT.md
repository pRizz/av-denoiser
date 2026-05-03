---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 03-2026-05-03T16-25-31
generated_at: 2026-05-03T16:25:31.959Z
---

# Phase 03: FFmpeg remux — muxers & audio policy - Context

**Gathered:** 2026-05-03  
**Status:** Ready for planning  
**Mode:** Yolo

<domain>

## Phase Boundary

Wire **`buildRemuxVideoWithProcessedAudioCommand`** and the **`clean`** execute/dry-run path so FFmpeg honors **mux format** and **per-container audio codec** policy (**MULTI-06**, **MULTI-07**): typed argv only (no user filtergraphs), explicit muxer selection where the milestone requires it, and unchanged **`fallback-required`** **libx264** recipe when the matrix demands re-encode.

**Depends on:** Phases **01–02** — **`PlannedContainer`**, matrix-driven **`plannedContainer`**, prelude already sets **WebM → `plannedAudioCodec: "opus"`**; **Matroska** copy-safe rows use **`aac`** in prelude today and **`inspect-summary`** already advertises **MKV + AAC**.

**Non-goals this phase:** **Phase 04** preservation prose polish, **`verifyCleanOutput`** expansion (**MULTI-08**–**12**), **Phase 05** **libx265** swap.

</domain>

<decisions>

## Implementation Decisions

### Explicit mux format (`MULTI-06`)

- **D-01:** For **video remux** outputs with **`plannedContainer: "webm"`**, argv MUST include **`-f webm`** immediately before the output file argument (after maps and stream options), so dry-run and logs show explicit WebM mux selection.
- **D-02:** For **`plannedContainer: "matroska"`**, argv MUST include **`-f matroska`** immediately before the output path (MKV extension alone is not sufficient for operator-visible **MULTI-06** compliance).
- **D-03:** For **`plannedContainer: "mp4"`**, do **not** add **`-f mp4`** unless a concrete executor bug or PLATFORM matrix row documents the need — extension **`.mp4`** + codecs remains the default (**smallest diff** vs shipped MP4 paths).

### Per-container audio policy (`MULTI-07`)

- **D-04:** Single documented **v1.1 operator table** (code comment + PLAN; REQUIREMENTS stays source of IDs):
  | `plannedContainer` | Final mux audio codec | FFmpeg encoder argv shape |
  |--------------------|-----------------------|---------------------------|
  | **`mp4`** | **AAC-LC** | **`-c:a aac -b:a 192k`** (current behavior) |
  | **`webm`** | **Opus** | **`-c:a libopus -b:a 128k`** (deterministic default bitrate; prelude already selects **`opus`**) |
  | **`matroska`** | **AAC-LC** | **`-c:a aac -b:a 192k`** (aligned with **`inspect-summary`** MKV + AAC messaging) |
- **D-05:** **`pcm_s16le`** is **not** a default for these video remux deliverables — reserve for **`wav`/intermediate-only** flows already handled outside this remux builder; matrix video remux always re-encodes processed audio per table above.

### Remux argv builder contract

- **D-06:** Extend **`RemuxVideoCopyParams` / `RemuxVideoWithProcessedAudioParams`** with **`plannedContainer: PlannedContainer`** (or **`Exclude<PlannedContainer, "wav">`** if planner guarantees no WAV here). **Do not** infer mux format solely from **`resolvedOutputPath`** extension — keeps planning and argv in one typed path (**MULTI-06** traceability).

### Prelude alignment

- **D-07:** **`planMediaOutputPrelude`** already maps **WebM → opus**. **Matroska** rows keep **`plannedAudioCodec: "aac"`** unless a future requirement mandates Opus-in-MKV (**out of scope**). Any new **VP9-in-Matroska** copy-safe row (if shipped in **02**) uses the **same MKV row** → **AAC** unless REQUIREMENTS amended.

### Dry-run / operator visibility

- **D-08:** **`clean`** dry-run step summaries (**`displayCommand`**) MUST surface the same **`-f`** and audio codec argv as execute — satisfies roadmap “Dry-run summaries show **`-f matroska`** / **`-f webm`** when required.”

### Video fallback (re-encode)

- **`videoStreamMode: "reencode-h264"`** remains **MP4 + libx264 + yuv420p + CRF recipe** as today (**Phase 05** replaces **x264** with **x265** later). **Phase 03** only ensures mux/audio policy applies to **stream-copy** multi-container branches.

### Claude's Discretion

- **Exact Opus bitrate** (**128k** vs **96k**/VBR): **128k** as default locked above for speech/general cleanup balance; PLAN may tune iffixture-based listening tests disagree.
- **`faststart` / MOV flags** on MP4: unchanged — not part of **MULTI-06**.

### Folded Todos

None (**`todo match-phase 03`** returned **0** matches).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope

- `.planning/ROADMAP.md` — Phase **03** goal, success criteria, **MULTI-06**, **MULTI-07**.
- `.planning/REQUIREMENTS.md` — **MULTI-06**, **MULTI-07**, traceability table.
- `.planning/PROJECT.md` — **v1.1** mux/audio narrative.

### Prior phase locks

- `.planning/phases/01-multi-container-output-model-path-derivation/01-CONTEXT.md` — **`PlannedContainer`**, path derivation.
- `.planning/phases/02-feasibility-matrix-vp9-theora-extras/02-CONTEXT.md` — matrix tokens, prelude **WebM Opus / deferrals**, **MULTI-12** literals.

### Implementation touchpoints

- `src/domain/video-clean-argv.ts` — **`buildRemuxVideoWithProcessedAudioCommand`**, **`RemuxVideoCopyParams`**.
- `src/app/clean.ts` — remux build + dry-run summaries.
- `src/domain/output-plan.ts` — **`planMediaOutputPrelude`**, **`plannedAudioCodec`**, **`plannedContainer`**.
- `src/domain/inspect-summary.ts` — preservation bullets (must stay consistent with mux/audio table after code changes).

### Tests

- `test/domain/video-clean-argv.test.ts` — extend expectations for **`-f`** / codec argv by container.
- `test/app/clean.test.ts` — dry-run strings for WebM/MKV when fixtures exist (**Phase 04** may add more matrix verification).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable assets

- **`buildRemuxVideoWithProcessedAudioCommand`** already branches **`plannedAudioCodec`** (**`aac`**, **`opus`**, **`pcm_s16le`**) — needs **`plannedContainer`**-driven **`-f`** and tightened **opus** bitrate defaults.
- **`planMediaOutputPrelude`** sets **`plannedAudioCodec`** to **`opus`** only when **`plannedContainer === "webm"`**.

### Established patterns

- **`createProcessCommand`** / immutable **`ProcessCommand`** — extend args array only; no shell string concatenation.

### Integration points

- **`runCleanRequest`** builds remux after pipeline — thread **`plannedContainer`** from **`OutputPlan`** into **`buildRemuxVideoWithProcessedAudioCommand`** alongside existing **`plannedAudioCodec`**.

</code_context>

<specifics>

## Specific Ideas

Yolo synthesis prioritizes **explicit **`-f`**** for **WebM**/**Matroska**, **typed **params**** over extension inference**, **AAC 192k** parity for MP4/MKV**, **Opus 128k** for WebM**, and **minimal MP4 churn**.

</specifics>

<deferred>

## Deferred Ideas

- **User-facing `--audio-codec`** override (**FUT**).
- **Vorbis** or **FLAC-in-Matroska** policy rows (**post-v1.1** unless REQUIREMENTS expands **MULTI-07**).
- **`-f mp4`** opt-in flag for stubborn FFmpeg builds (**only with evidence**).

### Reviewed Todos (not folded)

None.

</deferred>

---

*Phase: 03-ffmpeg-remux-muxers-audio-policy*

*Context gathered: 2026-05-03*
