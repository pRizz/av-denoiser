---
phase: 01-bun-cli-foundation-trust-model
plan: 03
subsystem: testing
tags: [bun, trust, argv, tool-discovery, subprocess]

requires: []
provides:
  - Process runner integration smoke against live Bun binary via argv spawn
  - Tool discovery version probes built only through createProcessCommand
affects: [media pipeline execution, doctor, TRUST-01]

tech-stack:
  added: []
  patterns:
    - Version probes construct ProcessCommand exclusively through createProcessCommand
    - Regression tests capture argv shape (paths with spaces remain argv0)

key-files:
  created:
    - test/adapters/process-runner.test.ts
  modified:
    - src/adapters/tool-discovery.ts
    - test/adapters/tool-discovery.test.ts

key-decisions:
  - "Assert Bun `--version` stdout with a semver line because current Bun prints version only (no literal `bun`)."

patterns-established:
  - "Adapter tests use process.execPath for argv-only Bun spawn smoke."

requirements-completed: [TRUST-01]
generated_by: gsd-execute-plan
lifecycle_mode: yolo
phase_lifecycle_id: 01-2026-05-01T23-00-58
generated_at: 2026-05-01T23:59:00.000Z

duration: "~12min"
completed: 2026-05-01
---

# Phase 01 Plan 03: Bun CLI Foundation & Trust Model Summary

**Argv-only `Bun.spawn` remains the single execution path: a live Bun smoke test covers `runProcessCommand`, and tool discovery routes every version probe through `createProcessCommand` with a regression for spaced install paths.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-01T00:00:00Z (estimated)
- **Completed:** 2026-05-01T00:12:00Z (estimated)
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `runProcessCommand` integration smoke using `process.execPath` and `['--version']` with ignored stdin.
- Routed `discoverTools` version probes through `createProcessCommand` and fail-closed on unusable resolved executables.
- Extended tool-discovery tests to assert discrete argv arrays when the resolved tool path contains spaces.

## Task Commits

1. **Task 1: Process runner integration smoke (argv-only)** — `ca7abc3` (test)
2. **Task 2: Tool discovery injection + command shaping** — `fe4073b` (feat)

## Files Created/Modified

- `test/adapters/process-runner.test.ts` — argv-only Bun binary smoke (`--version`).
- `src/adapters/tool-discovery.ts` — `buildVersionProbeCommand` delegates to `createProcessCommand`.
- `test/adapters/tool-discovery.test.ts` — spaced-path probe argv regression; `ProcessCommand` capture assertions.

## Decisions Made

- Documented pragmatic assertion on Bun semver stdout instead of a case-insensitive `bun` substring, matching observed `bun --version` output.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Bun `--version` stdout omits literal `bun`**

- **Found during:** Task 1 (process-runner smoke expectations)
- **Issue:** Smoke test expecting `stdout` to contain `"bun"` failed; Bun emits a semver-only first line (e.g. `1.3.9`).
- **Fix:** Assert exit code `0` and semver-shaped first line (`/^\d+\.\d+/`).
- **Files modified:** `test/adapters/process-runner.test.ts`
- **Committed in:** `ca7abc3`

---

**Total deviations:** 1 auto-fixed (bug in test expectation)
**Impact on plan:** Preserves argv-only invocation and trustworthy success signal without flake or false negatives.

## Issues Encountered

None beyond the Bun stdout expectation noted above.

## User Setup Required

None.

## Next Phase Readiness

- TRUST-01 adapter guarantees remain regression-tested for subprocess argv shape ahead of FFmpeg/FFprobe orchestration.

## Self-Check: PASSED

- `[ -f ".planning/phases/01-bun-cli-foundation-trust-model/01-03-SUMMARY.md" ]` → FOUND
- `git log --oneline ca7abc3` → FOUND
- `git log --oneline fe4073b` → FOUND

---
_Phase: 01-bun-cli-foundation-trust-model_
_Completed: 2026-05-01_
