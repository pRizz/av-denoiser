# Requirements: av-denoiser

**Defined:** 2026-05-01
**Core Value:** Users can pass an audio or video file through a guided denoise pipeline and get a cleaned output while avoiding video recompression whenever possible.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### CLI Foundation

- [x] **CLI-01**: User can install dependencies and run the Bun-based TypeScript CLI locally.
- [x] **CLI-02**: User can run a `doctor` or preflight command that reports required and optional media tools, versions, and missing capabilities.
- [x] **CLI-03**: User receives stable, documented exit codes for success, invalid input, missing tools, planning failures, processing failures, and fallback-required outcomes.
- [ ] **CLI-04**: User can run every guided workflow through equivalent non-interactive flags for repeatable automation.

### Media Input and Safety

- [x] **MEDIA-01**: User can pass a single audio file and receive a cleaned audio output file.
- [ ] **MEDIA-02**: User can pass a single video file and receive a video output with cleaned audio.
- [x] **MEDIA-03**: User can process common audio/video containers through structured probing before any denoise step runs.
- [x] **MEDIA-04**: User can choose safe output paths, and the tool protects source files from in-place modification or accidental overwrite.
- [x] **MEDIA-05**: User can see whether the planned output is audio-only, video-copy-safe, fallback-required, or unsupported before processing starts.

### Video Preservation and Remuxing

- [x] **VIDEO-01**: User can process video with a stream-copy-first policy that avoids video recompression whenever the container and codec combination allows it.
- [x] **VIDEO-02**: User can see explicit fallback reasons when preserving video streams without recompression is impossible.
- [x] **VIDEO-03**: User can approve or reject any fallback that would re-encode video or change the output container.
- [ ] **VIDEO-04**: User receives a final report confirming whether video streams were copied, audio was encoded, side streams were preserved or dropped, and which fallbacks were used.
- [x] **VIDEO-05**: User can rely on deliberate audio codec/container choices instead of hidden FFmpeg defaults for final outputs.

### Pipeline and Presets

- [x] **PIPE-01**: User can choose from simple recommended cleanup presets rather than building a raw filter graph.
- [x] **PIPE-02**: User can inspect how a preset resolves into ordered pipeline steps before the run starts.
- [x] **PIPE-03**: User can enable, disable, or tune practical v1 options for each pipeline step.
- [x] **PIPE-04**: User can run a sequential pipeline where each enabled step consumes the previous step's output.
- [x] **PIPE-05**: User benefits from lossless or PCM-oriented intermediate files by default, avoiding lossy re-encoding inside the denoise pipeline.
- [x] **PIPE-06**: User receives warnings when a selected preset may be aggressive, slow, model-backed, or likely to introduce artifacts.

### Tool Integrations

- [ ] **TOOL-01**: User can run FFmpeg/FFprobe-backed media probing, extraction, filtering, and remuxing as the required core media path.
- [x] **TOOL-02**: User can run SoX or SoX_ng cleanup steps when the tool is installed and its required effects are available.
- [ ] **TOOL-03**: User can run a Demucs voice/source isolation step when Demucs and its runtime dependencies are installed.
- [ ] **TOOL-04**: User receives clear warnings before Demucs uses significant CPU/GPU resources, downloads models, or runs slowly.
- [ ] **TOOL-05**: User can run an Audacity automation step when Audacity scripting or macro prerequisites are installed, enabled, and accepted by the user.
- [ ] **TOOL-06**: User receives actionable diagnostics when Audacity cannot be automated because scripting, macro, pipe, GUI, or export settings are unavailable.
- [ ] **TOOL-07**: User can run a Kdenlive/MLT or Kdenlive-derived audio-filter integration when a practical headless path and required plugins are available.
- [ ] **TOOL-08**: User receives actionable diagnostics when Kdenlive/MLT integration is unavailable and can still complete supported FFmpeg/SoX/Demucs pipelines.

### Guided Experience

- [ ] **UX-01**: User can start a friendly guided workflow without knowing CLI flags.
- [ ] **UX-02**: User can select input, output, preset, video-copy policy, and optional tool steps through guided prompts.
- [ ] **UX-03**: User can preview a dry-run plan that shows resolved tools, ordered steps, expected outputs, and video preservation decisions.
- [ ] **UX-04**: User can copy the equivalent non-interactive command after a guided run.
- [ ] **UX-05**: User receives concise progress updates and a human-readable final summary.

### Batch Processing

- [x] **BATCH-01**: User can pass multiple files or directory/glob-style input for batch cleanup.
- [x] **BATCH-02**: User receives per-file plans, statuses, warnings, outputs, and failure reasons in batch mode.
- [x] **BATCH-03**: User can run batch processing without one failed file deleting progress or hiding failures for the remaining files.
- [x] **BATCH-04**: User can rely on collision-safe output naming for batch runs.
- [x] **BATCH-05**: User can inspect a batch manifest or summary that records effective presets, tool versions, planned commands, and fallback decisions.

### Verification and Trust

- [x] **TRUST-01**: User can trust that external tools are invoked with argv arrays rather than unsafe shell command strings.
- [ ] **TRUST-02**: User can inspect logs or summaries that explain what the tool did without exposing confusing raw media-tool output as the only error message.
- [ ] **TRUST-03**: User can rely on post-run media verification that checks output existence, basic probe validity, duration sanity, and video-copy status.
- [x] **TRUST-04**: User can run tests or verification commands that cover pure planning logic, parser logic, command builders, and representative media probe fixtures.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Cleanup

- **ADV-01**: User can generate short before/after audition snippets before processing a full file or batch.
- **ADV-02**: User can use additional speech enhancement backends such as DeepFilterNet or RNNoise when installed.
- **ADV-03**: User can compare multiple presets against the same sample and choose the preferred result.
- **ADV-04**: User can tune advanced quality metrics such as loudness, clipping, speech focus, and artifact risk.

### Automation and Reporting

- **AUTO-01**: User can request machine-readable JSON or JSONL reports for scripts and agents.
- **AUTO-02**: User can resume or skip already-completed jobs in long batch runs.
- **AUTO-03**: User can keep temporary workspaces and detailed debug manifests for troubleshooting.
- **AUTO-04**: User can save explicit config files for reusable pipeline definitions beyond the simple v1 preset/options model.

### Media Depth

- **MEDIA2-01**: User can define detailed multi-track policies for multiple audio streams, subtitles, chapters, attachments, metadata, and data streams.
- **MEDIA2-02**: User can choose alternate output containers based on a tested compatibility matrix.
- **MEDIA2-03**: User can opt into video re-encoding workflows when audio cleanup is bundled with actual video filtering.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| GUI application | The product is CLI-first; guided prompts are enough for v1. |
| Cloud processing service | The v1 promise is local, private, and FOSS-first processing. |
| Proprietary or paid denoise engines | The pipeline should use free and open source tools. |
| Custom model training | Training models is a separate ML product surface. |
| Full video pixel denoising by default | Video filtering requires video re-encoding and conflicts with the default preservation promise. |
| Automatic in-place source replacement | Source media must remain protected because denoise quality is subjective and failures can be costly. |
| Raw FFmpeg filtergraph as primary UX | Presets and typed step options keep the tool approachable and prevent invalid pipeline states. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

Follow-up roadmap phases **15** (editorial checklist + table sync), **16** (**TOOL-07** semantic closure from v1.0 re-audit), and **17** (gap-dir verification stubs) refine documentation and planning ergonomics **without inventing unmapped REQ IDs**.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 | Phase 1 | Complete |
| CLI-02 | Phase 1 | Complete |
| CLI-03 | Phase 1 | Complete |
| CLI-04 | Phase 14 | Pending |
| MEDIA-01 | Phase 10 | Pending |
| MEDIA-02 | Phase 11 | Pending |
| MEDIA-03 | Phase 2 | Complete |
| MEDIA-04 | Phase 2 | Complete |
| MEDIA-05 | Phase 2 | Complete |
| VIDEO-01 | Phase 9 | Complete |
| VIDEO-02 | Phase 9 | Complete |
| VIDEO-03 | Phase 9 | Complete |
| VIDEO-04 | Phase 11 | Pending |
| VIDEO-05 | Phase 2 | Complete |
| PIPE-01 | Phase 10 | Pending |
| PIPE-02 | Phase 10 | Pending |
| PIPE-03 | Phase 10 | Pending |
| PIPE-04 | Phase 10 | Pending |
| PIPE-05 | Phase 10 | Pending |
| PIPE-06 | Phase 10 | Pending |
| TOOL-01 | Phase 11 | Pending |
| TOOL-02 | Phase 10 | Pending |
| TOOL-03 | Phase 12 | Pending |
| TOOL-04 | Phase 12 | Pending |
| TOOL-05 | Phase 12 | Pending |
| TOOL-06 | Phase 12 | Pending |
| TOOL-07 | Phase 16 | Pending |
| TOOL-08 | Phase 12 | Pending |
| UX-01 | Phase 14 | Pending |
| UX-02 | Phase 14 | Pending |
| UX-03 | Phase 14 | Pending |
| UX-04 | Phase 14 | Pending |
| UX-05 | Phase 14 | Pending |
| BATCH-01 | Phase 14 | Pending |
| BATCH-02 | Phase 14 | Pending |
| BATCH-03 | Phase 14 | Pending |
| BATCH-04 | Phase 14 | Pending |
| BATCH-05 | Phase 13 | Complete |
| TRUST-01 | Phase 1 | Complete |
| TRUST-02 | Phase 11 | Pending |
| TRUST-03 | Phase 11 | Pending |
| TRUST-04 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases (including milestone gap closure phases 9–14 and follow-up **15–17** stubs): 42
- Unmapped: 0

---
*Requirements defined: 2026-05-01*
*Last updated: 2026-05-03 — ROADMAP Phases **15–17** created from `/gsd-plan-milestone-gaps` (**TOOL-07** → Phase **16**); checklist `[ ]`/Pending rows slated for Phase **15**.*
