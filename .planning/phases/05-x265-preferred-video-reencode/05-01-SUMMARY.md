---
phase: 05-x265-preferred-video-reencode
plan: "01"
subsystem: ffmpeg-remux
tags: libx265, MULTI-13, fallback-required

requires:
  - phase: "04"
    provides: verify + inspect harness
  - phase: "03"
    provides: mux/audio argv wiring
provides:
  - MULTI-13 requirement + traceability in REQUIREMENTS / ROADMAP
  - RemuxVideoStreamMode `reencode-hevc` + libx265 argv (`-crf 28`, `-preset slow`, `-tag:v hvc1`, `-pix_fmt yuv420p`)
  - clean.ts remux wiring + argv tests

key-files:
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - src/domain/video-clean-argv.ts
    - src/app/clean.ts
    - test/domain/video-clean-argv.test.ts
    - test/app/clean.test.ts

verification: bun run verify (Biome, tsc, bun test) — green after Wave 2 completes
---

# Phase 05 Plan 01 — Summary

**MULTI-13** traceability added; **`buildRemuxVideoWithProcessedAudioCommand`** emits **libx265** defaults for **`reencode-hevc`**; **`runCleanRequest`** passes **`reencode-hevc`** on **`fallback-required`**; tests assert **libx265** / no **libx264** in fallback argv.
