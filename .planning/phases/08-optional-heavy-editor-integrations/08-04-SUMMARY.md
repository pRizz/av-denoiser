---
phase: 08-optional-heavy-editor-integrations
plan: "04"
requirements-completed:
  - TOOL-07
  - TOOL-08
generated_by: inline-verifier
lifecycle_mode: yolo
phase_lifecycle_id: 12-2026-05-02T11-44-26
generated_at: "2026-05-02T12:20:00.000Z"
---

# Phase 8 Plan 04 — Summary

**Completed:** 2026-05-01

- `src/adapters/tool-discovery.ts`, `src/adapters/ffmpeg-ladspa-probe.ts` — Demucs discovery (binary + `python3 -m demucs` fallback), FFmpeg `ladspa` filter probe, optional `melt` version probe.
- `src/app/doctor.ts` — invokes extended optional discovery (Demucs, `ladspa`, `melt`) from `tool-discovery`.
- `src/domain/audio-pipeline-plan.ts`, `src/domain/audio-pipeline-argv.ts`, `src/app/clean.ts` — runnable FFmpeg `ladspa` step with validated `--ladspa-plugin` / `--ladspa-label` / control strings (`applyIntegrationsToLogicalSteps`).
- `docs/doctor.md` — TOOL-08 operator guidance (FFmpeg-first when `melt` or plugins are absent).
- `test/adapters/tool-discovery.test.ts`, `test/domain/audio-pipeline-argv.test.ts`, `test/domain/audio-pipeline-plan.test.ts` — ladspa argv, integration ordering, Demucs fallback.

Verification: `bun run verify`.
