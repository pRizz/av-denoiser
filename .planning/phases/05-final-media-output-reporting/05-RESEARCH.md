# Phase 5 Research: Final Media Output & Reporting

## RESEARCH COMPLETE

**Phase:** 05 — Final Media Output & Reporting  
**Question:** What do we need to know to plan FFmpeg extraction → sequential audio pipeline → remux with reporting and verification?

---

## FFmpeg extraction (audio from video)

- Use **`ffmpeg`** with **`-map 0:v:0`** only when remuxing; for **audio extraction** map the selected audio stream: **`-map 0:a:<n>?`** or **`-map 0:<stream_index>`** matching **`OutputPlan.selectedAudioStreamIndex`** from existing probe typing.
- Prefer **PCM WAV** intermediate: **`-vn`**, **`-acodec pcm_s16le`**, **`-ar`** / **`-ac`** aligned with Phase 4 **`audioLayoutForStream`** defaults when extracting so SoX/FFmpeg steps see consistent layout.
- Avoid re-encoding video during extract — extraction command must be **audio-only output** (no video stream in extracted file).

## Remux (video copy + new audio)

- Pattern: **`ffmpeg -i <original_video> -i <processed_audio>`** with **`-map 0:v:0 -map 1:a:0`** (or appropriate audio map), **`-c:v copy`**, audio codec per **`plannedAudioCodec`** (e.g. **AAC** for MP4), **`-movflags +faststart`** optional discretion for MP4 UX.
- **`-shortest`** / **`-copy_unknown`** / disposition flags: default **no `-shortest`** when processed audio matches container duration; if drift appears in fixtures, planner locks explicit policy in implementation.
- **Subtitle / secondary audio:** CONTEXT **D-10** — omit non-primary streams from output; **`-map`** must **not** pull subtitles/extra audio unless explicitly out of scope (confirm omission in report).

## Post-run verification

- **Existence + size:** `stat` / `existsSync` + size **> 0**.
- **Probe:** reuse **`runFfprobeProbe`** on output; parse with existing **`MediaProbe`** types.
- **Duration:** compare **`format.duration`** (parsed float) input vs output; tolerance **`max(0.005 × duration_in, 0.5)`** seconds per **05-CONTEXT** (**D-08**).
- **Video copy claim:** when input modality was **`video-copy-safe`** and policy did not require re-encode, compare **first video stream** **`codec_name`** (and **`codec_tag_string`** if needed) between baseline input probe and output probe — must match for “copied” line in report.

## Integration with Phase 4 runner

- Phase 4 **`buildLogicalStepCommand`** assumes **`inputMediaPath`** / **`intermediateInPath`** — for video, **first step input** should be **extracted WAV path**, not original MKV/MP4, so **decode-demux** cost is isolated in one explicit **`ProcessCommand`** built in Phase 5 domain (not buried inside **`encode-deliverable`**).
- **Final encode-deliverable** step currently writes **`resolvedOutputPath`** — for video modality, either:
  - **Option A (recommended):** last step still produces **audio-only deliverable** file (AAC in M4A or WAV), then **remux** invocation merges into **`resolvedOutputPath`** (video container), **two-phase**: pipeline tail + remux.
  - **Option B:** teach **`encode-deliverable`** to invoke remux — couples concerns; avoid.

Planner adopts **Option A**: sequential pipeline unchanged through **audio-bearing deliverable**, then **separate remux argv** writes final multiplexed file.

## Reporting UX

- Structured fields → single **`renderCleanRunReport(summary: …)`** or extend **`CleanPlanSummary`** with **`executionReport`** post-success — TEXT checklist lines per **05-CONTEXT** specifics.

## Risks

- **AAC sample rate / priming** may shift duration slightly — epsilon accounts for sub-second drift.
- **Edit lists / negative timestamps** in MP4 — if probes fail on edge files, document known limitation; fixtures should stay **simple progressive MP4 + H.264 + AAC/PCM**.

---

## Validation Architecture

_Not applicable — Nyquist validation disabled for this workspace (`workflow.nyquist_validation: false`). Phase verification relies on **`bun test`** + CLI smoke criteria in each PLAN.md._
