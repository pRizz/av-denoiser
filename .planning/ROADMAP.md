# Roadmap: av-denoiser

## Overview

v1 builds a trustworthy local Bun/TypeScript CLI for cleaning audio in audio and video files. The roadmap starts with the safe CLI and media-planning core, models the video-copy promise before executing media work, delivers single-file audio and video outputs, then layers on guided workflows, repeatable flags, batch processing, and the optional Demucs/Audacity/Kdenlive integration paths without making heavyweight tools silent hard dependencies.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Bun CLI Foundation & Trust Model** - Users can install, run, diagnose, and verify the safe CLI shell. (completed 2026-05-01)
- [x] **Phase 2: Media Probing & Output Planning** - Users can inspect input media facts and safe output decisions before processing.
- [x] **Phase 3: Video Preservation & Fallback Control** - Users can understand and control when video stream copy is possible or impossible. (completed 2026-05-02)
- [x] **Phase 4: Core Audio Pipeline & SoX Cleanup** - Users can clean single audio files through transparent presets and sequential FFmpeg/SoX steps. (completed 2026-05-02)
- [x] **Phase 5: Final Media Output & Reporting** - Users can receive cleaned audio/video outputs with verified FFmpeg remuxing and human-readable reports. (completed 2026-05-01)
- [x] **Phase 6: Guided & Repeatable Workflows** - Users can choose guided prompts or equivalent flags for the same dry-run and execution behavior. (completed 2026-05-02)
- [x] **Phase 7: Batch Processing & Manifests** - Users can process many files safely with per-file status, summaries, and failure isolation. (completed 2026-05-01)
- [x] **Phase 8: Optional Heavy & Editor Integrations** - Users can opt into Demucs, Audacity, and Kdenlive/MLT paths when prerequisites are available. (completed 2026-05-01)

**Gap closure (v1.0 milestone audit)** — retrospective verification artifacts, documentation sync, and integration fixes flagged in [.planning/v1.0-MILESTONE-AUDIT.md](./v1.0-MILESTONE-AUDIT.md).

- [x] **Phase 9: Milestone Gap — Phase 3 verification** — Author `03-VERIFICATION.md` and reconcile Phase 3 plan summaries (`VIDEO-01`–`VIDEO-03`) against `bun run verify`/code evidence after audit orphan rule. (completed 2026-05-02)
- [x] **Phase 10: Milestone Gap — Phase 4 verification** — Author `04-VERIFICATION.md`, restore `requirements-completed` metadata on Phase 4 summaries where absent (`MEDIA-01`, `PIPE-01`–`PIPE-06`, `TOOL-02`). (completed 2026-05-02)
- [x] **Phase 11: Milestone Gap — Phase 5 verification** — Author `05-VERIFICATION.md`, restore SUMMARY hygiene for Phase 5 (`MEDIA-02`, `VIDEO-04`, `TOOL-01`, `TRUST-02`, `TRUST-03`). (completed 2026-05-02)
- [x] **Phase 12: Milestone Gap — Phase 8 verification** — Author `08-VERIFICATION.md`; add or extend app-layer tests wherever audit cited thin execution coverage (`TOOL-03`–`TOOL-08`). (completed 2026-05-02)
- [x] **Phase 13: Milestone Gap — Batch manifest doctor snapshot** — Wire default `batch` CLI path to populate `manifest.maybeDoctorFacts` (reuse doctor/discovery pathway from `clean`/deps) plus regression tests (`BATCH-05`, broken flow batch manifest completeness). (completed 2026-05-02)
- [x] **Phase 14: Milestone Gap — Guided optional-tool parity & Phase 6/7 verification** — Extend guided selections/prompts and argv equivalence for Demucs, Audacity, and LADSPA opt-in parity with `clean`/`batch`; author `06-VERIFICATION.md` and `07-VERIFICATION.md` (`CLI-04`, `UX-01`–`UX-05`, integration guided→heavy tools). (completed 2026-05-02)

## Phase Details

### Phase 1: Bun CLI Foundation & Trust Model
**Goal**: Users can install and run a safe Bun-based CLI that reports environment readiness, stable failures, and verification coverage.
**Depends on**: Nothing (first phase)
**Requirements**: CLI-01, CLI-02, CLI-03, TRUST-01, TRUST-04
**Success Criteria** (what must be TRUE):
  1. User can install dependencies, run the Bun TypeScript CLI locally, and see useful help output.
  2. User can run a preflight command that reports required and optional media tools, versions, and missing capabilities.
  3. User receives documented exit codes for success, invalid input, missing tools, planning failures, processing failures, and fallback-required outcomes.
  4. User can trust that external media tools are invoked through argv arrays rather than unsafe shell command strings.
  5. User can run repo-native verification that covers pure planning logic, parsers, command builders, and representative probe fixtures.
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Re-verify Bun package/scripts, strict TS/Biome scope, and CLI entry smoke (`CLI-01`).
- [x] 01-02-PLAN.md — Regression-lock exit taxonomy, outcomes, ProcessCommand, and doctor unions (`CLI-03`).
- [x] 01-03-PLAN.md — Strengthen argv-only process runner + injectable tool discovery coverage (`TRUST-01`).
- [x] 01-04-PLAN.md — Doctor/CLI integration tests, README exit-code docs, aggregate `verify` gate (`CLI-02`, `CLI-03`, `TRUST-04`).

### Phase 2: Media Probing & Output Planning
**Goal**: Users can inspect structured input media facts and safe output decisions before any denoise step runs.
**Depends on**: Phase 1
**Requirements**: MEDIA-03, MEDIA-04, MEDIA-05, VIDEO-05
**Success Criteria** (what must be TRUE):
  1. User can process common audio/video containers through structured probing before denoise work starts.
  2. User can choose safe output paths while the tool protects source files from in-place modification and accidental overwrite.
  3. User can see whether a planned output is audio-only, video-copy-safe, fallback-required, or unsupported before processing starts.
  4. User can rely on deliberate audio codec and container choices instead of hidden FFmpeg defaults for final output planning.
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Typed FFprobe JSON parsing and argv-only probe adapter.
- [x] 02-02-PLAN.md — Output path rules and modality planning from `MediaProbe`.
- [x] 02-03-PLAN.md — `inspect` CLI command, orchestration, and human-readable summary.

### Phase 3: Video Preservation & Fallback Control
**Goal**: Users can understand and control video stream-copy decisions before any fallback changes quality or container behavior.
**Depends on**: Phase 2
**Requirements**: VIDEO-01, VIDEO-02, VIDEO-03
**Success Criteria** (what must be TRUE):
  1. User can process video with a stream-copy-first policy that avoids video recompression whenever the container and codec combination allows it.
  2. User can see explicit fallback reasons when preserving video streams without recompression is impossible.
  3. User can approve or reject any fallback that would re-encode video or change the output container.
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Narrow MP4+h264 feasibility rules, probe `format_name`, deterministic `fallback-required`
- [x] 03-02-PLAN.md — `preservationNotes` + `--allow-video-fallback` policy + inspect rendering

### Phase 4: Core Audio Pipeline & SoX Cleanup
**Goal**: Users can clean single audio files through transparent recommended presets and sequential lossless-intermediate pipeline steps.
**Depends on**: Phase 3
**Requirements**: MEDIA-01, PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, TOOL-02
**Success Criteria** (what must be TRUE):
  1. User can pass a single audio file and receive a cleaned audio output file.
  2. User can choose simple recommended cleanup presets and inspect the ordered pipeline steps before the run starts.
  3. User can enable, disable, or tune practical v1 options for each pipeline step.
  4. User can run a sequential pipeline where each enabled step consumes the previous step's output using lossless or PCM-oriented intermediates by default.
  5. User can run SoX or SoX_ng cleanup steps when the tool is installed, and receives warnings for aggressive, slow, model-backed, or artifact-prone presets.
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md — Domain preset registry, `expandPreset`, knobs + `pipelineWarnings[]` (PIPE-01, PIPE-02, PIPE-03, PIPE-05, PIPE-06).
- [x] 04-02-PLAN.md — Argv builders (`LogicalPipelineStep` → `ProcessCommand`) + WAV PCM interchange tests (PIPE-04, PIPE-05, TOOL-02).
- [x] 04-03-PLAN.md — `runCleanRequest` orchestration: modality gate, dry-run, sequential `ProcessRunner`, SoX readiness errors (MEDIA-01, PIPE-02, PIPE-04, TOOL-02).
- [x] 04-04-PLAN.md — `clean` CLI + `CliRequest` routing + render/guidance updates (MEDIA-01, PIPE-02, PIPE-03).

### Phase 5: Final Media Output & Reporting
**Goal**: Users can receive cleaned audio/video outputs with verified FFmpeg extraction, filtering, remuxing, and clear final reports.
**Depends on**: Phase 4
**Requirements**: MEDIA-02, VIDEO-04, TOOL-01, TRUST-02, TRUST-03
**Success Criteria** (what must be TRUE):
  1. User can pass a single video file and receive a video output with cleaned audio.
  2. User can run FFmpeg/FFprobe-backed probing, extraction, filtering, and remuxing as the required core media path.
  3. User receives a final report confirming whether video streams were copied, audio was encoded, side streams were preserved or dropped, and which fallbacks were used.
  4. User can inspect logs or summaries that explain what the tool did without raw media-tool output being the only error message.
  5. User can rely on post-run media verification for output existence, basic probe validity, duration sanity, and video-copy status.
**Plans**: 4 plans

Plans:
- [x] 05-01-PLAN.md — Run report + post-run verify pure domain (`VIDEO-04`, `TRUST-03`).
- [x] 05-02-PLAN.md — FFmpeg argv builders extract WAV + remux `-c:v copy` (`TOOL-01`).
- [x] 05-03-PLAN.md — `runCleanRequest` video path + verification + report assembly (`MEDIA-02`, `TOOL-01`, `TRUST-02`, `TRUST-03`).
- [x] 05-04-PLAN.md — `clean --allow-video-fallback`, render checklist, help copy (`MEDIA-02`, `VIDEO-04`, `TRUST-02`).

### Phase 6: Guided & Repeatable Workflows
**Goal**: Users can choose between a friendly guided workflow and equivalent non-interactive commands for the same execution model.
**Depends on**: Phase 5
**Requirements**: CLI-04, UX-01, UX-02, UX-03, UX-04, UX-05
**Success Criteria** (what must be TRUE):
  1. User can start a friendly guided workflow without knowing CLI flags.
  2. User can select input, output, preset, video-copy policy, and optional tool steps through guided prompts.
  3. User can preview a dry-run plan showing resolved tools, ordered steps, expected outputs, and video preservation decisions.
  4. User can copy and run the equivalent non-interactive command for every guided workflow choice.
  5. User receives concise progress updates and a human-readable final summary during guided or flag-driven runs.
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — `@clack`, `GuidedCleanSelections`, argv equivalence builder + tests (`CLI-04`).
- [x] 06-02-PLAN.md — `guided` command, prompts, dry-run preview, equivalent line, confirmed execute (`UX-01`–`UX-04`, `CLI-04`).
- [x] 06-03-PLAN.md — `reportProgress`, guided spinner, CLI round-trip test, help guidance (`UX-05`, `CLI-04`).

### Phase 7: Batch Processing & Manifests
**Goal**: Users can process many files safely with independent per-file plans, statuses, outputs, and run records.
**Depends on**: Phase 6
**Requirements**: BATCH-01, BATCH-02, BATCH-03, BATCH-04, BATCH-05
**Success Criteria** (what must be TRUE):
  1. User can pass multiple files or directory/glob-style input for batch cleanup.
  2. User receives per-file plans, statuses, warnings, outputs, and failure reasons in batch mode.
  3. User can run batch processing without one failed file deleting progress or hiding failures for the remaining files.
  4. User can rely on collision-safe output naming for batch runs.
  5. User can inspect a batch manifest or summary that records effective presets, tool versions, planned commands, and fallback decisions.
**Plans**: 3 plans

Plans:
- [x] 07-01-PLAN.md — Batch manifest types, collision-safe output allocation (`BATCH-04`, `BATCH-05`).
- [x] 07-02-PLAN.md — `batch` CLI, input expansion (`--input`, `--glob` + `--accept-glob-risk`, `--from-dir`), `CliRequest` (`BATCH-01`).
- [x] 07-03-PLAN.md — `runBatchRequest`, concurrency / `--fail-fast`, manifest write, exit aggregation (`BATCH-02`, `BATCH-03`).

### Phase 8: Optional Heavy & Editor Integrations
**Goal**: Users can opt into Demucs, Audacity, and Kdenlive/MLT cleanup paths only when prerequisites are available and clearly accepted.
**Depends on**: Phase 7
**Requirements**: TOOL-03, TOOL-04, TOOL-05, TOOL-06, TOOL-07, TOOL-08
**Success Criteria** (what must be TRUE):
  1. User can run a Demucs voice/source isolation step when Demucs and its runtime dependencies are installed.
  2. User receives clear warnings before Demucs uses significant CPU/GPU resources, downloads models, or runs slowly.
  3. User can run an Audacity automation step when scripting or macro prerequisites are installed, enabled, and accepted.
  4. User receives actionable diagnostics when Audacity cannot be automated because scripting, macro, pipe, GUI, or export settings are unavailable.
  5. User can run a Kdenlive/MLT or Kdenlive-derived audio-filter integration when a practical headless path and required plugins are available, and can still complete supported FFmpeg/SoX/Demucs pipelines when it is unavailable.
**Plans**: 4 plans

Plans:
- [x] 08-01-PLAN.md — Demucs logical step, preset expansion, argv builder, TOOL-04 warnings (TOOL-03, TOOL-04).
- [x] 08-02-PLAN.md — Wire Demucs into `runCleanRequest` / CLI / batch summary parity (TOOL-03, TOOL-04).
- [x] 08-03-PLAN.md — Audacity pipe adapter, opt-in CLI, diagnostics (TOOL-05, TOOL-06).
- [x] 08-04-PLAN.md — Demucs doctor (D-16), ladspa/melt probes, **runnable FFmpeg LADSPA step** (TOOL-07), docs TOOL-08 (`clean.ts` after 08-03).

### Phase 9: Milestone Gap — Phase 3 verification
**Goal**: Satisfy milestone audit orphan rule for `VIDEO-01`–`VIDEO-03` with a phase-local verification artifact anchored to shipped code/tests.
**Depends on**: Phase 8 (delivered code under audit)
**Gap closure**: v1.0-MILESTONE-AUDIT (`gaps.requirements` PROCESS / orphaned VIDEO IDs)
**Requirements**: VIDEO-01, VIDEO-02, VIDEO-03
**Plans**: 1 plan

Plans:
- [x] 09-01-PLAN.md — Retroactive **`03-VERIFICATION.md`** + SUMMARY parity check + **`bun run verify`** (`VIDEO-01`–`VIDEO-03`).

### Phase 10: Milestone Gap — Phase 4 verification
**Goal**: Close audit gap for pipe/preset/sox/audio outcomes without altering product scope (`MEDIA-01`, sequential pipeline reqs).
**Depends on**: Phase 9 *(recommended — keeps gap work ordered; may execute in parallel with caution)*
**Gap closure**: v1.0-MILESTONE-AUDIT orphaned `PIPE-*`, `TOOL-02`, `MEDIA-01`
**Requirements**: MEDIA-01, PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, TOOL-02
**Plans**: 1 plan

Plans:
- [x] 10-01-PLAN.md — Retroactive **`04-VERIFICATION.md`** + SUMMARY `requirements-completed` + **`bun run verify`** (`MEDIA-01`, `PIPE-01`–`PIPE-06`, `TOOL-02`).

### Phase 11: Milestone Gap — Phase 5 verification
**Goal**: Formalize finalized media/remux/reporting requirement evidence (`MEDIA-02`, `VIDEO-04`, FFmpeg path, trust summaries/post-run verification).
**Depends on**: Phase 10
**Gap closure**: v1.0-MILESTONE-AUDIT orphaned `MEDIA-02`, `VIDEO-04`, `TOOL-01`, `TRUST-02`, `TRUST-03`
**Requirements**: MEDIA-02, VIDEO-04, TOOL-01, TRUST-02, TRUST-03
**Plans**: 1 plan

Plans:
- [x] 11-01-PLAN.md — Retroactive **`05-VERIFICATION.md`** + SUMMARY `requirements-completed` + **`bun run verify`** (`MEDIA-02`, `VIDEO-04`, `TOOL-01`, `TRUST-02`, `TRUST-03`).

### Phase 12: Milestone Gap — Phase 8 verification
**Goal**: Verification artifact plus stronger execution-path confidence for optional heavy integrations.
**Depends on**: Phase 11
**Gap closure**: v1.0-MILESTONE-AUDIT `TOOL-03` partial + missing `08-VERIFICATION.md`
**Requirements**: TOOL-03, TOOL-04, TOOL-05, TOOL-06, TOOL-07, TOOL-08
**Plans**: 1 plan

Plans:
- [x] 12-01-PLAN.md — Retroactive **`08-VERIFICATION.md`** + SUMMARY `requirements-completed` + app-layer **Demucs** `runCleanRequest` test + **`bun run verify`** (`TOOL-03`–`TOOL-08`).

### Phase 13: Milestone Gap — Batch manifest doctor snapshot
**Goal**: Default `batch` runs persist doctor/discovery snapshots into manifests per `BATCH-05`.
**Depends on**: Phase 7 *(delivered batch surface; executable before heavier verification phases if desired)*
**Gap closure**: v1.0-MILESTONE-AUDIT integration `batch → manifest.maybeDoctorFacts`, flow batch manifest completeness
**Requirements**: BATCH-05 (plus regression guard for BATCH-01–BATCH-04)
**Plans**: 1 plan

Plans:
- [x] 13-01-PLAN.md — **`runCliRequest`** default **`discoverTools`** for **`batch`**, discovery **`try/catch`**, **`test/app/run-command.test.ts`** (**BATCH-05**, BATCH-01–BATCH-04 regression).

### Phase 14: Milestone Gap — Guided optional-tool parity & Phase 6/7 verification
**Goal**: Guided mode reaches parity with flagged `clean`/`batch` optional heavy surfaces; finalize guided/batch UX verification artifacts (`06-VERIFICATION.md`, `07-VERIFICATION.md`).
**Depends on**: Phase 12 *(optional-heavy verification artifact complete)* and Phase 13 *(batch manifest doctor snapshot landed)*
**Gap closure**: v1.0-MILESTONE-AUDIT guided→heavy integration gap, orphaned `CLI-04` process gap (implementation already), `UX-*`/`BATCH-*` verification absent
**Requirements**: CLI-04, UX-01, UX-02, UX-03, UX-04, UX-05, BATCH-01, BATCH-02, BATCH-03, BATCH-04
**Plans**: Plans TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 … 14. Gap phases **9–14** depend on merged v1 work (audit closure); Phase **13** may start once Phase **7** is complete without blocking on Phases **9–12**.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bun CLI Foundation & Trust Model | 4/4 | Complete    | 2026-05-01 |
| 2. Media Probing & Output Planning | 3/3 | Complete    | 2026-05-01 |
| 3. Video Preservation & Fallback Control | 2/2 | Complete    | 2026-05-02 |
| 4. Core Audio Pipeline & SoX Cleanup | 4/4 | Complete    | 2026-05-02 |
| 5. Final Media Output & Reporting | 4/4 | Complete    | 2026-05-01 |
| 6. Guided & Repeatable Workflows | 3/3 | Complete    | 2026-05-02 |
| 7. Batch Processing & Manifests | 3/3 | Complete    | 2026-05-01 |
| 8. Optional Heavy & Editor Integrations | 4/4 | Complete    | 2026-05-01 |
| 9. Milestone Gap — Phase 3 verification | 1/1 | Complete    | 2026-05-02 |
| 10. Milestone Gap — Phase 4 verification | 1/1 | Complete    | 2026-05-02 |
| 11. Milestone Gap — Phase 5 verification | 1/1 | Complete    | 2026-05-02 |
| 12. Milestone Gap — Phase 8 verification | 1/1 | Complete    | 2026-05-02 |
| 13. Milestone Gap — Batch manifest doctor snapshot | 1/1 | Complete    | 2026-05-02 |
| 14. Milestone Gap — Guided optional-tool parity & Phase 6/7 verification | 2/2 | Complete    | 2026-05-02 |

## Requirement Coverage

| Requirement | Phase | Notes |
|-------------|-------|--------|
| CLI-01 | Phase 1 | |
| CLI-02 | Phase 1 | |
| CLI-03 | Phase 1 | |
| CLI-04 | Phase 14 | Gap closure (**was** Phase 6 delivery) |
| MEDIA-01 | Phase 10 | Gap closure (**was** Phase 4 delivery) |
| MEDIA-02 | Phase 11 | Gap closure (**was** Phase 5 delivery) |
| MEDIA-03 | Phase 2 | |
| MEDIA-04 | Phase 2 | |
| MEDIA-05 | Phase 2 | |
| VIDEO-01 | Phase 9 | Gap closure (**was** Phase 3 delivery) |
| VIDEO-02 | Phase 9 | Gap closure (**was** Phase 3 delivery) |
| VIDEO-03 | Phase 9 | Gap closure (**was** Phase 3 delivery) |
| VIDEO-04 | Phase 11 | Gap closure (**was** Phase 5 delivery) |
| VIDEO-05 | Phase 2 | |
| PIPE-01 | Phase 10 | Gap closure (**was** Phase 4 delivery) |
| PIPE-02 | Phase 10 | Gap closure (**was** Phase 4 delivery) |
| PIPE-03 | Phase 10 | Gap closure (**was** Phase 4 delivery) |
| PIPE-04 | Phase 10 | Gap closure (**was** Phase 4 delivery) |
| PIPE-05 | Phase 10 | Gap closure (**was** Phase 4 delivery) |
| PIPE-06 | Phase 10 | Gap closure (**was** Phase 4 delivery) |
| TOOL-01 | Phase 11 | Gap closure (**was** Phase 5 delivery) |
| TOOL-02 | Phase 10 | Gap closure (**was** Phase 4 delivery) |
| TOOL-03 | Phase 12 | Gap closure (**was** Phase 8 delivery) |
| TOOL-04 | Phase 12 | Gap closure (**was** Phase 8 delivery) |
| TOOL-05 | Phase 12 | Gap closure (**was** Phase 8 delivery) |
| TOOL-06 | Phase 12 | Gap closure (**was** Phase 8 delivery) |
| TOOL-07 | Phase 12 | Gap closure (**was** Phase 8 delivery) |
| TOOL-08 | Phase 12 | Gap closure (**was** Phase 8 delivery) |
| UX-01 | Phase 14 | Gap closure (**was** Phase 6 delivery) |
| UX-02 | Phase 14 | Gap closure (**was** Phase 6 delivery) |
| UX-03 | Phase 14 | Gap closure (**was** Phase 6 delivery) |
| UX-04 | Phase 14 | Gap closure (**was** Phase 6 delivery) |
| UX-05 | Phase 14 | Gap closure (**was** Phase 6 delivery) |
| BATCH-01 | Phase 14 | Gap closure (**was** Phase 7 delivery) |
| BATCH-02 | Phase 14 | Gap closure (**was** Phase 7 delivery) |
| BATCH-03 | Phase 14 | Gap closure (**was** Phase 7 delivery) |
| BATCH-04 | Phase 14 | Gap closure (**was** Phase 7 delivery) |
| BATCH-05 | Phase 13 | Gap closure (**was** Phase 7 delivery); integration fix phase |
| TRUST-01 | Phase 1 | |
| TRUST-02 | Phase 11 | Gap closure (**was** Phase 5 delivery) |
| TRUST-03 | Phase 11 | Gap closure (**was** Phase 5 delivery) |
| TRUST-04 | Phase 1 | |

**Coverage:** 42/42 v1 requirements mapped across original delivery phases + milestone gap closure phases 9–14.
