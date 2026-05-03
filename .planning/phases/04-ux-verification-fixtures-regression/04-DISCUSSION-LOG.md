# Phase 04: UX, verification, fixtures, regression — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in **04-CONTEXT.md** — this log preserves the alternatives considered.

**Date:** 2026-05-03  
**Phase:** 04 — UX, verification, fixtures, regression  
**Mode:** Yolo  
**Areas discussed:** Inspect bullets + JSON, fallback semantics & reports, verifier codec canonicalization, ffprobe stubs, MULTI‑12 regressions

---

## HDR / caveat parity on non-MP4 copy-safe bullets (**MULTI-08**)

| Option | Description | Selected |
|--------|-------------|----------|
| A | Keep VP9/Theora bullets short — HDR only mentioned for MP4 HEVC | |
| B | Add analogous best-effort copy caveats for WebM VP9 + Matroska Theora; manage **MAX_PRESERVATION_NOTES** | ✓ |
| C | Move all caveats outside inspect into docs only | |

**User's choice:** (yolo recommended default) **B**  
**Notes:** Matches REQUIREMENTS (**HDR / side-data** where copy applies).

---

## JSON surface for modality / tokens

| Option | Description | Selected |
|--------|-------------|----------|
| A | Add new top-level inspect keys for redundant human strings | |
| B | Require planners to audit existing **`plannedContainer`**, **`modality`**, **`reasonCodes`** for completeness (**MULTI-08**) | ✓ |

**User's choice:** (yolo recommended default) **B**

---

## `fallback-required` truthfulness (**MULTI-09**)

| Option | Description | Selected |
|--------|-------------|----------|
| A | Soften wording for operators | |
| B | Preserve strict inspect gate + honest clean summaries vs executed FFmpeg branch | ✓ |

**User's choice:** (yolo recommended default) **B**

---

## Verifier canonical codec helper (**MULTI-10**)

| Option | Description | Selected |
|--------|-------------|----------|
| A | Duplicate normalization logic inside **`clean-output-verify`** | |
| B | Extend **`stream-copy-feasibility`** (or shared module) canonical helper; **narrow alias**, evidence-backed | ✓ |

**User's choice:** (yolo recommended default) **B**

---

## Fixture strategy (**MULTI-11**)

| Option | Description | Selected |
|--------|-------------|----------|
| A | Rely solely on inlined JSON strings inside tests | |
| B | Add **`test/fixtures/ffprobe`** minimal stubs + reuse across tests (**grep-friendly**) | ✓ |

**User's choice:** (yolo recommended default) **B**

---

## MULTI‑12 regression style

| Option | Description | Selected |
|--------|-------------|----------|
| A | Only integration-level locks | |
| B | Freeze literal **`video-copy-*-mp4-v1`** success codes in targeted unit/integration tests | ✓ |

**User's choice:** (yolo recommended default) **B**

---

## Claude's Discretion

- Inspect caveat **wordsmithing** vs **caps**
- Fixture **filenames**

## Deferred Ideas

Captured in **04-CONTEXT.md** (**FUT‑***, **`vp9`/Matroska**, **Phase 05** codec swap).
