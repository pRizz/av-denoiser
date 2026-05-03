# Phase 05: x265-preferred video re-encode - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in **05-CONTEXT.md** — this log preserves the alternatives considered.

**Date:** 2026-05-03  
**Phase:** 05 — x265-preferred video re-encode  
**Mode:** Yolo  
**Areas discussed:** Fallback container policy, libx265 argv defaults, mode rename & typing, inspect/JSON truthfulness, verification/tests, requirements ID

---

## Fallback output container (coordination with Phase 03)

| Option | Description | Selected |
|--------|-------------|----------|
| A | Keep **MP4-only** fallback re-encode; swap encoder only | ✓ |
| B | Allow **WebM/Matroska** video re-encode targets in this phase | |
| C | Defer fallback behavior to a later milestone | |

**User's choice:** [yolo recommended] **Option A** — matches **`03-CONTEXT`** **MP4 + libx264** recipe replacement, no new matrix escape paths.

**Notes:** **MULTI-06/07** audio+mux table unchanged for fallback **MP4**.

---

## libx265 encoder defaults (CRF / preset / tags)

| Option | Description | Selected |
|--------|-------------|----------|
| A | **`-crf 28`**, **`-preset slow`** (quality-first), **`-tag:v hvc1`** for MP4, **`yuv420p`** | ✓ |
| B | Preserve **`-crf 23`** literal (parity number; may overshoot quality vs x264 23) | |
| C | Match x264 speed with **`-preset fast`** or **`medium`** + tune CRF separately | |

**User's choice:** [yolo recommended] **Option A** — **`-preset slow`** leans toward **better efficiency at the same CRF** (higher quality / smaller files vs **`medium`**) at the cost of longer encodes; **`hvc1`** per roadmap.

**Notes:** Roadmap explicitly mentions **`hvc1`** / **`yuv420p`**.

---

## `RemuxVideoStreamMode` naming

| Option | Description | Selected |
|--------|-------------|----------|
| A | Rename **`reencode-h264`** → **`reencode-hevc`** everywhere | ✓ |
| B | Keep **`reencode-h264`** token; only change argv | |
| C | Generic **`reencode-video`** without codec hint | |

**User's choice:** [yolo recommended] **Option A** — **inspect** and code stay truthful.

---

## User-visible messaging & JSON

| Option | Description | Selected |
|--------|-------------|----------|
| A | Update strings/fields to **HEVC/libx265** wherever fallback re-encode is described | ✓ |
| B | Generic “video transcoded” without codec | |

**User's choice:** [yolo recommended] **Option A** — **MULTI-08/MULTI-09** coherence.

---

## Testing strategy

| Option | Description | Selected |
|--------|-------------|----------|
| A | Mock argv tests + **verifyCleanOutput** canonical **hevc/h265** coverage | ✓ |
| B | Heavy integration-only encodes | |

**User's choice:** [yolo recommended] **Option A** — matches existing **fixture-first** posture.

---

## Requirements row

| Option | Description | Selected |
|--------|-------------|----------|
| A | Add **`MULTI-13`** (or next ID) at **plan-phase** for traceability | ✓ |
| B | Leave TBD through implementation | |

**User's choice:** [yolo recommended] **Option A**.

---

## Claude's Discretion

- **`doctor`** one-liner about HEVC fallback cost — optional in Phase 05.
- **Preset/CRF** fine-tuning after first green tests.

## Deferred Ideas

- User-selectable **x264** fallback codec flag — future phase / backlog.
