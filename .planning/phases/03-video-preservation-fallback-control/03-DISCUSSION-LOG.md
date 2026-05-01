# Phase 3: Video Preservation & Fallback Control - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 3 — Video Preservation & Fallback Control
**Mode:** Yolo
**Areas discussed:** Stream-copy feasibility classification, Fallback approval & CLI policy, Reason-code taxonomy & user-visible explanations, Conservative defaults when proof is incomplete

---

## Stream-copy feasibility classification

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative proof-only copy-safe | Emit `video-copy-safe` only when rules/matrix prove mux + stream-copy viability with planned audio path | ✓ |
| Optimistic copy-safe + warn | Keep broad copy-safe like Phase 2 stub with runtime FFmpeg failures | |
| Always fallback-required for video | Force user approval for any video job | |

**User's choice:** Conservative proof-only copy-safe (recommended default)
**Notes:** Yolo auto-selection — aligns with VIDEO-01 and replaces `phase-2-stub-video-copy-safe` once rules land.

---

## Fallback approval & CLI policy

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit flags + typed outcomes | Non-interactive policies (`allow` / `deny` / future `prompt`) with stable exit mapping | ✓ |
| Interactive prompts in Phase 3 | Blocking CLI questions before any run | |
| Silent FFmpeg attempts | Retry or infer policy from failures | |

**User's choice:** Explicit flags + typed outcomes (recommended default)
**Notes:** Interactive parity deferred to Phase 6 per roadmap layering.

---

## Reason-code taxonomy & user-visible explanations

| Option | Description | Selected |
|--------|-------------|----------|
| Extend Phase 2 `reasonCodes` + human summaries | Stable identifiers for tooling; readable inspect lines | ✓ |
| Prose-only explanations | No stable codes | |
| Embed FFmpeg stderr | Raw tool output as primary signal | |

**User's choice:** Extend Phase 2 `reasonCodes` + human summaries (recommended default)
**Notes:** Keeps continuity with MEDIA-05 / inspect outputs.

---

## Conservative defaults when proof is incomplete

| Option | Description | Selected |
|--------|-------------|----------|
| fallback-required when uncertain | Unknown matrix rows → `fallback-required` with explicit code | ✓ |
| Assume copy-safe until runtime | Preserve Phase 2 stub mindset | |
| Hard unsupported | Fail jobs that exceed built-in matrix | |

**User's choice:** fallback-required when uncertain (recommended default)
**Notes:** Avoids silent quality/container surprises.

---

## Claude's Discretion

- Exact v1 matrix coverage and optional bounded FFmpeg probe helpers (see CONTEXT.md).

## Deferred Ideas

- Phase 6 guided fallback UX; v2 MEDIA2 compatibility depth.
