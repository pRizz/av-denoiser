---
phase: 08-gap-closure-phase-03-remux-pipeline-trust
plan: "01"
subsystem: clean-pipeline-intermediates
tags: MULTI-06, MULTI-07, gap-closure, GSD

requires: []
provides:
  - **`pipelineAudioOutIntermediateBasename`** aligned with **`encodeDeliverableArgs`** container extensions
  - Execute + dry-run preview paths in **`clean.ts`** using that helper (no hardcoded **`.mp4`** for pipeline audio out)

key-files:
  created: []
  modified:
    - src/domain/audio-pipeline-argv.ts
    - src/app/clean.ts
    - test/domain/audio-pipeline-argv.test.ts

requirements-completed:
  - MULTI-06
  - MULTI-07

generated_by: gsd-execute-plan
lifecycle_mode: yolo
phase_lifecycle_id: 08-2026-05-04T11-14-07
generated_at: "2026-05-04T11:25:00.000Z"
completed: "2026-05-04"
---

# Phase 08 Plan 01 — Summary

Intermediate **pipeline-audio-out** basenames now match deliverable mux intent: **`pipelineAudioOutIntermediateBasename(plannedAudioCodec, plannedContainer)`** in **`audio-pipeline-argv.ts`** (documented to stay in sync with **`encodeDeliverableArgs`**), wired in **`clean.ts`** for both execute and preview. Unit tests cover every **`encodeDeliverableArgs`** tuple; **`rg 'pipeline-audio-out\.mp4' src/`** is empty.

## Verification

- `bun run verify` — exit **0** (**222** tests pass at closure)

## Files

| Path | Change |
|------|--------|
| `src/domain/audio-pipeline-argv.ts` | **`PIPELINE_AUDIO_OUT_STEM`**, **`pipelineAudioOutIntermediateBasename`** |
| `src/app/clean.ts` | **`join(..., pipelineAudioOutIntermediateBasename(...))`** |
| `test/domain/audio-pipeline-argv.test.ts` | Matrix test vs **`encodeDeliverableArgs`** |

## Task commits

- (See repo history for Wave 1 Phase 08 code commit.)
