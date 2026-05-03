---
phase: 03-ffmpeg-remux-muxers-audio-policy
plan: 01
subsystem: media
tags: [ffmpeg, remux, webm, matroska]

key-files:
  created: []
  modified:
    - src/domain/video-clean-argv.ts
    - test/domain/video-clean-argv.test.ts

requirements-completed:
  - MULTI-06
  - MULTI-07
generated_by: gsd-execute-phase
phase_lifecycle_id: 03-2026-05-03T16-25-31
generated_at: 2026-05-03T17:30:00Z
---

# Phase 03 plan 01 summary

**Remux argv now carries `plannedContainer`, emits `-f webm` / `-f matroska` before the output path, sets Opus **128k**, rejects `pcm_s16le` for typed video remux, and documents the mux/audio table in `video-clean-argv.ts`.**

**Commit:** feat: FFmpeg remux … (includes this plan’s domain + tests in monolithic commit with plan 02).
