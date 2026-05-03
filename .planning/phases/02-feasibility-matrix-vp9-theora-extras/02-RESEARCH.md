# Phase 02 — Technical research

## RESEARCH COMPLETE

Phase **02** — feasibility matrix (**VP9**, **theora**, **VP8**) for local **ffprobe-shaped** probes and **`evaluateStreamCopyFeasibility`** / **`planMediaOutputPrelude`** integration.

### Findings for planning

1. **Structural gates** (`multi-video`, empty **`format.format_name`**, missing **`codec_name`** on the lone video stream) already live in **`stream-copy-feasibility.ts`**; keep tokens and **`plannedContainer: "mp4"`** for **`fallback-required`** structural paths so **`--allow-video-fallback`** and implicit **`.avdn.mp4`** behave like today (**CONTEXT D-02**).

2. **Codec ladder (single-video, format present):** canonicalize **`codec_name`** with **`trim` + lowercase**; **`h265` → `hevc`** (**existing** **`canonicalMp4CopyVideoCodec`**). Add buckets **`vp9`**, **`vp8`**, **`theora`** (no extra alias unless fixtures prove **`theorA`** variants).

3. **VP9 (**MULTI-03**):** Roadmap asks for **≥1 copy-safe pairing** → **`plannedContainer: "webm"`** + **`video-copy-vp9-webm-v1`**. **`video-copy-vp9-matroska-v1`** deferred in this milestone slice (DOCUMENT in PLAN backlog; **CONTEXT D-04** allows WebM-only satisfy).

4. **Theora (**MULTI-04**):** **`plannedContainer: "matroska"`** + **`video-copy-theora-matroska-v1`**.

5. **VP8 (**MULTI-05**):** **`fallback-required`** + **`plannedContainer: "mp4"`** + **`video-fallback-vp8-matrix-explicit-v1`** (never copy-safe).

6. **MP4 whitelist (**MULTI-12**):** unchanged **`video-copy-{h264,hevc,av1}-mp4-v1`** literals and branches.

7. **Execution coherence (non-blocking for matrix theory, blocking for **`bun run verify` + integration):** Implicit default suffix **`.webm`** / **`.mkv`** makes **`encodeDeliverableArgs`** provisional **`container === "webm"`** branch (**currently `-f mp4`**) produce **wrong mux vs extension**. **Mitigation scoped to Phase 02:** for **`plannedContainer === "webm"`** final encode segment, emit **`-f webm`** + **Opus** ( **`plannedAudioCodec: "opus"`** on **VP9/WebM copy-safe prelude only**) so **dry-run argv** and **non-regression** FFmpeg invocations remain honest. **CONTEXT D-09** is **narrow exception** documented in PLAN (Matroska Theora stays **AAC** until **Phase **03`/MULTI-07` refines**.

8. **Inspect / summaries:** **`buildInspectPreservation`** already reads **`plannedContainer`** / **`reasonCodes`** from **`OutputPlan`** — regression tests suffice unless strings hard-code MP4-only.

---

*Generated in-repo for **`/gsd-plan-phase`** (research step inlined; no researcher sub-agent).*
