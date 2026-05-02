---
status: complete
phase: 08-optional-heavy-editor-integrations
source:
  - 08-01-SUMMARY.md
  - 08-02-SUMMARY.md
  - 08-03-SUMMARY.md
  - 08-04-SUMMARY.md
started: "2026-05-02T12:45:00.000Z"
updated: "2026-05-02T16:00:00.000Z"
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test

expected: |
  From a fresh shell in the repo, run `bun run doctor` once (no other av-denoiser processes required). The process exits successfully (exit code 0) and prints a doctor report with Runtime, Required tools, and Optional tools sections — no uncaught crash or hang.

result: pass

### 2. Doctor lists optional-heavy tools and FFmpeg ladspa probe

expected: |
  `bun run doctor` output includes an "Optional tools" section mentioning demucs, audacity, and melt (missing or installed). For FFmpeg, output reflects whether the ladspa filter is present (either a capability/check line or a "Missing capability for ffmpeg: ffmpeg.ladspa-filter"-style warning if your build lacks it).

result: pass

### 3. Demucs preset — missing vs installed

expected: |
  Run `bun run cli clean test/fixtures/audio/speech-hush-with-brown-noise-cc0.wav --preset speech-vocals-demucs --dry-run` from the repo root. If neither `demucs` nor `python3 -m demucs` is usable on your machine, you should get a tooling failure naming Demucs (`demucs`). If Demucs is installed, dry-run should succeed (exit 0) and the printed clean plan "Warnings" should include the Demucs advisory titles about first-run model downloads, heavy CPU/GPU runtime, and high RAM usage.

result: pass

### 4. Audacity macro requires explicit risk acceptance

expected: |
  Running `bun run cli clean test/fixtures/audio/speech-hush-with-brown-noise-cc0.wav --audacity-macro SomeMacro --dry-run` (without `--accept-audacity-pipe-risk`) fails during CLI parsing with an error that tells you `--audacity-macro` requires `--accept-audacity-pipe-risk` and points at `docs/doctor.md`.

result: pass

### 5. LADSPA CLI requires paired plugin path and label

expected: |
  Running `bun run cli clean test/fixtures/audio/speech-hush-with-brown-noise-cc0.wav --ladspa-plugin-path /tmp/nonexistent-but-valid-pathsyntax.so --dry-run` without `--ladspa-label` fails with an error stating you must pass `--ladspa-plugin-path` and `--ladspa-label` together (and mentioning doctor/LADSPA_PATH).

result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
