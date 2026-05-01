---
phase: 01-bun-cli-foundation-trust-model
plan: 04
subsystem: cli-foundation
tags: [bun, typescript, doctor, exit-codes, cli]

# Dependency graph
requires:
  - phase: 01-03
    provides: Bun process runner and deterministic tool discovery adapter
provides:
  - Adapter-backed doctor command reachable from the CLI
  - Typed CLI request dispatch through application outcomes
  - Human-readable doctor report with required tools, optional tools, runtime information, and unchecked capabilities
  - User-facing exit-code and doctor documentation
affects: [phase-01, cli, doctor, trust-model, verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Typed app dispatcher between Commander parsing and command outcome rendering
    - Doctor report rendering from structured readiness facts
    - Documented stable exit-code contract for shell users

key-files:
  created:
    - src/app/doctor.ts
    - src/app/run-command.ts
    - src/domain/product.ts
    - docs/exit-codes.md
    - docs/doctor.md
    - test/app/doctor.test.ts
    - test/cli/command.test.ts
  modified:
    - src/cli/main.ts
    - src/cli/command.ts
    - src/cli/render.ts
    - src/index.ts

key-decisions:
  - "Kept Commander as syntax-only shell and routed executable behavior through runCliRequest outcomes."
  - "Rendered doctor output from structured DoctorReport facts instead of overclaiming capability readiness."
  - "Documented target/current Bun runtime information as informational so Phase 1 remains compatible with the local Bun runtime."

patterns-established:
  - "CLI parse failures become CommandOutcome-style diagnostics and ExitCode.invalidInput instead of uncaught Commander exits."
  - "Doctor command failures include named exit-code details in rendered output."
  - "Product metadata can live outside command syntax modules to keep deferred media-surface checks focused."

requirements-completed: [CLI-01, CLI-02, CLI-03, TRUST-04]
generated_by: gsd-execute-plan
lifecycle_mode: yolo
phase_lifecycle_id: 1-2026-05-01T21-21-03
generated_at: 2026-05-01T21:58:19Z

# Metrics
duration: 4 min
completed: 2026-05-01
---

# Phase 01 Plan 04: CLI Doctor and Exit Documentation Summary

**Adapter-backed doctor command with stable exit-code rendering, Bun runtime diagnostics, and user-facing behavior documentation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-01T21:54:08Z
- **Completed:** 2026-05-01T21:58:19Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Wired `doctor` through `runCliRequest`, `createDoctorReport`, and the existing tool discovery adapter so required tool gaps map to `missingTools`.
- Updated the CLI entrypoint so Commander parse failures render once and exit through `ExitCode.invalidInput`.
- Added structured doctor rendering with required tools, optional tools, target/current Bun runtime information, unchecked capabilities, warnings, and named failure exit codes.
- Added focused app and CLI tests, plus user-facing documentation for exit codes and doctor behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire doctor and exit outcomes into the CLI**
   - `d324f91` (test): add failing CLI doctor tests
   - `c8b69a7` (feat): wire doctor outcomes into CLI
2. **Task 2: Document exit codes, doctor behavior, and run full verification**
   - `4d47584` (docs): document doctor and exit behavior

## Files Created/Modified

- `src/app/doctor.ts` - Thin orchestration wrapper over `discoverTools`.
- `src/app/run-command.ts` - Typed request dispatcher returning command outcomes for default, help, and doctor requests.
- `src/cli/main.ts` - Top-level CLI parse, rendering, and exit handling.
- `src/cli/command.ts` - Commander syntax for default and `doctor` requests.
- `src/cli/render.ts` - Default/help/doctor/failure rendering, including runtime and exit-code details.
- `src/domain/product.ts` - Shared CLI product name.
- `src/index.ts` - Public export surface for the new app/render/product helpers.
- `docs/exit-codes.md` - Stable exit-code names, values, and current command behavior.
- `docs/doctor.md` - Required/optional tool readiness, runtime, unchecked capability, and command behavior docs.
- `test/app/doctor.test.ts` - App-level doctor outcome tests with fake discovery.
- `test/cli/command.test.ts` - CLI process smoke tests for default and invalid-input behavior.

## Decisions Made

- `runCliRequest` returns typed command outcomes only; doctor reports are attached to the outcome shape for rendering without adding a separate CLI-only request path.
- Missing optional tools remain warnings, while missing required `ffmpeg` or `ffprobe` facts drive `missingTools`.
- The target Bun version is rendered alongside the current runtime version but remains informational for Phase 1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Applied Biome and typecheck fixes before Task 1 commit**
- **Found during:** Task 1 (Wire doctor and exit outcomes into the CLI)
- **Issue:** New imports, formatting, and a readonly subprocess command array did not satisfy the repo verification gate on the first pass.
- **Fix:** Ran Biome check fixes on touched files and adjusted the CLI test helper to pass a mutable argv copy into `Bun.spawn`.
- **Files modified:** `src/app/run-command.ts`, `src/cli/main.ts`, `src/cli/render.ts`, `src/index.ts`, `test/app/doctor.test.ts`, `test/cli/command.test.ts`
- **Verification:** `bun run check:biome && bun run typecheck && bun test test/app/doctor.test.ts test/cli/command.test.ts` passed.
- **Committed in:** `c8b69a7`

**2. [Rule 3 - Blocking] Moved CLI product name out of command syntax module**
- **Found during:** Task 1 acceptance criteria
- **Issue:** The deferred-surface grep matched the product name `av-denoiser` in `src/cli/command.ts`, even though it was not a processing flag or media workflow surface.
- **Fix:** Added `src/domain/product.ts` and imported `cliName` into the command module so the syntax module remains free of deferred media-surface literals.
- **Files modified:** `src/domain/product.ts`, `src/cli/command.ts`, `src/index.ts`
- **Verification:** The Task 1 acceptance grep passed after the move.
- **Committed in:** `c8b69a7`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to satisfy the planned verification and acceptance gates. No media processing, prompts, presets, batch mode, or remux behavior was added.

## Issues Encountered

- The shell needed an `if ...; then ...; else test "$?" -eq 2; fi` form to verify the expected `--unknown` nonzero exit without stopping the command chain early.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. The "not available in this phase" copy and `not-checked-yet` capability rows are intentional Phase 1 honesty, not unwired behavior that prevents the plan goal.

## Threat Flags

None. The CLI argv, doctor rendering, and tool-discovery trust boundaries were already covered by the plan threat model and were implemented with the planned mitigations.

## Next Phase Readiness

Phase 1 is complete and ready for verification or Phase 2 planning. The CLI foundation now exposes stable exit behavior, adapter-backed doctor readiness, and repo-native verification coverage.

## Self-Check: PASSED

- Verified all created code, documentation, test, and summary files exist.
- Verified task commits `d324f91`, `c8b69a7`, and `4d47584` exist.
- Verified `bun run format && bun run verify`, `bun run cli`, `bun run src/cli/main.ts --help`, `bun run doctor`, and `bun run src/cli/main.ts --unknown` exit behavior.

---

*Phase: 01-bun-cli-foundation-trust-model*
*Completed: 2026-05-01*
