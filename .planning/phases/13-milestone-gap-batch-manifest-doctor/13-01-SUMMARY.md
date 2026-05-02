---
phase: 13-milestone-gap-batch-manifest-doctor
plan: "01"
subsystem: cli
tags:
  - batch
  - doctor
  - manifest

requires:
  - phase: "07-batch-processing-manifests"
    provides: runBatchRequest manifest.maybeDoctorFacts field when discovery injected

provides:
  - Default batch CLI path wires discoverTools like doctor via runCliRequest
  - Discovery failures return CommandOutcome failure before manifest write

affects:
  - Phase 14 (depends on Phase 13 landing)

tech-stack:
  added: []
  patterns:
    - "CliRequestDeps.discoverTools ?? createDoctorReport passed only from runCliRequest batch branch"

key-files:
  created:
    - test/app/run-command.test.ts
  modified:
    - src/app/run-command.ts
    - src/app/batch.ts

key-decisions:
  - Hermetic runBatchRequest callers omit discoverTools unchanged (maybeDoctorFacts null)
  - Production CLI supplies default discovery without implicit default inside runBatchRequest

patterns-established:
  - "Mirror doctor default discovery at runCliRequest boundary for batch"

requirements-completed:
  - BATCH-05
  - BATCH-01
  - BATCH-02
  - BATCH-03
  - BATCH-04

generated_by: gsd-execute-plan
lifecycle_mode: interactive
phase_lifecycle_id: 13-2026-05-02T12-13-43
generated_at: "2026-05-02T18:30:00.000Z"

duration: ""
completed: "2026-05-02"
---

# Phase 13 Summary — Plan 01

Default **`batch`** path now passes **`discoverTools: deps.discoverTools ?? createDoctorReport`** from **`runCliRequest`**, so manifests record **`DoctorReport`** in **`maybeDoctorFacts`** for real CLI runs; **`discoverTools`** throws map to **`failure`** **`invalid-input`** before **`Bun.write`**.

## Performance

- **Tasks:** 3 (wiring, try/catch, tests)
- **Files modified:** 2 implementation + 1 new test file

## Accomplishments

- **`run-command.ts`** batch branch aligns with **`doctor`** injection pattern (**13-CONTEXT D-01**).
- **`batch.ts`** wraps discovery await so audit manifests are not written after probe failures (**13-CONTEXT D-03**).
- **`test/app/run-command.test.ts`** covers stub snapshot and discovery throw (**13-CONTEXT D-04**).

## Task commits

Single integration commit (no per-task atomic commits in this run):

1. **Wire + handle + tests** — implementation commit on branch **`main`**.

## Self-Check

- **`bun run verify`** exited **0** after changes.
