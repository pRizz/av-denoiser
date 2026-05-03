---
phase: 03-ffmpeg-remux-muxers-audio-policy
plan: 02
subsystem: media
tags: [ffmpeg, clean, vp9]

key-files:
  created: []
  modified:
    - src/app/clean.ts
    - test/app/clean.test.ts

requirements-completed:
  - MULTI-06
  - MULTI-07
generated_by: gsd-execute-phase
phase_lifecycle_id: 03-2026-05-03T16-25-31
generated_at: 2026-05-03T17:30:00Z
---

# Phase 03 plan 02 summary

**`runCleanRequest` passes planner `plannedContainer` into remux via `plannedContainerForVideoRemux`; VP9 copy-safe dry-run test asserts `-f webm`, `libopus`, and **128k** in remux display; VP8 fallback test asserts the `libx264` remux argv omits `-f webm`.**

**Commit:** same as plan 01 (`eddae61` on main).
