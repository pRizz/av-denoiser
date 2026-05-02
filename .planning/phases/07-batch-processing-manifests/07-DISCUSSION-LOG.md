# Phase 7: Batch Processing & Manifests - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 7 — Batch Processing & Manifests
**Mode:** Yolo
**Areas discussed:** CLI entry, Input expansion, Concurrency, Failure isolation, Collision-safe outputs, Manifest & summary, Dry-run parity

---

## CLI entry (`clean` vs dedicated command)

| Option | Description | Selected |
|--------|-------------|----------|
| Extend `clean` with multiple positionals | One command; risk of ambiguous parsing vs single-file |  |
| Dedicated `batch` subcommand | Keeps `clean` simple; clear help for multi-input | ✓ |

**User's choice:** Yolo recommendation engine — dedicated **`batch`** subcommand (**D-01**, **D-02**).
**Notes:** Aligns with Phase 5 explicit single-file **`clean`** contract.

---

## Input sources (paths, directory, glob)

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit paths only | Safest; misses BATCH-01 directory/glob story |  |
| Paths + `--from-dir` + `--glob` + confirmation flag | Matches STACK and BATCH-01 breadth | ✓ |

**User's choice:** Yolo — **`--glob`** with **`fast-glob`** + explicit acceptance flag; **`--from-dir`** with extension allowlist (**D-03**, **D-04**).
**Notes:** Pure expansion stays at boundary; core receives file list.

---

## Concurrency

| Option | Description | Selected |
|--------|-------------|----------|
| Always sequential | Simplest |  |
| Default sequential, optional parallelism | Matches STACK **`p-limit`** | ✓ |
| Unbounded parallel | Risky for Demucs/IO later |  |

**User's choice:** Yolo — default **`--concurrency 1`**, optional **`N`** with **`p-limit`** (**D-05**).

---

## Failure isolation

| Option | Description | Selected |
|--------|-------------|----------|
| Fail fast only | Poor BATCH-03 fit |  |
| Continue by default + `--fail-fast` | Matches BATCH-03 + CI option | ✓ |

**User's choice:** Yolo — continue-on-failure default; **`--fail-fast`** optional (**D-06**, **D-07**).

---

## Collision-safe outputs

| Option | Description | Selected |
|--------|-------------|----------|
| Error on collision | Safe but brittle for large batches |  |
| Numeric suffix disambiguation + optional `--output-dir` | Matches BATCH-04 | ✓ |

**User's choice:** Yolo — per-file naming mirrors **`clean`**; **`--output-dir`**; numeric suffix on clash (**D-08**, **D-09**).

---

## Manifest & reporting

| Option | Description | Selected |
|--------|-------------|----------|
| Human log only | Weak BATCH-05 |  |
| JSON manifest + aggregate `--json` / text summary | Audit-friendly + scripting | ✓ |

**User's choice:** Yolo — **`--manifest`** JSON artifact plus aggregate summary; **`batch --json`** (**D-10**, **D-11**).
**Notes:** Reuse doctor/tool discovery for versions.

---

## Dry-run parity

| Option | Description | Selected |
|--------|-------------|----------|
| Batch executes without dry-run path | Inconsistent |  |
| `batch --dry-run` plans all inputs | Matches BATCH-02 expectation | ✓ |

**User's choice:** Yolo — **`batch --dry-run`** per input (**D-12**).

---

## Claude's Discretion

- Manifest schema versioning, exact glob confirmation flag string, directory extension list maintenance.

## Deferred Ideas

- Guided multi-file flow; resume/checkpoint across interrupted batches.
