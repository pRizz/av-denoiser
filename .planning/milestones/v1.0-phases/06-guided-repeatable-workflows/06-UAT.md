---
status: complete
phase: 06-guided-repeatable-workflows
source:
  - 06-01-SUMMARY.md
  - 06-02-SUMMARY.md
  - 06-03-SUMMARY.md
started: "2026-05-02T12:00:00Z"
updated: "2026-05-02T22:00:00Z"
---

## Current Test

[testing complete]

## Tests

### 1. CLI help mentions guided workflow
expected: "`av-denoiser --help` lists `guided` and explains it as an interactive / prompted clean path (and preferably points to equivalent non-guided usage)."
result: pass

### 2. Guided exits clearly without a TTY
expected: "When stdin is not a terminal (for example piping empty input or running under CI), `guided` exits quickly with an explicit message that interactive mode requires a TTY—not a silent hang or stack trace."
result: pass

### 3. Guided dry-run shows equivalent argv
expected: "In the guided workflow, choosing the dry-run or preview path shows the equivalent command-line argv/tokens needed to replay the same clean non-interactively, with sensible quoting."
result: pass

### 4. Interactive guided prompts collect a clean configuration
expected: "In a real terminal, `guided` runs through `@clack`-style prompts (input path, preset/noise/options as implemented); answers lead to coherent selections consistent with manual `clean` flags."
result: pass

### 5. Confirmed guided run reports progress then outcome
expected: "After confirming execution (non-dry-run), a real run shows progress feedback (spinner or step milestones during probe/pipeline/finalization) and ends with an outcome/report line consistent with non-guided `clean`."
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
