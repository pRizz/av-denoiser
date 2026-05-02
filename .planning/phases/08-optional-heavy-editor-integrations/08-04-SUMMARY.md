# Phase 8 Plan 04 — Summary

**Completed:** 2026-05-01

- `src/adapters/tool-discovery.ts`, `src/adapters/ffmpeg-ladspa-probe.ts` — Demucs discovery (binary + `python3 -m demucs` fallback), FFmpeg `ladspa` filter probe, optional `melt` version probe.
- `src/app/doctor.ts` — invokes extended optional discovery (Demucs, `ladspa`, `melt`) from `tool-discovery`.
- `src/domain/audio-pipeline-plan.ts`, `src/domain/audio-pipeline-argv.ts`, `src/app/clean.ts` — runnable FFmpeg `ladspa` step with validated `--ladspa-plugin` / `--ladspa-label` / control strings (`applyIntegrationsToLogicalSteps`).
- `docs/doctor.md` — TOOL-08 operator guidance (FFmpeg-first when `melt` or plugins are absent).
- `test/adapters/tool-discovery.test.ts`, `test/domain/audio-pipeline-argv.test.ts`, `test/domain/audio-pipeline-plan.test.ts` — ladspa argv, integration ordering, Demucs fallback.

Verification: `bun run verify`.
