---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 02-2026-05-03T21-30-00Z
generated_at: "2026-05-03T21:30:00.000Z"
---

# Phase 02: Feasibility matrix — VP9, Theora, extras — Context

**Gathered:** 2026-05-03  
**Status:** Ready for planning  
**Mode:** Yolo

<domain>

## Phase Boundary

Expand **`evaluateStreamCopyFeasibility`** (and the **`planMediaOutputPrelude`** / **`planMediaOutput`** contract) so **VP9**, **theora**, and selected **extras** (**MULTI-05**, starting with **VP8**) map deterministically to **`video-copy-safe`** vs **`fallback-required`** with **stable `reasonCodes`** and the correct **`plannedContainer`** literals (**MULTI-03**, **MULTI-04**, **MULTI-05**). **inspect** summaries must reflect new success / fallback tokens (exact UX wording may stay minimal until Phase **04**, but modality and **`reasonCodes` must be correct).

**Depends on:** Phase **01** (completed) — **`PlannedContainer`**, implicit path derivation by container, taxonomy comment in **`stream-copy-feasibility`**.

Non-goals **this phase:** FFmpeg **`-f webm` / mux argv** sequencing (**MULTI-06**/**07** Phase **03**) and **`verifyCleanOutput`** matrix for non-MP4 outputs (**MULTI-10**/fixtures **MULTI-11** may still add probe JSON stubs for planner tests).

</domain>

<decisions>

## Implementation Decisions

### Matrix orchestration

- **D-01:** **Single domain funnel** selects **`plannedContainer`** and stream-copy feasibility for **single-video + audio-bearing** probes. **`planMediaOutputPrelude`** must **stop hardcoding **`plannedContainer: "mp4"`** for video**; it derives container + modality from the matrix (**feasibility first**, then prelude fields).
- **D-02:** Ordering stays **gates → codec bucket → planned container pairing**. Reuse structural gates (**multi-video**, **missing format_name**, **missing video codec_name**) from today; tighten only where the matrix assigns new tokens (**do not silence** regressions — **MULTI-12**).

### VP9 (**MULTI-03**)

- **D-03:** **VP9 → `video-copy-safe`** for at least one row: **`plannedContainer: "webm"`** with **`video-copy-vp9-webm-v1`** (**primary** unlock). **VP9 inside MP4** remains **disallowed** for copy-safe: if logic ever evaluates **MP4** as target for lone VP9, return **`fallback-required`** with explicit token **`video-fallback-vp9-mp4-disallowed-v1`** (not the generic **`video-fallback-non-h264-video`**).
- **D-04:** **Secondary row (optional in same phase if low-cost):** VP9 **`video-copy-safe`** with **`plannedContainer: "matroska"`** and **`video-copy-vp9-matroska-v1`**, iff fixtures + tests prove **stream copy** is the intended story (Matroska + VP9 is common). If implementation cost disagrees with planner, ship **WebM-only** VP9 row and defer Matroska VP9 explicitly in PLAN (**acceptable** roadmap interpretation: “one allowed pairing” satisfied by WebM).

### Theora (**MULTI-04**)

- **D-05:** **Lone theora video + eligible audio → `video-copy-safe`** with **`plannedContainer: "matroska"`** and **`video-copy-theora-matroska-v1`**. Canonicalize **`codec_name`** case-folding only (no synonym alias unless ffprobe warrants it — document if **`theora`** vs uncommon spellings observed).

### Extras (**MULTI-05**)

- **D-06:** **VP8** gets an **explicit **`fallback-required`** row** pending product allowlist — token **`video-fallback-vp8-matrix-explicit-v1`** (stable, searchable). Avoid silent optimism; **do not** mark **`video-copy-safe`** until PLAN + tests add an allow token.
- **D-07:** Other codecs **outside** MV1 matrix continue **conservative **`fallback-required`** via existing or slightly refined tokens** (maintain **`video-fallback-non-h264-video`** where it still expresses “no MP4 whitelist match” vs more specific **`video-fallback-*`** when pairing is forbidden).

### Typing **`reasonCodes`** (success path)

- **D-08:** Extend **`StreamCopyFeasibilityResult`** (or successor) success **`reasonCodes`** union to cover **non-MP4** copy-safe tokens (**`video-copy-vp9-webm-v1`**, **`video-copy-theora-matroska-v1`**, optional **`video-copy-vp9-matroska-v1`**) alongside existing **MULTI-12** literals **`video-copy-h264-mp4-v1`**, **`video-copy-hevc-mp4-v1`**, **`video-copy-av1-mp4-v1`** — **never rename** the MP4 triple without explicit regression work.

### Audio planned codec (**pre-Phase 03**)

- **D-09 (Claude’s discretion):** Keep **`plannedAudioCodec: "aac"`** default in prelude **unchanged** until **Phase **03** implements mux-specific audio selection (**MULTI-07**). Phase **02** owns **correct modality + container + copy tokens** only; callers must not rely on FFmpeg argv matching final WebM/Opus policy yet.

### inspect / summaries

- **D-10:** **`inspect`** (text + **`--json`**) consumes **`reasonCodes`** already present on **`OutputPlan`** — Phase **02** ensures new codes propagate; dedicated preservation bullet polish stays **MULTI-08**/Phase **04** unless PLAN finds a one-line omission bug.

### Claude’s Discretion

- **Matroska VP9:** Ship **alongside WebM VP9 only if fixtures + tests prove low overhead** — otherwise PLAN documents deferral citing **MULTI-03** wording (“at least one pairing”).
- **VP8 disposition:** Prefer **`fallback-required`** over **`unsupported`** so **`--allow-video-fallback`** pipeline remains reachable.

### Folded Todos

None (no **`todo match-phase`** run in-session).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope

- `.planning/ROADMAP.md` — Phase **02** goals, depends on Phase **01**, **MULTI-03**–**MULTI-05**.
- `.planning/REQUIREMENTS.md` — requirement IDs above; traceability table.
- `.planning/phases/01-multi-container-output-model-path-derivation/01-CONTEXT.md` — taxonomy **D-06** naming, **`plannedContainer`**, defer MP4 widen until matrix.

### Shipped feasibility + planning hooks

- `src/domain/stream-copy-feasibility.ts` — **`evaluateStreamCopyFeasibility`**, **`Mp4VideoStreamCopySuccessReasonCode`**, roadmap comment block.
- `src/domain/output-plan.ts` — **`planMediaOutputPrelude`**, **`planMediaOutput`**, **`PlannedContainer`**, **PHASE 02** comment at stub **`plannedContainer`**.

### Surfaces

- `src/app/inspect.ts`, `src/domain/inspect-summary.ts` — preservation / modality display.
- `test/domain/output-plan.test.ts` — VP9 / Theora cases will need updating from **`fallback-required`** to **`video-copy-safe`** where matrix applies.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable assets

- **`evaluateStreamCopyFeasibility`** today **short-circuits** non-**`mp4`** **`plannedContainer`** to **`video-fallback-non-mp4-output-not-supported-for-video-v1`** — Phase **02** replaces this with **codec × target-container** matrix once **`plannedContainer`** is chosen from probe facts.
- **`planMediaOutputPrelude`** currently fixes **`plannedContainer: "mp4"`** for all video — must become **matrix-driven**.

### Established patterns

- **Single video stream** + **format_name present** + **video codec_name present** before codec allowlist.
- **Reason tokens** as machine-stable slugs; user strings built in presentation layer.

### Integration risks

- **Implicit default output extension** already follows **`plannedContainer`** — new **`webm` / `matroska`** rows automatically affect default **`.webm` / `.mkv`** paths once prelude sets those literals.
- **Batch** pre-probes use prelude — matrix changes flow to batch allocations without duplicate logic **if prelude stays canonical**.

</code_context>

<specifics>

## Specific Ideas

Yolo synthesis favors **WebM-first VP9**, **Matroska-first theora**, **explicit VP8 fallback token**, strict **MULTI-12** hygiene on MP4 success literals, and **deferring opus/WebM FFmpeg argv** to **Phase **03** while fixing feasibility truth in **`domain`**.

</specifics>

<deferred>

## Deferred Ideas

- **Mux dry-run probes** (**FUT-02**) before asserting copy-safe.
- **HDR / sides data** caveat strings for VP9 (**MULTI-08**) — Phase **04**.
- **`--output-container`** user override (**FUT-01**).

### Reviewed todos

None appended.

</deferred>
