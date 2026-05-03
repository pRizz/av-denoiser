# av-denoiser

## What This Is

`av-denoiser` is a **shipped v1** TypeScript/Bun CLI for cleaning noisy audio in audio or video files. It probes input media, expands explicit presets into ordered FFmpeg/SoX/external-tool steps (optional Demucs, Audacity scripting, FFmpeg **ladspa** when available), remuxes **cleaned audio** while **avoiding video recompression whenever planning says stream-copy-safe**, and records batch runs in **JSON manifests** with **doctor**/discovery snapshots.

Casual users can run **`guided-clean`**; operators use **`clean`** and **`batch`** with flags and repeatable **`argv`** equivalence.

## Core Value

Users can pass an audio or video file through a guided denoise pipeline and get a cleaned output **while minimizing unnecessary video recompression**.

## Requirements

### Validated — v1.0 (frozen)

Full checklist (42 REQ IDs × `[x]` + traceability **Complete**) is archived:

- [.planning/milestones/v1.0-REQUIREMENTS.md](.planning/milestones/v1.0-REQUIREMENTS.md)

High-level confirmations:

- ✅ **CLI**: **`bun install`** surface, **`doctor`**, stable exit taxonomy, **`inspect`**, **`clean`**, **`guided-clean`**, **`batch`**, argv-equivalence for automation.
- ✅ **Safety & planning**: structured probe → modality (**`audio-only`**, **`video-copy-safe`**, **`fallback-required`**, **`unsupported`**) — collision-safe outputs, explicit overwrite semantics.
- ✅ **Processing**: FFmpeg extract → sequential logical steps (**`afftdn`** presets + optional Demucs isolation + SoX + optional Audacity / **`ladspa`**) → AAC/M4A (or WAV intermediates) → remux/copy video (**`-c:v copy`** when feasible) with **`allowVideoFallback`** + explicit acknowledgement for **`fallback-required`** executions.
- ✅ **Heavy opt-ins**: guarded Demucs (runtime warnings), **`mod-script-pipe`**-gated Audacity (**TOOL-06** honest failures), FFmpeg **`ladspa`** optional path; **doctor** surfaces **`melt -version`** without orchestrating **melt** as a cleanup step (**TOOL-07**, Phase **16**).
- ✅ **Batch**: parallelism cap, **`fail-fast`**, manifests record effective plans + **`maybeDoctorFacts`** (**BATCH-05**).
- ✅ **Trust**: argv-only **`Bun.spawn`**, **`ProcessCommand`** immutability, post-run probes + codec/duration sanity.

### Active — next milestone (v1.1+ placeholders)

Captured from **Deferred v2 backlog** concepts (see archived requirements **§ v2**) — prioritize during **`/gsd-new-milestone`**:

- Audition/snippet previews before full runs (**ADV-*** family).
- Optional RNNoise/DNN backends when installed (**ADV-*** / plugin discovery).
- Richer structured JSON reporting for automation (**AUTO-*** — partial overlap with existing **`--json`** on **`inspect`**; expand deliberately).
- Deeper multi-track/stream policies (**MEDIA2-***) beyond v1 sane-default single-audio-selection.

*(Remove or tighten after the next roadmap pass — this list is not committed product scope yet.)*

### Out of Scope

Boundary table remains accurate for **v1**; revisit only if a future milestone explicitly expands:

- CLI-first (**no bundled GUI**) — prompts only.
- **No cloud render service** — local FOSS toolchain only by default narrative.
- **No proprietary engines** — v1 toolchain stayed FOSS-aligned.
- **No full NLE timeline** — audio/track replacement/remux posture, not non-destructive project files.

*(Reasoning unchanged — archived copy still available for diff if needed.)*

## Context (**2026-05-03 shipped state**)

- **Runtime/tooling**: Bun (**`bun test`**, **`bun run`**, compiled CLI entry), TypeScript **`strict`**, **`@biomejs/biome`** in CI (`biome ci`), FFmpeg 8-era argv builders (does not depend on **`fluent-ffmpeg`**).
- **Tests**: deterministic subprocess mocks + representative **FFprobe JSON** fixtures; integration-style tests for **`clean`** on bundled speech/noise WAV and **dry-run**/execute video paths (`bun run verify`).
- **Remaining confidence debt** (**non-blocking**): widen real-machine coverage (heterogeneous FFmpeg builds, **`sox`** vs **`sox_ng`** naming, Audacity scripting enablement, LADSPA install paths); called out under **`doctor`** / verification residual notes.

## Constraints

(Unchanged fundamentals — Bun + FOSS toolchain + sequential pipeline + explicit optional integrations.)

- **Tech stack**: TypeScript on Bun for the repo-owned CLI.
- **Media integrity**: stream-copy-first for video wherever planning allows — user acknowledgement for **`fallback-required`** re-encode recipe.
- **Power + guided**: **`@clack/prompts`** guided path + **`commander`** non-interactive surface share one execution spine (**`runCleanRequest`**).
- **Optional heavyweight tools**: runtime discovery + honest degradation — never silently require Demucs/Audacity/**ladspa**/GPU stack.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build as Bun + strict TS CLI | Fast cold start & Bright Builds aligned defaults. | ✓ **`bun run verify`** gates every PR; **`doctor`** + **`inspect`** surfaced early. |
| Single orchestration choke-point (`runCliRequest`) | One place maps parsed CLI → typed app requests. | ✓ Inspect/clean/guided/batch share tooling + typed failures. |
| Typed **`MediaProbe`** + **`planMediaOutput`** before execution | Highest-risk UX promise is **honest modality** labeling. | ✓ Video-copy vs fallback-required locked before **`ffmpeg`** spawn. |
| FFmpeg argv builders + **`ProcessRunner`** | Safety + quoting correctness + testability (`argv` snapshots). | ✓ Tests lock **`afftdn`**, **`sox`** tokens, **`ladspa`** filtergraph fragments. |
| Optional integrations behind explicit knobs + **`doctor`** | Heavy deps must not hijack baseline install story. | ✓ **`speech-vocals-demucs`** preset; risk/assume-yes style flags documented in CLI help surfaces. |
| **`ladspa`** runnable; **`melt`** diagnostics only (**TOOL-07**, Phase **16**) | Do not imply **melt** execution without shipping a melt-derived cleanup graph. | ✓ Requirement + **`08-VERIFICATION`** harmonized (**milestone audit passed**). |

## Evolution

Processes above follow Bright Builds/GSD milestones.

**Boundary event — v1.0 shipped & archived (**2026-05-03**):** roadmap + REQ snapshot under **`.planning/milestones/v1.0-*`**, **`v1.0`** git tag, live **`ROADMAP.md`** truncated to milestones header + **`/gsd-new-milestone`** onboarding path.

---

*Last updated: 2026-05-03 after **`v1.0`** milestone completion & archive.*
