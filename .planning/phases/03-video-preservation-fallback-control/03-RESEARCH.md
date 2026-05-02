# Phase 3 Research: Video Preservation & Fallback Control

**Phase:** 03 — Video Preservation & Fallback Control  
**Requirement IDs:** VIDEO-01, VIDEO-02, VIDEO-03  
**Question:** What do we need to know to PLAN honest stream-copy vs fallback-before-FFmpeg semantics?

---

## Summary

Phase 3 replaces the Phase 2 `video-copy-safe` stub with **conservative, test-backed rules**: we only emit `video-copy-safe` when the **planned Phase 2 output defaults** (`plannedContainer: "mp4"`, AAC audio rewrite) justify **copying the existing primary video elementary stream without transcoding** into that MP4. Anything outside a **narrow whitelist** becomes `fallback-required` with structured `reasonCodes` and copy for **user-facing explanations** derived from stable codes—not raw FFmpeg stderr. Non-interactive **deny-by-default** for fallbacks surfaces as `CommandOutcome` `fallback-required` (exit family already exists) until **`--allow-video-fallback`** is passed on `inspect`.

---

## FFmpeg / probing facts relevant to v1 planning

### Stream copy semantics (planning horizon)

For remux workflows, **video stream copy** (`-c:v copy`) succeeds only when the **target mux format accepts the multiplexed codec bitstream**. MP4/isom historically has broad but not universal overlap with common distribution codecs.

### ffprobe signals we trust in v1

- **Per-stream**: `codec_type`, `codec_name`, `disposition.default`, stable `index` ordering.
- **Container hint**: `format.format_name` (often a comma-separated list of candidate demuxer names).

We **do not** call FFmpeg during planning in this phase (CONTEXT bias: deterministic rules first). Optional bounded probes belong to Claude’s discretion and are **explicitly deferred** unless rules prove insufficient.

### Conservative whitelist (execution choice for v1)

**Single default video stream** (exactly **one** `codec_type === "video"` stream after probe):

- **`codec_name` normalized to lowercase is `h264`** → Allowed as **eligible** for **`video-copy-safe` × planned MP4** in the starter matrix **when** probe includes enough format metadata (`format.format_name` present) to acknowledge a normal container probing path. Exact extra container constraints stay minimal: treat missing `format_name` as **`fallback-required`** so unknown inputs never become silent copy-safe.

**Multiple video streams** → **`fallback-required`**: deterministic policy “not modeled in v1” (aligns CONTEXT D-04 / MEDIA2 deferral).

**Any other observed `codec_name` on the lone video stream** (e.g. `hevc`, `vp9`, `av1`, `prores`, `mpeg2video`, …) → **`fallback-required`**: incompatible with the **no-transcode-first** × **planned mp4 output** stance without deeper matrix work.

**Rationale:** `h264` in MP4 is the **safest baseline** aligned with VIDEO-05’s current default `plannedContainer === "mp4"`. Widening codecs without fixture-backed proof would violate CONTEXT **D-03** conservative posture.

---

## Reason-code taxonomy (planning-stable)

Prefixes keep Phase 3 codes grep-friendly beside Phase 2 codes:

| Code | Typical modality | Intended meaning |
|------|------------------|------------------|
| `video-copy-h264-mp4-v1` | `video-copy-safe` | Passed narrow single-stream `h264` + metadata gate + planned mp4 default path |
| `video-fallback-non-h264-video` | `fallback-required` | Single video codec not in whitelist |
| `video-fallback-multi-video-streams` | `fallback-required` | >1 video stream |
| `video-fallback-missing-format-metadata` | `fallback-required` | Missing `format.format_name` needed for conservative container visibility |
| (retain Phase 2) `phase-2-stub-audio-only` | `audio-only` | No video streams |
| (retain Phase 2) `no-audio-stream` | `unsupported` | No audio |

**Phase 3 removes** reliance on **`phase-2-stub-video-copy-safe`** except during migration tests if needed—it should disappear once VIDEO-01 is implemented.

Human-facing lines derive from **`reasonCodes` + modality** inside `inspect-summary` / CLI render—not from externalized locale files in v1.

---

## Inspect / CLI semantics (VIDEO-03)

Aligned with CONTEXT **D-08 / D-10**:

- **`inspect` default**: still prints the planned modality and reasons for transparency.
- If modality is **`fallback-required`** and **`--allow-video-fallback` absent** → return **`failure` + `{ kind: "fallback-required", message: ... }`** so automation gets **exit 6**.
- **`--allow-video-fallback` present** → `success` carrying the summary (explicit opt-in acknowledging the downgrade path).

Interactive confirmation is **explicitly deferred** (Phase 6).

---

## Codebase anchors

| Area | Role |
|------|------|
| `src/domain/media-probe.ts` | Add `format.format_name?: string` to schema/type |
| `src/domain/output-plan.ts` | Replace stub modality with feasibility hook |
| `src/domain/stream-copy-feasibility.ts` (new) | Pure gate for single-video + codec + minimal format metadata |
| `src/domain/inspect-summary.ts` | Add user-facing preservation lines keyed by codes/modality |
| `src/domain/cli-request.ts` / `src/cli/command.ts` | New boolean flag threaded into `inspect` |
| `src/app/inspect.ts` | VIDEO-03 policy gate after planning |
| `test/fixtures/ffprobe/minimal-video-audio.json` | Extend with realistic `format_name` |

---

## Validation architecture

Nyquist artifacts **disabled** in project config (`nyquist_validation: false`) — no `03-VALIDATION.md` synthesis required for this run.

---

## RESEARCH COMPLETE

Blockers: **none.**
