---
status: complete
phase: 04-core-audio-pipeline-sox-cleanup
source:
  - 04-01-SUMMARY.md
  - 04-02-SUMMARY.md
  - 04-03-SUMMARY.md
  - 04-04-SUMMARY.md
started: "2026-05-02T12:00:00Z"
updated: "2026-05-02T20:00:00Z"
---

## Current Test

[testing complete]

## Tests

### 1. Root help lists clean
expected: Help output includes the `clean` subcommand with the preset-cleanup description (audio/video semantics as above).
result: pass

### 2. Clean dry-run prints a plan
expected: With ffmpeg and ffprobe on PATH, pick any local media file that `inspect` treats as a supported audio-only or executable clean plan (or use a tiny WAV you generate). Run `bun run src/cli/main.ts clean "<path>" --dry-run` (default `speech-light` preset). Exit code is success (0). Stdout shows the planned pipeline (preset, modality, ordered steps with display commands). No ffmpeg encode/remux or SoX steps are executed (dry-run stops after planning); the planned output file is not created by this run.
result: pass
notes: Verified with `ffmpeg`-generated `/tmp/avdn-uat.wav` (0.2s mono PCM); exit 0; output lists `speech-light`, `audio-only`, warnings, three ffmpeg display steps.

### 3. Invalid --preset surfaces actionable error
expected: `bun run src/cli/main.ts clean --preset not-a-preset /dev/null` fails before probing (invalid input). Stderr includes `Invalid --preset` and lists the three valid ids (`speech-light`, `speech-soft-sox`, `speech-vocals-demucs`). Exit code is invalidInput (2).
result: pass
notes: Exit 2; message lists all three preset ids.

### 4. Clean JSON dry-run
expected: Same as test 2, but add `--json` instead of plain text only. Exit 0. Stdout is a single JSON object (pretty-printed) that includes the preset, modality, pipeline steps, and paths consistent with the text plan.
result: pass
notes: Same input as test 2; single JSON object with `presetId`, `modality`, `steps`, paths aligned with text dry-run.

### 5. speech-soft-sox without SoX
expected: If neither `sox` nor `sox_ng` is on PATH, `bun run src/cli/main.ts clean "<path>" --preset speech-soft-sox --dry-run` fails with missing-tools and mentions sox/sox_ng. If you have SoX installed, reply skip with reason.
result: skip
notes: `sox_ng` available at `/opt/homebrew/bin/sox_ng`; dry-run exit 0 with SoX step in plan — branch “without SoX” not exercised on this machine.

## Summary

total: 5
passed: 4
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps

- **Test 5 (negative path):** Re-run in an environment without `sox`/`sox_ng` on PATH to confirm missing-tools messaging, or add a CI/job matrix step if desired.
