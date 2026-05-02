---
status: partial
phase: 07-batch-processing-manifests
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md
started: 2026-05-02T12:00:00Z
updated: 2026-05-02T19:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Batch subcommand help lists multi-file options
expected: `bun run cli batch --help` shows batch description and the options above.
result: pass

### 2. Glob patterns require `--accept-glob-risk`
expected: Running batch with `--glob` but without `--accept-glob-risk` fails fast with a clear error that tells you to pass `--accept-glob-risk` (see `--help`).
result: pass

### 3. Multiple `--input` paths run as one batch in `--dry-run`
expected: With at least two distinct fixture inputs (e.g. two WAVs under `test/fixtures/audio/`), `bun run cli batch --dry-run --input <a> --input <b> --preset speech-light` completes without invoking ffmpeg, reports per-file outcomes, and does not crash.
result: skipped

### 4. Batch manifest JSON is written with audit structure
expected: After a successful `--dry-run` batch, the manifest path you chose (default `./batch-manifest.json` or explicit `--manifest <path>`) exists and is valid JSON containing `schemaVersion` and per-file item entries with outcome-related fields (no empty document).
result: skipped

### 5. `--from-dir` includes supported media extensions
expected: Pointing `--from-dir` at a directory that contains known fixture media (e.g. `test/fixtures/audio/`), batch expands to those `.wav` files (and does not silently drop them). You see them reflected in the run (item count or dry-run plan).
result: skipped

### 6. `--fail-fast` stops after the first failing file
expected: In a batch where one file is invalid or guaranteed to fail early, with `--fail-fast`, processing does not continue through all remaining files after that failure (remaining items are skipped or not started as designed). Observable via fewer completed jobs than full batch length.
result: skipped

### 7. Batch exit code reflects worst per-file outcome
expected: When at least one batched file fails but the CLI handles the batch, the process exit code is non-zero and matches the documented “worst” outcome behavior (see README exit codes / batch summary), not success (0).
result: skipped

## Summary

total: 7
passed: 2
issues: 0
pending: 0
skipped: 5
blocked: 0

## Gaps

[none yet]
