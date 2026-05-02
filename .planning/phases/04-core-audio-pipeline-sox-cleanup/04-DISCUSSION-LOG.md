# Phase 4: Core Audio Pipeline & SoX Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `04-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 4-Core Audio Pipeline & SoX Cleanup
**Mode:** Yolo
**Areas discussed:** Execute CLI shape, modality gate / scope, presets & transparency, per-step tuning, sequential intermediates, FFmpeg vs SoX split, warnings, trust continuity

---

## Execute CLI surface

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated subcommand (`clean`-style) + keep `inspect` plan-only | Clear separation of planning vs execution; matches phased roadmap and later Phase 6 flag parity | ✓ |
| Extend `inspect` with `--execute` | Fewer verbs; blends concerns and confuses scripting | |
| Implicit default action on bare input | Surprise risk; violates explicit CLI trust model | |

**User's choice:** _Yolo recommendation — Dedicated subcommand, inspect remains plan-only_
**Notes:** `[auto]` Q: "How should users run Phase 4 processing?" → Selected dedicated execute subcommand.

---

## Modality gate (audio-only for Phase 4 execute path)

| Option | Description | Selected |
|--------|-------------|----------|
| Allow execute only when `OutputPlan.modality === "audio-only"` | Honors ROADMAP / MEDIA-01 wording; pushes video/remux complexity to Phase 5 | ✓ |
| Allow video inputs by silently extracting audio | Blurs MEDIA-02 boundary; hides user expectation about eventual video outputs | |
| Block all non-audio codecs regardless of modality | Duplicate logic vs `planMediaOutput` | |

**User's choice:** _Yolo recommendation — Strict audio-only modality gate_
**Notes:** `[auto]` Reuse Phase 2/3 modality union outcomes for stable exit mapping.

---

## Preset authoring

| Option | Description | Selected |
|--------|-------------|----------|
| Typed preset registry + Zod in repo (`src/domain/`) | Matches parse-at-boundaries guidance; forbids arbitrary filtergraphs | ✓ |
| Ship JSON presets on disk without types | Faster iteration but violates safety/stack guidance | |

**User's choice:** _Yolo recommendation — Typed in-repo presets_
**Notes:** `[auto]` Small named set expansion is implementation detail post-planning.

---

## Intermediate format defaults

| Option | Description | Selected |
|--------|-------------|----------|
| WAV PCM s16le between steps | Best FFmpeg ↔ SoX interoperability; obvious lossless-ish default | ✓ |
| FLAC between steps | Smaller disk; slightly more branching for tool support | |

**User's choice:** _Yolo recommendation — WAV PCM default_
**Notes:** `[auto-lossless]` FLAC allowed only with lossless parity + tests (`04-CONTEXT` D-08).

---

## FFmpeg vs SoX responsibilities

| Option | Description | Selected |
|--------|-------------|----------|
| FFmpeg decode/encode + filter substeps; SoX optional scripted substeps with discovery fallback | Mirrors STACK recommendations and existing doctor tool list | ✓ |
| SoX-first with FFmpeg wrappers only | Heavier ergonomics vs container codecs | |

**User's choice:** _Yolo recommendation — FFmpeg core + optional SoX_
**Notes:** `[auto]` **D-11** denies silent omission of billed SoX steps without explicit degraded preset labeling.

---

## Per-step tuning surface (PIPE-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Bounded preset knobs via explicit CLI fields / enums | Matches v1 “practical options” wording; avoids config language creep | ✓ |
| Arbitrary KV map to FFmpeg | Out of scoped requirements (`REQUIREMENTS` Out of Scope) | |

**User's choice:** _Yolo recommendation — Bounded typed knobs_

---

## Warnings taxonomy (PIPE-06)

| Option | Description | Selected |
|--------|-------------|----------|
| Structured `pipelineWarnings[]` with stable IDs surfaced pre-run | Gives honest risk communication independent of FFmpeg stderr | ✓ |
| Only stderr/heuristics post-run | Fails PIPE-06 spirit and TRUST readability goals | |

**User's choice:** _Yolo recommendation — Structured pre-run warnings_

---

## Claude's Discretion

- Exact preset catalog, FFmpeg filter literals, tempfile policy, minimal JSON shape for `--json` summaries on execute/dry-run.

## Deferred Ideas

- Demucs/Audacity/MLT (Phase 8), video execution + richer reports (Phase 5), guided UX (Phase 6), full external config authoring (AUTO-04 / v2).
