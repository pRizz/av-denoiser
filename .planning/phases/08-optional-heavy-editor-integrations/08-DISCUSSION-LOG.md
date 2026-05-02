# Phase 8: Optional Heavy & Editor Integrations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 8 — Optional Heavy & Editor Integrations
**Mode:** Yolo
**Areas discussed:** Demucs adapter & discovery, Demucs warnings & preflight, Audacity opt-in & automation surface, Audacity diagnostics, Kdenlive/MLT & melt scope, Pipeline typing & batch parity, Doctor & tooling facts

---

## Demucs adapter & discovery (TOOL-03)

| Option | Description | Selected |
|--------|-------------|----------|
| External CLI only (`demucs` / `python3 -m demucs`) | Matches STACK; no repo Python | ✓ |
| Repo-owned Python wrapper package | Rejected by stack / AGENTS constraints |  |
| Optional cloud separation API | Out of scope |  |

**User's choice:** Yolo recommended default — external CLI argv-only invocation.
**Notes:** Typed logical step; two-stems/vocal isolation aligned with STACK; explicit opt-in only.

---

## Demucs warnings & preflight (TOOL-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Warn on dry-run + before execute + manifest | Maximum visibility for slow/heavy runs | ✓ |
| Warn only after failure | Insufficient for trust/product promise |  |
| Silent except stderr | Violates TOOL-04 |  |

**User's choice:** Yolo recommended default — structured warnings and batch manifest parity.

---

## Audacity opt-in & automation (TOOL-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit opt-in + pipe preflight + documented-scriptable subset | Balances power with security/GUI reality | ✓ |
| Default-on when installed | Rejected — security and reliability |  |
| Omit Audacity for v1 | Would miss TOOL-05/06 |  |

**User's choice:** Yolo recommended default — opt-in gated automation with honest scripting limits.

---

## Audacity diagnostics (TOOL-06)

| Option | Description | Selected |
|--------|-------------|----------|
| Categorized structured diagnostics (doctor + plan errors) | Actionable user remediation | ✓ |
| Generic "Audacity failed" | Rejected |  |

**User's choice:** Yolo recommended default.

---

## Kdenlive / MLT scope (TOOL-07, TOOL-08)

| Option | Description | Selected |
|--------|-------------|----------|
| FFmpeg/LADSPA-first; optional `melt` for maintainable MLT compatibility | Matches STACK “direct FFmpeg” priority | ✓ |
| Require Kdenlive/melt for some presets | Rejected — TOOL-08 requires graceful fallback |  |
| Full editor integration | Out of phase scope |  |

**User's choice:** Yolo recommended default.

---

## Pipeline typing & batch parity

| Option | Description | Selected |
|--------|-------------|----------|
| Extend `LogicalPipelineStep` + sequential runner; PCM interchange | Consistent with Phase 4 | ✓ |
| Ad hoc scripts per integration | Rejected — trust model |  |

**User's choice:** Yolo recommended default — document concurrency caution for heavy steps.

---

## Doctor & tooling facts

| Option | Description | Selected |
|--------|-------------|----------|
| Extend optional doctor facts without overclaiming pipe readiness | Honest preflight | ✓ |
| Report "ready" without checks | Rejected |  |

**User's choice:** Yolo recommended default.

---

## Claude's Discretion

- Demucs knob surface, default model, segment flags, `.mlt` strategy depth, Audacity timeouts.

## Deferred Ideas

- DeepFilterNet-style backends (v2 ADV), audition snippets, full MLT project import UX — see CONTEXT.md deferred section.
