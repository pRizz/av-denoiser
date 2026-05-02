---
status: complete
phase: 05-final-media-output-reporting
source:
  - 05-01-SUMMARY.md
  - 05-02-SUMMARY.md
  - 05-03-SUMMARY.md
  - 05-04-SUMMARY.md
started: "2026-05-02T21:30:00.000Z"
updated: "2026-05-03T06:30:00.000Z"
---

## Current Test

[testing complete]

## Tests

### 1. Clean help documents --allow-video-fallback
expected: Running `bun run src/cli/main.ts clean --help` lists `--allow-video-fallback` with a description that matches the video/fallback policy (user can see the flag without reading source).
result: pass

### 2. Successful audio-only clean prints final report with Verified block
expected: With `ffmpeg` and `ffprobe` on PATH, use the repo fixture `test/fixtures/audio/speech-hush-with-brown-noise-cc0.wav` (documented in `test/fixtures/audio/README.md`). Run a real clean (no `--dry-run`): `bun run src/cli/main.ts clean "test/fixtures/audio/speech-hush-with-brown-noise-cc0.wav" --preset speech-light -o "<new-output-path>"`. Exit code 0. Stdout includes a **Verified:** heading followed by the report body that contains **Video:** and **Audio:** lines and a line **Verified: yes** (post-run verification succeeded).
result: pass

### 3. Successful clean with --json includes reportText
expected: Same successful execute as test 2 on `test/fixtures/audio/speech-hush-with-brown-noise-cc0.wav`, but add `--json`. Exit 0. Stdout is one JSON object with a string field `reportText` whose content includes **Video:** and **Verified:** (same reporting surfaced for machines).
result: pass

### 4. Video stream-copy-safe clean (conditional)
expected: For a small video file that `inspect` treats as having an executable clean plan with stream-copy-safe video (not blocked on fallback unless you pass `--allow-video-fallback`), run a real `clean` to a new output path. Exit 0; report shows **Video: copied** (not `n/a-audio-only`) and **Verified: yes**. If you lack a suitable sample, reply **skip** with a short reason.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Automated coverage

When `ffmpeg` and `ffprobe` are on `PATH`, `bun test` runs `test/app/clean-fixture-audio-integration.test.ts`: it checks the fixture file is present, runs `runCleanRequest` **dry-run** (`audio-only`, ordered steps), then a **full** `speech-light` execute into a temp `.m4a` and asserts `maybeReportText` contains `Video:`, `Audio:`, and `Verified: yes`. If either binary is missing, those cases are **skipped** (the “fixture exists” test still runs).

## Gaps

[none yet]
