# Phase 01: Multi-container output model & path derivation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in **01-CONTEXT.md** - this log preserves the recommendation engine selections.

**Date:** 2026-05-03  
**Phase:** 01 - Multi-container output model & path derivation  
**Mode:** Yolo  
**Areas discussed:** Planned container type, Path derivation, Feasibility boundary, Reason-code taxonomy, Integration order  

---

## Planned container literals

| Option                                                       | Description                                                                                              | Selected |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | -------- |
| mp4 \| matroska \| webm only                               | Drops **wav**, breaks pcm WAV deliverables.                                                              |          |
| mp4 \| matroska \| webm \| wav (extend union)               | Adds **webm**; keeps **wav** for existing **`pcm_s16le`** pipeline. Matches MULTI wording + shipped code. | ✓        |
| Split `PlannedMuxContainer` vs WAV deliverable type        | Clearer taxonomy; more refactor than Phase **01** needs.                                                |          |

**User's choice:** (yolo recommended) Extend union with **`webm`**, retain **`wav`**.  

**Notes:** Roadmap wording stresses **Matroska/WebM** alongside **MP4**; **`wav`** remains a real deliverable encoding path (**`audio-pipeline-argv`**).

---

## Default path derivation vs `plannedContainer`

| Option                                                | Description                                                                                  | Selected |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| Keep input-extension-only default forever             | Fails roadmap **MULTI-02**.                                                                  |          |
| Drive implicit `.avdn.<ext>` from `plannedContainer`   | Implements success criterion **2**; explicit `-o` unchanged.                                   | ✓        |
| Two-phase path (probe guess before full plan)       | Extra complexity - avoid unless deadlock; prefer unify via **`planMediaOutput`** output.       |          |

**User's choice:** (yolo recommended) Implicit default derives extension from **`plannedContainer`**; explicit output paths untouched.  

**Notes:** Prefer **`.mp4`** when **`plannedContainer === "mp4"`** even when input was **`.mov`**.

---

## Live behavior during Phase 01 (feasibility not widened)

| Option                                                                   | Description                                    | Selected |
| ------------------------------------------------------------------------ | ---------------------------------------------- | -------- |
| Immediately derive MKV/WebM from probe                                   | Widens feasibility / matrix - Phase **02**.    |          |
| Keep **`plannedContainer: "mp4"`** for all current video-bearing probes | Matches “no widen feasibility yet”; test-only scaffolding for other literals. | ✓        |

**User's choice:** (yolo recommended) **MP4-only** live defaults; scaffolding tests prove **`.mkv` / `.webm`** derivation when plan supplies those literals.

---

## Reason-code taxonomy (draft only)

| Option                         | Description                                     | Selected |
| ------------------------------ | ----------------------------------------------- | -------- |
| Ad hoc tokens                  | Works short term; brittle for matrix.           |          |
| Document **`video-copy-*` / `video-fallback-*` naming conventions** | For Phase **02** rows (**MULTI-03+**); no semantic change in Phase **01** feasibility. | ✓        |

**User's choice:** (yolo recommended) Encode convention in CONTEXT + PLAN; **do not** rename existing **MP4** success tokens in Phase **01** without PLAN + **MULTI-12** regressions.

---

## Claude's Discretion

- Default extension when **`plannedContainer === "mp4"`** and input is **MOV/MKV/WebM**: **bias `.mp4`**.

---

## Deferred Ideas

- Optional split of mux vs WAV deliverable types later.
- **FUT-01** preferred container override CLI flag (`REQUIREMENTS.md`).
