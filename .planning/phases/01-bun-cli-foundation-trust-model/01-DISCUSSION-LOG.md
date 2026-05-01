# Phase 1: Bun CLI Foundation & Trust Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01T21:21:03.063Z
**Phase:** 01-Bun CLI Foundation & Trust Model
**Mode:** Yolo
**Areas discussed:** CLI Surface, Trust and Safety Model, Architecture, Verification

---

## CLI Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Bun-first CLI foundation | Establish package metadata, executable entrypoint, help, and `doctor` command without implementing denoise behavior yet. | yes |
| Media features immediately | Start by wiring real denoise/media behavior before the trust shell exists. | no |

**User's choice:** Auto-selected recommended default.
**Notes:** Phase 1 scope is foundation and trust model only; media processing starts in later phases.

---

## Trust and Safety Model

| Option | Description | Selected |
|--------|-------------|----------|
| Single argv-array process runner | Route all external tool execution through a safe abstraction that never shells user-provided values. | yes |
| Inline process spawning per adapter | Let each adapter call subprocess APIs directly. | no |
| Shell command strings | Build shell commands as strings for convenience. | no |

**User's choice:** Auto-selected recommended default.
**Notes:** This matches Bright Builds guidance and prevents media-tool command construction from becoming unsafe.

---

## Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Functional core / imperative shell | Pure domain modules for decisions, thin adapters for CLI/filesystem/process I/O. | yes |
| CLI-centric implementation | Keep most logic close to the command handlers. | no |

**User's choice:** Auto-selected recommended default.
**Notes:** This keeps Phase 1 logic easy to test before external media tools are introduced.

---

## Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Full repo-native verification baseline | Add format/lint, typecheck, tests, and aggregate check scripts in Phase 1. | yes |
| Minimal smoke test only | Add only a basic CLI run check and defer type/test rigor. | no |

**User's choice:** Auto-selected recommended default.
**Notes:** Phase 1 requirement TRUST-04 requires verification coverage for pure planning logic, parsers, command builders, and probe fixtures.

---

## Claude's Discretion

- Exact package script names, module filenames, and help text wording.
- Exact human-readable `doctor` formatting, provided it remains testable.

## Deferred Ideas

- Real media probing, video preservation planning, audio cleanup, remuxing, guided workflows, batch mode, and heavy integrations are deferred to their mapped roadmap phases.
