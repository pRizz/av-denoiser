# Roadmap: av-denoiser

## Overview

v1 builds a trustworthy local Bun/TypeScript CLI for cleaning audio in audio and video files. The roadmap starts with the safe CLI and media-planning core, models the video-copy promise before executing media work, delivers single-file audio and video outputs, then layers on guided workflows, repeatable flags, batch processing, and the optional Demucs/Audacity/Kdenlive integration paths without making heavyweight tools silent hard dependencies.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Bun CLI Foundation & Trust Model** - Users can install, run, diagnose, and verify the safe CLI shell.
- [ ] **Phase 2: Media Probing & Output Planning** - Users can inspect input media facts and safe output decisions before processing.
- [ ] **Phase 3: Video Preservation & Fallback Control** - Users can understand and control when video stream copy is possible or impossible.
- [ ] **Phase 4: Core Audio Pipeline & SoX Cleanup** - Users can clean single audio files through transparent presets and sequential FFmpeg/SoX steps.
- [ ] **Phase 5: Final Media Output & Reporting** - Users can receive cleaned audio/video outputs with verified FFmpeg remuxing and human-readable reports.
- [ ] **Phase 6: Guided & Repeatable Workflows** - Users can choose guided prompts or equivalent flags for the same dry-run and execution behavior.
- [ ] **Phase 7: Batch Processing & Manifests** - Users can process many files safely with per-file status, summaries, and failure isolation.
- [ ] **Phase 8: Optional Heavy & Editor Integrations** - Users can opt into Demucs, Audacity, and Kdenlive/MLT paths when prerequisites are available.

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
- [ ] 01-01-PLAN.md — Create the Bun package, strict TypeScript/Biome configuration, and typed CLI entrypoint.
- [ ] 01-02-PLAN.md — Implement the pure trust-model domain for exit codes, process commands, and doctor facts.
- [ ] 01-03-PLAN.md — Wire the safe process runner and deterministic tool discovery adapters.
- [ ] 01-04-PLAN.md — Wire doctor, docs, exit behavior, and full verification into the CLI.

### Phase 2: Media Probing & Output Planning
**Goal**: Users can inspect structured input media facts and safe output decisions before any denoise step runs.
**Depends on**: Phase 1
**Requirements**: MEDIA-03, MEDIA-04, MEDIA-05, VIDEO-05
**Success Criteria** (what must be TRUE):
  1. User can process common audio/video containers through structured probing before denoise work starts.
  2. User can choose safe output paths while the tool protects source files from in-place modification and accidental overwrite.
  3. User can see whether a planned output is audio-only, video-copy-safe, fallback-required, or unsupported before processing starts.
  4. User can rely on deliberate audio codec and container choices instead of hidden FFmpeg defaults for final output planning.
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Video Preservation & Fallback Control
**Goal**: Users can understand and control video stream-copy decisions before any fallback changes quality or container behavior.
**Depends on**: Phase 2
**Requirements**: VIDEO-01, VIDEO-02, VIDEO-03
**Success Criteria** (what must be TRUE):
  1. User can process video with a stream-copy-first policy that avoids video recompression whenever the container and codec combination allows it.
  2. User can see explicit fallback reasons when preserving video streams without recompression is impossible.
  3. User can approve or reject any fallback that would re-encode video or change the output container.
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bun CLI Foundation & Trust Model | 0/4 | Not started | - |
| 2. Media Probing & Output Planning | 0/1 | Not started | - |
| 3. Video Preservation & Fallback Control | 0/1 | Not started | - |
| 4. Core Audio Pipeline & SoX Cleanup | 0/1 | Not started | - |
| 5. Final Media Output & Reporting | 0/1 | Not started | - |
| 6. Guided & Repeatable Workflows | 0/1 | Not started | - |
| 7. Batch Processing & Manifests | 0/1 | Not started | - |
| 8. Optional Heavy & Editor Integrations | 0/1 | Not started | - |

## Requirement Coverage

| Requirement | Phase |
|-------------|-------|
| CLI-01 | Phase 1 |
| CLI-02 | Phase 1 |
| CLI-03 | Phase 1 |
| CLI-04 | Phase 6 |
| MEDIA-01 | Phase 4 |
| MEDIA-02 | Phase 5 |
| MEDIA-03 | Phase 2 |
| MEDIA-04 | Phase 2 |
| MEDIA-05 | Phase 2 |
| VIDEO-01 | Phase 3 |
| VIDEO-02 | Phase 3 |
| VIDEO-03 | Phase 3 |
| VIDEO-04 | Phase 5 |
| VIDEO-05 | Phase 2 |
| PIPE-01 | Phase 4 |
| PIPE-02 | Phase 4 |
| PIPE-03 | Phase 4 |
| PIPE-04 | Phase 4 |
| PIPE-05 | Phase 4 |
| PIPE-06 | Phase 4 |
| TOOL-01 | Phase 5 |
| TOOL-02 | Phase 4 |
| TOOL-03 | Phase 8 |
| TOOL-04 | Phase 8 |
| TOOL-05 | Phase 8 |
| TOOL-06 | Phase 8 |
| TOOL-07 | Phase 8 |
| TOOL-08 | Phase 8 |
| UX-01 | Phase 6 |
| UX-02 | Phase 6 |
| UX-03 | Phase 6 |
| UX-04 | Phase 6 |
| UX-05 | Phase 6 |
| BATCH-01 | Phase 7 |
| BATCH-02 | Phase 7 |
| BATCH-03 | Phase 7 |
| BATCH-04 | Phase 7 |
| BATCH-05 | Phase 7 |
| TRUST-01 | Phase 1 |
| TRUST-02 | Phase 5 |
| TRUST-03 | Phase 5 |
| TRUST-04 | Phase 1 |

**Coverage:** 42/42 v1 requirements mapped. No orphaned requirements.
