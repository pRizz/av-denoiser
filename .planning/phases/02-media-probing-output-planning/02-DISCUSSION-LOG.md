# Phase 2: Media Probing & Output Planning - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 02-media-probing-output-planning
**Mode:** Yolo
**Areas discussed:** FFprobe ingestion model, Output path safety, Plan classification surface, Deliberate codec and container defaults

---

## FFprobe ingestion model

| Option | Description | Selected |
|--------|-------------|----------|
| Strict boundary parsing | Zod (or narrow parsers) into domain types; core never sees raw JSON | ✓ |
| Permissive loose typing | Carry partial records with optional fields everywhere | |
| Hybrid | Strict for streams/format; bag-of-fields for tags only | |

**User's choice:** Strict boundary parsing into explicit domain types with narrow optional tolerance only for documented-optional FFprobe fields.

**Notes:** [auto] Aligns with Phase 1 D-08/D-09 parse-at-boundaries decisions.

---

## Output path safety

| Option | Description | Selected |
|--------|-------------|----------|
| Opt-in overwrite | Require `--force` or explicit confirmation for existing outputs | ✓ |
| Always overwrite | Simple but violates safety story | |
| Interactive prompt default | Deferred to Phase 6 guided flows | |

**User's choice:** Collision-safe defaults with explicit force to overwrite; no silent in-place source replacement.

**Notes:** [auto] Implements MEDIA-04 intent for v1.

---

## Plan classification surface

| Option | Description | Selected |
|--------|-------------|----------|
| Tagged union + text summary | Machine-readable plan types with stable human-readable rendering | ✓ |
| Text-only | Faster to ship but weakens later automation | |
| JSON-only first | Awkward for casual CLI users | |

**User's choice:** Tagged union in the functional core plus human-readable CLI summary; JSON parity can follow in Phase 6 if not bundled in Phase 2.

**Notes:** [auto] Satisfies MEDIA-05 readability while keeping planners script-ready.

---

## Deliberate codec and container defaults

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit plan fields | Codec/container/default audio stream rule coded in domain types | ✓ |
| FFmpeg implicit defaults | Minimal code, contradicts VIDEO-05 | |
| User-config file only | Too heavy for Phase 2 scope | |

**User's choice:** Typed output plan fields with documented defaults and clear stream-selection rule for multiple audio tracks.

**Notes:** [auto] Implements VIDEO-05 at the planning layer.

---

## Claude's Discretion

- CLI flag naming and pretty-print formatting for probe/plan output.

## Deferred Ideas

- Guided confirmation flows (Phase 6).
- Deep multi-track and container-matrix policies (v2 / later phases).
