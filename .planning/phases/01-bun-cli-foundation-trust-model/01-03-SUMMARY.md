---
phase: 01-bun-cli-foundation-trust-model
plan: 03
subsystem: cli-foundation
tags: [bun, typescript, adapters, doctor, process-runner]

# Dependency graph
requires:
  - phase: 01-02
    provides: Stable trust-model domain types for process commands and doctor reports
provides:
  - Single Bun.spawn argv-array process runner adapter
  - Deterministic tool discovery adapter with injectable PATH and process dependencies
  - Version-probe facts for required and optional external tools
  - Explicit not-checked-yet capability facts for future doctor hardening
affects: [phase-01, cli, trust-model, doctor, process-runner]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Bun-native effect adapters over pure trust-model domain types
    - Dependency injection for machine-independent adapter tests
    - Concise version parsing from bounded external tool probes

key-files:
  created:
    - src/adapters/process-runner.ts
    - src/adapters/tool-discovery.ts
    - test/adapters/tool-discovery.test.ts
  modified:
    - src/index.ts

key-decisions:
  - "Kept process execution behind one ProcessRunner adapter that only calls Bun.spawn with an executable plus argv array."
  - "Used injectable maybeWhich and runProcess dependencies so tool discovery tests never require local media tools."
  - "Reported future capability checks as explicit not-checked-yet facts instead of implying full tool readiness."

patterns-established:
  - "Adapters own Bun APIs while domain modules continue to own ProcessCommand and DoctorReport shapes."
  - "Doctor version probes capture only the first non-empty stdout or stderr line for concise diagnostics."
  - "Required and optional tool discovery share one definition-driven path with per-tool probe arguments."

requirements-completed: [CLI-02, TRUST-01, TRUST-04]
generated_by: gsd-execute-plan
lifecycle_mode: yolo
phase_lifecycle_id: 1-2026-05-01T21-21-03
generated_at: 2026-05-01T21:51:28Z

# Metrics
duration: 1 min
completed: 2026-05-01
---

# Phase 01 Plan 03: Safe Process Runner and Tool Discovery Summary

**Bun argv-array process execution with deterministic doctor tool discovery and explicit unverified capability facts**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-01T21:50:33Z
- **Completed:** 2026-05-01T21:51:28Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- Added `runProcessCommand` as the only effectful process runner adapter, using `Bun.spawn([command.executable, ...command.args])` with piped output, timeout support, ignored stdin by default, and typed result states.
- Added `discoverTools` with injectable `maybeWhich` and `runProcess` dependencies, defaulting to `Bun.which` and the safe process runner for real doctor execution.
- Added deterministic adapter tests covering missing required FFmpeg, available version parsing, optional missing tools, and explicit `not-checked-yet` capability facts.
- Exported the new adapter contracts from `src/index.ts` for later CLI/app integration.

## Task Commits

The TDD task was committed in RED/GREEN commits:

1. **Task 1: Add safe process runner and deterministic tool discovery**
   - `b333eee` (test): add failing tool discovery tests
   - `62790d1` (feat): implement safe tool discovery adapters

## Files Created/Modified

- `src/adapters/process-runner.ts` - Defines `ProcessResult`, `ProcessRunner`, and `runProcessCommand` around Bun argv-array subprocess execution.
- `src/adapters/tool-discovery.ts` - Discovers default tool definitions with `Bun.which`, runs bounded version probes, and returns structured doctor facts.
- `src/index.ts` - Exports the new adapter runner and discovery contracts.
- `test/adapters/tool-discovery.test.ts` - Proves tool discovery behavior with fake dependencies instead of machine-dependent media tools.

## Decisions Made

- Process execution remains in the imperative shell: adapters call Bun APIs, while domain modules continue to provide pure `ProcessCommand` and `DoctorReport` values.
- Version probes use concise first-line parsing from stdout or stderr so doctor facts avoid dumping full command output or environment data.
- Capability reporting stays humble in Phase 1: filters, effects, model cache, scripting pipes, and presets are represented as `not-checked-yet` facts for later validation plans.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Execution began with the RED test commit already present and GREEN adapter changes in the worktree. The existing work matched the plan, so it was verified and committed without restarting the task.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. The `not-checked-yet` capability facts are intentional Phase 1 trust-model outputs, not placeholders or unwired UI data.

## Threat Flags

None. The new process execution and tool discovery surfaces are the planned trust boundaries from the plan threat model and include the planned mitigations: argv-array spawning, `Bun.which` path reporting, concise version facts, explicit unchecked capability statuses, and bounded version probe timeouts.

## Next Phase Readiness

Ready for `01-04-PLAN.md`. Downstream work can now connect the CLI/app doctor flow to deterministic tool discovery while continuing to keep external execution behind the safe runner.

## Self-Check: PASSED

- Verified the summary file exists.
- Verified `src/adapters/process-runner.ts`, `src/adapters/tool-discovery.ts`, and `test/adapters/tool-discovery.test.ts` exist.
- Verified task commits `b333eee` and `62790d1` exist.
- Verified `bun test test/adapters/tool-discovery.test.ts` and the unsafe shell-pattern scan completed successfully.

---

*Phase: 01-bun-cli-foundation-trust-model*
*Completed: 2026-05-01*
---
phase: 01-bun-cli-foundation-trust-model
plan: 03
subsystem: cli-foundation
tags: [bun, typescript, adapters, doctor, process-runner]

# Dependency graph
requires:
  - phase: 01-02
    provides: ExitCode, ProcessCommand, ToolAvailability, and DoctorReport domain contracts
provides:
  - Bun.spawn argv-array process runner for external tool execution
  - Bun.which-backed doctor tool discovery with deterministic dependency injection
  - Version probe facts for required and optional external tools
  - Explicit not-checked-yet capability facts for future doctor checks
affects: [phase-01, cli, doctor, trust-model, external-tool-adapters]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Safe Bun process execution through a single adapter
    - Dependency-injected imperative shell tests for machine-independent tool discovery
    - Concise version-probe diagnostics without full environment or unbounded stderr capture

key-files:
  created:
    - src/adapters/process-runner.ts
    - src/adapters/tool-discovery.ts
    - test/adapters/tool-discovery.test.ts
  modified:
    - src/index.ts

key-decisions:
  - "Use resolved executable paths from Bun.which as the process executable so doctor facts show exactly which binary was probed."
  - "Keep Phase 1 capability rows as not-checked-yet facts rather than running filter/effect/model checks before later media phases."
  - "Expose ProcessRunner and ToolDiscoveryDeps through the library surface so adapter tests and later app orchestration can inject deterministic dependencies."

patterns-established:
  - "Process execution is centralized in runProcessCommand and uses Bun.spawn argv arrays without shell shortcuts."
  - "Doctor tool discovery accepts dependency injection for maybeWhich and runProcess so routine tests do not require local media tools."
  - "Version parsing records only the first non-empty stdout or stderr line for concise diagnostics."

requirements-completed: [CLI-02, TRUST-01, TRUST-04]
generated_by: gsd-execute-plan
lifecycle_mode: yolo
phase_lifecycle_id: 1-2026-05-01T21-21-03
generated_at: 2026-05-01T21:51:06Z

# Metrics
duration: 2 min
completed: 2026-05-01
---

# Phase 01 Plan 03: Tool Discovery Adapter Summary

**Safe Bun process runner and deterministic doctor discovery adapter for required and optional media-tool readiness facts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-01T21:48:49Z
- **Completed:** 2026-05-01T21:51:06Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- Added `runProcessCommand` as the single Bun subprocess adapter, using `Bun.spawn([command.executable, ...command.args])` with timeout and ignored-stdin support.
- Added `discoverTools` with default `Bun.which` lookup, safe version probes, required/optional tool facts, and explicit `not-checked-yet` capability rows.
- Added deterministic adapter tests for missing required tools, version parsing, optional missing tools, and capability humility.
- Exported the adapter contracts from `src/index.ts` for later CLI/app orchestration.

## Task Commits

The TDD task was committed atomically:

1. **Task 1: Add safe process runner and deterministic tool discovery**
   - `b333eee` (test): add failing tool discovery tests
   - `62790d1` (feat): implement safe tool discovery adapters

## Files Created/Modified

- `src/adapters/process-runner.ts` - Bun argv-array process runner and `ProcessResult` / `ProcessRunner` contracts.
- `src/adapters/tool-discovery.ts` - `Bun.which` plus safe version-probe discovery for required and optional tools.
- `src/index.ts` - Public export surface for the new adapter contracts.
- `test/adapters/tool-discovery.test.ts` - Machine-independent adapter tests using fake `maybeWhich` and `ProcessRunner` dependencies.

## Decisions Made

- Resolved tool paths are used as `ProcessCommand.executable` so doctor facts match the exact binary that was version-probed.
- Capability checks remain explicit `not-checked-yet` facts in Phase 1; richer FFmpeg filter, SoX effect, Demucs model, Audacity pipe, and MLT preset checks are deferred to later planned phases.
- Discovery tests use dependency injection instead of local executables, keeping routine verification independent of FFmpeg/SoX/Demucs/Audacity/Kdenlive installation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Applied Biome import and formatting fixes before the implementation commit**
- **Found during:** Task 1 (Add safe process runner and deterministic tool discovery)
- **Issue:** `bun run check:biome` failed after the first green implementation because new imports, test wrapping, and one unused type import did not satisfy Biome CI.
- **Fix:** Ran `bunx biome check --write` on changed files and removed the unused test import that Biome marked as an unsafe fix.
- **Files modified:** `src/adapters/tool-discovery.ts`, `test/adapters/tool-discovery.test.ts`
- **Verification:** `bun run check:biome && bun run typecheck && bun test` exited 0 with 19 passing tests.
- **Committed in:** `62790d1`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required for repo-owned verification. It did not change scope or add media processing beyond planned doctor discovery.

## Issues Encountered

- Biome required import organization and formatting after the initial green implementation; resolved before committing the implementation.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. The new capability statuses are intentional `not-checked-yet` diagnostic facts required by the plan, not unwired placeholder behavior.

## Threat Flags

None. The new process execution and tool-discovery trust boundaries were described in the plan threat model and implemented with the planned mitigations.

## Next Phase Readiness

Ready for `01-04-PLAN.md`. The CLI now has the safe process adapter and deterministic doctor discovery surface needed to wire richer doctor rendering and exit behavior without adding real media processing.

## Self-Check: PASSED

- Verified all created and modified code/test files exist.
- Verified summary file exists.
- Verified task commits `b333eee` and `62790d1` exist.
- Verified final `bun test test/adapters/tool-discovery.test.ts`, `bun run check:biome`, `bun run typecheck`, and `bun test` completed successfully with 19 passing tests.

---

*Phase: 01-bun-cli-foundation-trust-model*
*Completed: 2026-05-01*
