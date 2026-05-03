---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 04-2026-05-03T17-20-12
generated_at: 2026-05-03T17:20:12.856Z
---

# Phase 04: UX, verification, fixtures, regression — Context

**Gathered:** 2026-05-03  
**Status:** Ready for planning  
**Mode:** Yolo

<domain>

## Phase Boundary

Deliver **operator-grade trust surfaces** end-to-end: **`inspect`** text + **`--json`** (**MULTI-08**–**MULTI-09**), **`verifyCleanOutput`** parity for multi-container stream-copy modalities (**MULTI-10**), **ffprobe JSON fixtures** enabling matrix/argv regressions without heavy binaries (**MULTI-11**), and **explicit regression locks** for MP4 **H.264 / HEVC(H.265) / AV1** copy-safe rows (**MULTI-12**). **`bun run verify`** MUST stay green once work lands.

**Depends on:** Phase **03** (**`-f` mux**, per-container audio) — **`clean`**/`dry-run`/argv builders already wired; this phase strengthens **truth in reporting** + **verification** + **fixture-backed tests**.

**Non-goals this phase:** **Phase 05** **`libx265`** swap (**default video re‑encode codec** swap), user-facing **`--planned-container`** override (**FUT-01**), Demucs/Audacity depth.

</domain>

<decisions>

## Implementation Decisions

### Inspect preservation notes & JSON coherence (**MULTI-08**)

- **D-01:** **`buildPreservationNotesFromPlan`** MUST add **HDR / transfer-function / side-data** caveat language for **WebM VP9** and **Matroska Theora** **video-copy-safe** branches, analogous in intent to the existing **MP4 HEVC** bullet — copy preserves compressed bytes; playback/color/HDR correctness is **best-effort** and player/container dependent.
- **D-02:** Respect **`MAX_PRESERVATION_NOTES`** (**5**) after adding bullets — if truncation drops older notes, prioritize **truth-critical** bullets (fallback reasons, HDR caveat once per modality, execution validation reminder). Document ordering rule in PLAN if trade-offs appear.
- **D-03:** **`InspectPlanSummary` / `--json`** already carries **`plannedContainer`**, **`modality`**, **`reasonCodes`** — PLAN MUST verify payloads stay **deterministic**, non-empty where roadmap expects **success/fallback** tokens visible to operators (**no silent omission** for **fallback-required** / **unsupported** paths).

### fallback-required and --allow-video-fallback (**MULTI-09**)

- **D-04:** Preserve the **inspect** UX contract from **Phase 03**: without **`--allow-video-fallback`**, **inspect** refuses **`fallback-required`** with the existing acknowledgment copy; with the flag, **inspect** returns **success** and surfaces **honest** modality + **`reasonCodes`** (**no watered-down claims**).
- **D-05:** **`clean`** reports (text + **`--json`**) MUST keep **`plannedModality`** / executed branch / **`claimedVideoCopied`** coherent with **MULTI roadmap** wording — if **video re‑encode** actually ran, summaries MUST NOT read like **pure stream-copy**.

### verifyCleanOutput canonical codecs (**MULTI-10**)

- **D-06:** Extend or replace **`canonicalMp4CopyVideoCodec`** with a **`stream-copy-feasibility`–owned verifier helper** (**single source of canonical names**) usable for **VP9**, **AV1**, **Theora**, and **HEVC** probe aliases (**e.g.** **`h265` ↔ `hevc`**, plausible **`vp9`/`vp09`/`av1`/`av01`** iff ffprobe emits them — **fixture-driven** locking).
- **D-07:** **`verifyCleanOutput`** compares **canonical** buckets only on **`plannedModality: "video-copy-safe"` && `claimedVideoCopied`** — unchanged guard; PLAN adds tests for **at least VP9(WebM)** and **Theora(MKV)** match/mismatch vectors using **tiny synthetic probes**.
- **D-08:** Prefer **narrow alias table** (**document unknowns as mismatches**) over silent broad equivalence — new aliases require **fixture or doc evidence**.

### Fixtures (**MULTI-11**)

- **D-09:** Add **`test/fixtures/ffprobe/`** stubs modeled after **`minimal-video-audio.json`**: minimally **(**1**)** lone **VP9** + eligible audio (**WebM-dest**) and **(**2**)** lone **Theora** + eligible audio (**Matroska/MKV dest**); keep JSON **tiny** + **privacy-free** (**no filesystem paths**, synthetic fields only).
- **D-10:** Fixture filenames + README cross-links SHOULD make **MATRIX row ↔ fixture** grep-friendly for planners (**naming mirrors reason codes slugs where practical**).

### MP4 regression locks (**MULTI-12**)

- **D-11:** Freeze **literally-named** **`Multi-12`** success **`reasonCodes`** (**`video-copy-h264-mp4-v1`**, **`video-copy-hevc-mp4-v1`**, **`video-copy-av1-mp4-v1`**) in **plan-or-verify tests** — changes to these literals require intentional REQUIREMENTS/`stream-copy-feasibility` review.
- **D-12:** Cover **inspect summary** strings / JSON snapshot spots for **three MP4 whitelist codecs** alongside **MULTI-10** output verify cases (**no duplicate heavyweight integration** unless PLAN finds gaps).

### Claude's Discretion

- **Exact caveat prose** wording for VP9/Theora (**tone match** inspect style; length within **MAX_PRESERVATION_NOTES**).
- **Granularity of `--json`** snapshot tests vs targeted unit assertions.
- **`theora`/VP9 alias list** sizing once ffprobe quirks are enumerated from fixtures/community samples.

### Folded todos

None (**no `todo match-phase 04`** preflight ran).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope

- `.planning/ROADMAP.md` — Phase **04** goal, success criteria.
- `.planning/REQUIREMENTS.md` — **MULTI-08**–**MULTI-12**.
- `.planning/PROJECT.md` — product charter (**trust**, **minimal recompression narrative**).

### Prior phase locks

- `.planning/phases/01-multi-container-output-model-path-derivation/01-CONTEXT.md`
- `.planning/phases/02-feasibility-matrix-vp9-theora-extras/02-CONTEXT.md`
- `.planning/phases/03-ffmpeg-remux-muxers-audio-policy/03-CONTEXT.md`

### Implementation touchpoints

- `src/domain/inspect-summary.ts` — **`buildPreservationNotesFromPlan`**, **`MAX_PRESERVATION_NOTES`**, **`outputPlanToInspectSummary`**.
- `src/domain/stream-copy-feasibility.ts` — **reason-code literals**, **canonical helpers** (**extend for verify**).
- `src/domain/clean-output-verify.ts` — **`verifyCleanOutput`**.
- `src/app/inspect.ts` — **`fallback-required`** gate (**`allowVideoFallback`**).
- `src/app/clean.ts` — **`verifyCleanOutput`** inputs, **`claimedVideoCopied`**.
- `src/cli/render.ts` — **`renderInspectPlanText`**.

### Tests & fixtures

- `test/domain/inspect-summary.test.ts`
- `test/domain/clean-output-verify.test.ts`
- `test/domain/output-plan.test.ts`, `test/domain/stream-copy-feasibility.test.ts`
- `test/app/clean.test.ts`
- `test/fixtures/ffprobe/*.json`

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable assets

- **`buildPreservationNotesFromPlan`** already branches **`mp4` / `webm` / `matroska`** — **HDR caveat** wired for **MP4** only today; VP9/Theora bullets are **parallel insertion points**.
- **`vp9WebmCopySafeProbe`** (**`clean.test.ts`**) proves **heavy integration harness** patterns — Phase **04** adds **fixture JSON** reuse for planners.
- **`canonicalMp4CopyVideoCodec`** currently **maps `h265` → `hevc`** — **narrow extension target** for **MULTI-10**.

### Established patterns

- **`InspectPlanSummary`** is stable JSON — extend tests rather than widening public fields unless REQUIREMENTS demands new keys (**MULTI-08** favors existing shape first).

### Integration points

- **`verifyCleanOutput`** imports **`canonicalMp4CopyVideoCodec`** — rename/share carefully to avoid cyclic imports (keep canonical table in **`stream-copy-feasibility`** or a small sibling module).

</code_context>

<specifics>

## Specific Ideas

**Yolo** synthesis prioritizes **symmetric HDR caveat coverage** across **copy-safe modalities**, **`verify`** codec canonicalization aligned with **`stream-copy-feasibility`**, **small ffprobe stubs** over **embedding large probe dumps**, and **literal reason-code regressions** for **MULTI-12**.

</specifics>

<deferred>

## Deferred Ideas

- **ffmpeg copy dry-run probes** (**FUT-02** — post **v1.1** backlog).
- **User-chosen preferred output container** (**FUT-01**).
- **`libx265`** default fallback path (**Phase 05**).
- **`vp9`/Matroska** matrix row (**backlog**, **Phase 02** deferred).

</deferred>

---

*Phase: 04-ux-verification-fixtures-regression*

*Context gathered: 2026-05-03*
