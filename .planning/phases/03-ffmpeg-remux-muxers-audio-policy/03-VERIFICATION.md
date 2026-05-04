---
status: passed
phase: 03-ffmpeg-remux-muxers-audio-policy
generated_at: "2026-05-04T11:19:06.131Z"
---

# Phase 03 verification — FFmpeg remux: muxers & audio policy

Automated verification: **`bun run verify`** (`biome ci`, `tsc --noEmit`, `bun test`) — **222 pass**, **0 fail**, at closure (**Phase 08** execution **2026-05-04**).

## Must-haves vs evidence

### MULTI-06 (typed mux argv)

| Must-have | Evidence |
|-----------|----------|
| **`buildRemuxVideoWithProcessedAudioCommand`** emits **`-f webm`** immediately before resolved output path when **`plannedContainer: "webm"`** | `src/domain/video-clean-argv.ts` — `muxFormatArgs` spreads `"-f","webm"` |
| **`plannedContainer: "matroska"`** emits **`-f matroska`** likewise | Same — `muxFormatArgs` spreads `"-f","matroska"` |
| **MP4** path does **not** add **`‑f mp4`** (explicit container via extension defaults; aligns with **Phase 03 CONTEXT D-03**) | `muxFormatArgs` stays empty for **`mp4`** |
| Argv locked in fixtures | **`test/domain/video-clean-argv.test.ts`** — **`copy webm includes -f webm`**, **`copy matroska includes -f matroska`** |

### MULTI-07 (per-container audio + intermediate naming)

| Must-have | Evidence |
|-----------|----------|
| Remux **`plannedAudioCodec`**: **`aac`** → `-c:a aac -b:a 192k`; **`opus`** → `-c:a libopus -b:a 128k` | `src/domain/video-clean-argv.ts` `switch (params.plannedAudioCodec)` |
| **`encode-deliverable`** FFmpeg **`-f`** matches **`(plannedAudioCodec, plannedContainer)`** for processed audio (before final remux) | `src/domain/audio-pipeline-argv.ts` — `encodeDeliverableArgs` branches |
| **Intermediate** processed-audio basename in **`clean`** temp dir matches same matrix (**Phase 08** mux/filename trust) | **`pipelineAudioOutIntermediateBasename`** exported from **`audio-pipeline-argv.ts`**; **`src/app/clean.ts`** **`join(tempRoot | previewDir, …)`** for execute + dry-run previews |
| Unit regression | **`test/domain/audio-pipeline-argv.test.ts`** **`pipelineAudioOutIntermediateBasename matches encodeDeliverableArgs matrix`** |

## Requirement IDs

- **MULTI-06**: Muxer selection is explicit in FFmpeg argv where required (**WebM**/ **Matroska** **`-f`**) — verified above + **`video-clean-argv`** tests.
- **MULTI-07**: Final remux audio policy (**AAC**/ **Opus**) and pipeline encode consistency including **on-disk intermediate** naming — verified above (**closure:** **Phase 08** **`08-01-SUMMARY.md`** implements **`pipelineAudioOutIntermediateBasename`**).

## Human verification

None required (`status: passed`, automated-only).
