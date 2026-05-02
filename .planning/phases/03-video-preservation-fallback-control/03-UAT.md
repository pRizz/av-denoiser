---
status: complete
phase: 03-video-preservation-fallback-control
source:
  - 03-01-SUMMARY.md
  - 03-02-SUMMARY.md
started: 2026-05-02T12:00:00Z
updated: 2026-05-02T13:17:57Z
---

## Current Test

[testing complete]

## Tests

### 1. Inspect classifies video as stream-copy-safe vs fallback-required
expected: Normal compatible MP4/H.264 inspect shows stream-copy-safe; incompatible cases show fallback-required with explicit reason text.
result: pass

### 2. Inspect shows preservation notes when the plan has them
expected: When preservation notes exist for the plan, text output includes a **Preservation notes** section (after reason codes) and JSON output includes the same structured notes (capped reasonably so output does not explode).
result: pass

### 3. Inspect respects --allow-video-fallback for fallback-required plans
expected: On an input whose plan is fallback-required, `inspect` without `--allow-video-fallback` stops with fallback-required (message tells you to pass the flag). The same `inspect` with `--allow-video-fallback` completes and shows the plan (you can preview the fallback path instead of being blocked).
result: pass

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
