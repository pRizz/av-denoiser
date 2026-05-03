# Phase 02: Feasibility matrix — VP9, Theora, extras — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in **`02-CONTEXT.md`**.

**Date:** 2026-05-03  
**Phase:** 02 — Feasibility matrix — VP9, Theora, extras  
**Mode:** Yolo  
**Areas discussed:** Matrix orchestration, VP9 pairings, Theora pairing, MULTI-05 / VP8, typing success tokens, audio codec deferral, inspect surfacing

---

## Matrix vs prelude

| Option | Description | Selected |
| -------- | ----------- | -------- |
| Widen **`evaluateStreamCopyFeasibility`** only, keep prelude MP4 stub | prelude stays wrong until someone threads return value |  |
| **Drive prelude `plannedContainer` + modality from a single feasibility / matrix outcome** | One funnel; aligns batch + inspect + implicit paths | ✓ |

**Selection:** Yolo recommended — **matrix-driven prelude** (**D-01**).

---

## VP9 (**MULTI-03**)

| Option | Description | Selected |
| -------- | ----------- | -------- |
| Copy-safe VP9 → MP4 | Roadmap forbids unless explicitly reversed + tested |  |
| **Copy-safe VP9 → **`webm`** token **`video-copy-vp9-webm-v1`** | Satisfies roadmap “≥1 pairing” | ✓ |
| Also Matroska VP9 row immediately | Useful but optional — defer if PLAN scope tight (**D-04**) | (discretionary) |

**Selection:** Primary **VP9/WebM**; **explicit MP4 disallow** token **`video-fallback-vp9-mp4-disallowed-v1`** when pairing would be MP4 (**D-03**).

---

## Theora (**MULTI-04**)

| Option | Description | Selected |
| -------- | ----------- | -------- |
| WebM-first for Theora | Less native than Matroska for common demux |  |
| **`video-copy-safe` + `matroska` + `video-copy-theora-matroska-v1`** | Matches requirement wording | ✓ |

**Selection:** Yolo recommended (**D-05**).

---

## VP8 and extras (**MULTI-05**)

| Option | Description | Selected |
| -------- | ----------- | -------- |
| Treat VP8 as copy-safe without tests | Optimistic — reject |  |
| **`fallback-required` + explicit `video-fallback-vp8-matrix-explicit-v1`** | Honest until allow row exists | ✓ |
| `unsupported` modality | Breaks fallback CLI story for some users |  |

**Selection:** Yolo recommended (**D-06**).

---

## Success **`reasonCodes` typing

| Option | Description | Selected |
| -------- | ----------- | -------- |
| `readonly string[]` for all successes | Weak — loses exhaustiveness |  |
| **Extend tagged union alongside MP4 literals (no rename)** | **MULTI-12** safe | ✓ |

**Selection:** Yolo recommended (**D-08**).

---

## `plannedAudioCodec` before FFmpeg matrix (**MULTI-07**)

| Option | Description | Selected |
| -------- | ----------- | -------- |
| Switch prelude to opus for VP9/WebM immediately |Argv may lie vs Phase **03**|  |
| **Keep prelude `aac` until Phase **03** / **MULTI-07** implement mux audio policy** | Phase **02** = truth in modality/container/tokens only | ✓ |

**Selection:** Claude’s discretion captured as **D-09**.

---

## inspect / JSON polish

| Option | Description | Selected |
| -------- | ----------- | -------- |
| Full preservation bullet rewrite | Phase **08** scope |  |
| **Ensure new `reasonCodes` flow through existing surfaces** | Meets roadmap minimum for Phase **02** | ✓ |

**Selection:** Yolo recommended (**D-10**).

---

## Claude’s discretion

- **Matroska VP9** second row — ship only if cheap; otherwise PLAN-notes deferral.
- **VP8** — **`fallback-required`** over **`unsupported`** (**D-09** disposition).

---

## Deferred ideas

- **FUT-02** ffmpeg copy probes; **MULTI-08** HDR notes; **FUT-01** user container override (`02-CONTEXT.md` **Deferred** section).
