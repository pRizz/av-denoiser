# Phase 05 — Technical research: libx265 fallback remux

**Phase:** 05 — x265-preferred video re-encode  
**Question:** What must the planner know to swap **`fallback-required`** video re-encode from **AVC (`libx264`)** to **HEVC (`libx265`)** without breaking **MULTI-06/MULTI-07**?

## Findings

### FFmpeg argv (MP4 fallback)

- **`libx265`** replaces **`libx264`** on the **video re-encode** branch of **`buildRemuxVideoWithProcessedAudioCommand`**; **audio** stays **`MULTI-07`** (**AAC 192k** for **`plannedContainer: "mp4"`**).
- **Pixel format:** keep **`-pix_fmt yuv420p`** for broad device playback.
- **Rate control:** **CONTEXT** locks **`-crf 28`** as a tier comparable to prior **`libx264 -crf 23`**; **`-preset slow`** for quality-first CPU trade-off.
- **MP4 / QuickTime branding:** **`HEVC` in MP4** often needs **`-tag:v hvc1`** on the video stream so Apple-oriented players accept the Elementary Stream brand; place with other **`-c:v`** stream options (after **`-c:v libx265`** is typical).

### Typed mode name (`RemuxVideoStreamMode`)

- **`"reencode-h264"`** is misleading post-swap; rename to **`"reencode-hevc"`** everywhere (**`video-clean-argv.ts`**, **`clean.ts`**, tests, comments) per **05-CONTEXT D-08**.

### Verify / canonical codecs

- **`canonicalVideoCodecForVerify`** already maps **`h265` → `hevc`** (**`stream-copy-feasibility.ts`**). Add tests if **ffprobe** emits additional HEVC labels (e.g. **`hev1`**/**`hev`** variants) only when fixtures or docs support them (**04-CONTEXT** narrow-alias rule).

### Operator surfaces

- **Inspect** **`fallback-required`** notes should mention **HEVC re-encode** + **longer encode time** (roadmap success #4).
- **`clean --allow-video-fallback`**: extend help description to note **video is re-encoded (HEVC)** when fallback runs (**optional** copy length — keep within `--help` clutter budget).

### Security / trust boundary

- Unchanged from Phase **03:** argv remains derived from **typed** **`PlannedContainer`** / **`PlannedAudioCodec`**; no user filtergraphs.

## Validation Architecture

_Not applicable — `workflow.nyquist_validation` disabled for this repo run._

## RESEARCH COMPLETE

Research answers the planning questions above; no blocking unknowns for **`/gsd-execute-phase`**.
