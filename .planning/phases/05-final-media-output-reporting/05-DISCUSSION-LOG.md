# Phase 5: Final Media Output & Reporting - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 5-Final Media Output & Reporting
**Mode:** Yolo (reopen — refresh decisions against landed code)
**Areas discussed:** Video + audio orchestration, Final report shape, Logging and errors, Post-run verification, Multi-stream policy

---

## Session notes

- `[auto-select]` Context exists — updating with synthesized decisions.
- `[auto-select]` Plans exist — continuing with context capture, will replan after. _(informational — roadmap shows Phase 5 plans executed; no replan triggered by this reopen.)_
- `[auto-select]` Selected all gray areas: Video + audio orchestration, Final report shape, Logging and errors, Post-run verification, Multi-stream policy.

---

## Video + audio orchestration

| Option | Description | Selected |
|--------|-------------|----------|
| Extend `clean` with modality-driven extract → pipeline → remux | Single command, reuses Phase 4 runner and plans | ✓ |
| New subcommand only for video | Clearer help split but duplicates orchestration | |
| Shell out to one mega FFmpeg filtergraph | Conflicts with sequential step model and typed presets | |

**User's choice:** _(yolo — recommended default)_ Extend `clean` with extract/remux orchestration reusing the sequential pipeline.
**Notes:** Align remux and codec choices with `OutputPlan` and Phase 3 fallback flags.

---

## Final report shape

| Option | Description | Selected |
|--------|-------------|----------|
| Typed RunReport + human text renderer | Satisfies VIDEO-04 / TRUST-02 without v2 AUTO-01 scope | ✓ |
| Full machine JSON report in Phase 5 | Useful for scripts but expands schema work | |
| Raw FFmpeg log as report | Fails TRUST-02 | |

**User's choice:** _(yolo — recommended default)_ Core typed report object with human-readable default output; defer dedicated JSON run-report schema to v2 unless trivial.

---

## Logging and errors

| Option | Description | Selected |
|--------|-------------|----------|
| Structured outcome + capped stderr excerpt on failure | Matches Phase 4 `MAX_CLEAN_STDERR_SNIPPET` pattern | ✓ |
| Full stderr always | Too noisy; violates product tone | |
| Silent stderr | Un-debuggable | |

**User's choice:** _(yolo — recommended default)_ Structured messages first; optional verbosity for deeper diagnostics.

---

## Post-run verification

| Option | Description | Selected |
|--------|-------------|----------|
| Exists + ffprobe JSON + duration epsilon + copy checks when claimed | Meets TRUST-03 | ✓ |
| File exists only | Too weak for video-copy promise | |
| Deep checksum / perceptual tests | Out of phase scope | |

**User's choice:** _(yolo — recommended default)_ Lightweight probe-based verification with explicit failure outcomes.
**Notes:** Duration tolerance implemented as `DURATION_VERIFY_RELATIVE_FRACTION` / `DURATION_VERIFY_MIN_ABS_SECONDS` in `src/domain/clean-output-verify.ts`.

---

## Multi-stream policy

| Option | Description | Selected |
|--------|-------------|----------|
| Primary video + one cleaned audio; other streams dropped with report lines | Narrow v1 aligned with roadmap single-file focus | ✓ |
| Preserve all streams | Complex mapping; MEDIA2 territory | |
| Interactive stream picker | Phase 6 UX | |

**User's choice:** _(yolo — recommended default)_ Drop extras by default; document in report; defer multi-track to v2.

---

## Claude's Discretion

_Remaining FFmpeg edge-case argv and evolving ffprobe field proofs for copy — prefer regression fixtures over speculative locking._

## Deferred Ideas

- AUTO-01 JSON run reports, batch summaries, guided UX, optional integrations — captured in CONTEXT.md `<deferred>`.
