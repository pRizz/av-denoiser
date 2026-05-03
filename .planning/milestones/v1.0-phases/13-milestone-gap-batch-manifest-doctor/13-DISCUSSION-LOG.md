# Phase 13: Milestone Gap — Batch manifest doctor snapshot - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 13-milestone-gap-batch-manifest-doctor
**Mode:** Yolo
**Areas discussed:** Default discovery wiring, Snapshot payload shape, Discovery failure handling, Regression test strategy

---

## Default discovery wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Wire at `runCliRequest` only | Pass `deps.discoverTools ?? createDoctorReport` into `runBatchRequest` for the `batch` case; direct `runBatchRequest` callers unchanged. | ✓ |
| Default inside `runBatchRequest` | Omitting `discoverTools` always calls `createDoctorReport` — breaks hermetic unit tests unless all tests inject a no-op/stub. |  |

**User's choice:** Wire at **`runCliRequest`** (recommended default — preserves test doubles and matches **`doctor`** injection pattern).

**Notes:** Phase 7 tests call **`runBatchRequest`** without **`discoverTools`**; **`maybeDoctorFacts`** correctly stays **null** in those cases.

---

## Snapshot payload shape

| Option | Description | Selected |
|--------|-------------|----------|
| Full `DoctorReport` | Serialize the complete discovery report the doctor path would surface. | ✓ |
| Trimmed subset | Only tool versions — less JSON, weaker audit parity. |  |

**User's choice:** Full report (recommended — satisfies **BATCH-05** audit intent and reuses existing types).

---

## Discovery failure handling

| Option | Description | Selected |
|--------|-------------|----------|
| Fail batch before file loop | No per-file work if discovery throws; avoid incomplete audit manifests. | ✓ |
| Null facts + continue | Weaker **BATCH-05**; hides discovery failure in default path. |  |

**User's choice:** Fail fast on discovery throw (recommended).

---

## Regression test strategy

| Option | Description | Selected |
|--------|-------------|----------|
| `runCliRequest` integration with stub `discoverTools` | Assert `maybeDoctorFacts` non-null when batch runs through default deps wiring. | ✓ |
| Only E2E with real discovery | Flaky/slow; unnecessary for proving wiring. |  |

**User's choice:** Integration-style test with injectable **`discoverTools`** stub plus documentation that production passes **`createDoctorReport`**.

---

## Claude's Discretion

- Placement of error handling around the discovery call (left to planner).

## Deferred Ideas

- Optional flag to skip doctor snapshot for performance — deferred to backlog / future phase.
