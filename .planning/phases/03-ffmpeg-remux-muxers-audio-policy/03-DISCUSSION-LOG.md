# Phase 03: FFmpeg remux — muxers & audio policy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in **03-CONTEXT.md** — this log preserves the alternatives considered.

**Date:** 2026-05-03  
**Phase:** 03 — FFmpeg remux — muxers & audio policy  
**Mode:** Yolo  
**Areas discussed:** Explicit mux format, Per-container audio policy, Remux builder API, Dry-run parity, Fallback path, pcm edge policy

---

## Explicit mux format (`-f`) before output

| Option | Description | Selected |
|--------|-------------|----------|
| A | Always `-f` for mp4/webm/matroska | |
| B | `-f webm` / `-f matroska` only; omit `-f mp4` when `.mp4` suffices | ✓ |
| C | Rely on file extension only for all containers | |

**User's choice:** (yolo recommended default) **B**  
**Notes:** Meets **MULTI-06** visibility for WebM/MKV dry-runs without churning shipped MP4 argv.

---

## Per-container audio encoding defaults

| Option | Description | Selected |
|--------|-------------|----------|
| A | WebM Opus + Matroska Opus | |
| B | WebM Opus **`128k`**; Matroska + MP4 AAC **`192k`** | ✓ |
| C | Uniform bitrate across all AAC/Opus | |

**User's choice:** (yolo recommended default) **B**  
**Notes:** Aligns **`inspect-summary`** “MKV + AAC” / “WebM + Opus”; adds deterministic **opus** bitrate.

---

## Planner → argv coupling

| Option | Description | Selected |
|--------|-------------|----------|
| A | Infer muxer from `resolvedOutputPath` extension | |
| B | Pass `plannedContainer` into remux argv builder | ✓ |

**User's choice:** (yolo recommended default) **B**  
**Notes:** Typed traceability; avoids mismatch if explicit `-o` uses odd extensions.

---

## Dry-run vs execute parity

| Option | Description | Selected |
|--------|-------------|----------|
| A | Execute only gets `-f`; dry-run hides it | |
| B | Dry-run **`displayCommand`** includes same mux argv as execute | ✓ |

**User's choice:** (yolo recommended default) **B**

---

## `pcm_s16le` in matrix video remux

| Option | Description | Selected |
|--------|-------------|----------|
| A | Allow operator to select pcm for MKV/WebM remux defaults | |
| B | Exclude from default matrix video remux; intermediates unchanged | ✓ |

**User's choice:** (yolo recommended default) **B**

---

## Video fallback (`reencode-h264`)

| Option | Description | Selected |
|--------|-------------|----------|
| A | Extend Phase 03 with x265 prefs | |
| B | Keep **libx264** MP4 path; Phase 05 owns codec swap | ✓ |

**User's choice:** (yolo recommended default) **B**

---

## Claude's Discretion

- Opus bitrate default **128k** (vs lower/higher) left to PLAN/fixtures if refinement needed.

## Deferred Ideas

- User-authored audio codec overrides; Vorbis; explicit `-f mp4` escalation.
