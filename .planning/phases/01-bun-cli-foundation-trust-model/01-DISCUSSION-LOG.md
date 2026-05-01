# Phase 01: bun-cli-foundation-trust-model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 01-bun-cli-foundation-trust-model
**Mode:** Yolo
**Areas discussed:** CLI default invocation, Doctor report surface, Exit code registry, Verification/lint scope, Safe process execution contract

---

## CLI default invocation

| Option | Description | Selected |
|--------|-------------|----------|
| Help-first | Bare CLI prints concise help and routes users to `doctor` and later commands | ✓ |
| Doctor-first | Bare CLI runs `doctor` immediately | |
| Placeholder only | Bare CLI exits with a static message and no Commander integration | |

**User's choice:** Help-first (recommended default for discoverability without surprising side effects)

**Notes:** Yolo pass; aligns with Phase 1 roadmap success criteria (install, help, preflight story).

---

## Doctor report surface

| Option | Description | Selected |
|--------|-------------|----------|
| Structured facts + human render | Domain holds `DoctorReport`; CLI renders readable sections | ✓ |
| Raw tool stdout | Pipe external CLI output straight to the terminal | |
| JSON-only | Machine-first doctor with no stable human layout | |

**User's choice:** Structured facts + human render

**Notes:** Keeps tests and later UX evolution anchored to typed facts rather than scraped strings.

---

## Exit code registry

| Option | Description | Selected |
|--------|-------------|----------|
| Single domain module | Named outcomes and numeric mapping live in one place (`exit-codes`) | ✓ |
| Per-command ad-hoc | Each command picks exit numbers independently | |
| Platform-default only | Rely on implicit Node/Bun defaults | |

**User's choice:** Single domain module

**Notes:** Satisfies TRUST-03 / documented exit categories without churn as media errors arrive.

---

## Verification / lint scope

| Option | Description | Selected |
|--------|-------------|----------|
| Product code + configs only | Biome/`verify` targets `src/`, tests, and manifests; exclude planning noise | ✓ |
| Entire repository | Lint every markdown tree including `.planning/` | |
| CLI-only | No Biome; TypeScript only | |

**User's choice:** Product code + configs only

**Notes:** Matches repo practice of keeping GSD metadata from breaking product CI.

---

## Safe process execution contract

| Option | Description | Selected |
|--------|-------------|----------|
| argv-only runner | One adapter wraps `Bun.spawn` with executable + argv array | ✓ |
| Shell with escaping | Build shell strings with careful quoting | |
| Direct scattered spawns | Call `spawn` from many modules | |

**User's choice:** argv-only runner

**Notes:** Non-negotiable for TRUST-01 and for safe future FFmpeg/SoX argv graphs.

---

## Claude's Discretion

- Exact help copy and minor script naming remain implementation choices as long as conventions stay Bun-idiomatic and documented in `package.json`.

## Deferred Ideas

None raised in this yolo pass — scope stayed within Phase 1.
