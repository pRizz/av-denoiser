# Project Research Summary

**Project:** av-denoiser
**Domain:** Bun/TypeScript audio/video denoising CLI
**Researched:** 2026-05-01
**Confidence:** HIGH for the core Bun/TypeScript and FFmpeg architecture; MEDIUM for optional ML, Audacity, LADSPA, and Kdenlive/MLT integrations.

## Executive Summary

`av-denoiser` should be built as a local, FOSS-first media cleanup CLI whose core job is replacing noisy audio with cleaned audio while preserving video streams whenever container and codec rules allow it. Experts build this kind of tool around explicit media probing, typed stream and codec models, command plans rendered to argv arrays, and a functional-core/imperative-shell split so the hard media decisions are testable without running external tools.

The recommended approach is Bun/TypeScript as the repo-owned implementation surface, FFmpeg/FFprobe as the required media engine, SoX or SoX_ng as the first optional cleanup backend, and Demucs plus Audacity/LADSPA/Kdenlive only as feature-gated integrations after the core planner is stable. Guided prompts, power-user flags, dry-run previews, and batch mode should all feed the same typed `RunRequest` and `ExecutionPlan`; interactive mode must not become a separate product path.

The main risk is treating "preserve video" as a best-effort FFmpeg flag. That would cause silent video re-encoding, stream loss, mux failures, or user distrust. Mitigate this by making no-video-recompression an explicit state machine, using `ffprobe` fixtures and compatibility tests, selecting final audio codecs deliberately, using lossless intermediates, and showing both pre-run plans and post-run summaries that state exactly whether video was copied, audio was encoded, streams were preserved or dropped, and which fallbacks were required.

## Key Findings

### Recommended Stack

The stack should stay small and Bun-native. Bun owns runtime, package management, tests, scripts, and subprocess orchestration; TypeScript owns the domain model; Zod parses every external boundary; FFmpeg/FFprobe provide required media probing, audio extraction, audio filtering, stream-copy remuxing, and diagnostics.

Optional media engines should be discovered at runtime instead of installed by npm. SoX_ng/SoX is a practical baseline cleanup backend, Demucs is useful but heavyweight for speech/vocal isolation, Audacity is powerful but GUI and pipe dependent, and Kdenlive/MLT should remain research context unless a practical headless `melt` path is proven.

**Core technologies:**
- Bun 1.3.13: runtime, package manager, test runner, script surface, and subprocess API - matches the requested stack and keeps CLI startup fast.
- TypeScript 6.0.3 with `@types/bun`: strict modeling of media states, tool capabilities, requests, plans, and diagnostics.
- FFmpeg/FFprobe 8.1: required media engine for probing, extraction, native audio filters, stream mapping, stream copy, and remuxing.
- SoX_ng/SoX: optional scripted cleanup backend for deterministic noise reduction, normalization, stats, and baseline effects.
- Demucs: optional heavy voice/source isolation backend with explicit runtime, model, CPU/GPU, and memory warnings.
- Commander plus `@commander-js/extra-typings`: stable typed command surface for flags, subcommands, and help.
- `@clack/prompts`: guided first-run workflow, confirmations, preset selection, and cancellation handling.
- Zod: parser-backed construction of CLI inputs, config files, `ffprobe` JSON, tool capabilities, and preset definitions.
- `p-limit` and `fast-glob`: batch concurrency control and explicit batch input expansion.
- Biome and `bun test`: fast formatting/linting plus repo-native tests for pure planner and parser logic.

### Expected Features

The v1 product needs both audio and video parity. A single input file should produce a cleaned output; video inputs should produce video outputs with original video streams copied whenever possible; all fallback behavior should be explained before and after execution.

The differentiator is not a novel denoise algorithm. It is a trustworthy local orchestration layer: guided presets, typed pipeline planning, explicit stream-copy decisions, equivalent non-interactive commands, and clear reports that let creators know what changed and what did not.

**Must have (table stakes):**
- Single-file audio cleanup - validates the core denoise value.
- Video input with cleaned-audio video output - creator workflows commonly start from MP4, MOV, or MKV.
- Stream-copy-first video policy - preserves video quality and avoids unnecessary processing.
- Clear fallback reporting - users must know why no-video-recompression did or did not happen.
- Format probing and tool preflight - media and tool capability decisions need structured facts.
- Guided interactive workflow - first value should not require memorizing flags.
- Non-interactive flags - every guided choice needs a repeatable CLI/config equivalent.
- Recommended presets - users think in cleanup goals, not FFmpeg and SoX internals.
- Basic batch mode - multiple recordings need per-file summaries and partial failure handling.
- Output naming and overwrite safety - source media must never be put at risk.
- Dry-run/plan preview and final human summary - crucial for trust around media fallbacks.

**Should have (competitive):**
- Equivalent command printed after guided runs - teaches repeatable usage.
- Preset-to-pipeline transparency - users can inspect how friendly choices map to tool steps.
- Per-file batch reports - mixed media inputs require per-item copy/fallback outcomes.
- Conservative audio-quality safeguards - avoid clipping, over-denoising, and duration drift.
- Dependency/model-cache awareness - warn before Demucs downloads models or consumes significant resources.
- Reproducibility manifests - record tools, versions, command plans, media metadata, and fallback decisions.

**Defer (v2+):**
- Full video pixel denoising - conflicts with the default no-video-recompression promise.
- GUI or TUI app - CLI-first scope should validate product value first.
- Cloud processing - outside local, private, FOSS-first constraints.
- Custom model training - separate ML product surface.
- Plugin marketplace or preset registry - wait until the pipeline schema is stable.
- Mandatory Kdenlive or Audacity processing - both are too heavy or stateful to anchor v1.

### Architecture Approach

Use a functional core with a thin imperative shell. CLI parsing, prompts, filesystem operations, external process execution, progress rendering, and batch scheduling live in adapters. Media modeling, preset resolution, stream selection, codec/container decisions, no-video-recompression fallbacks, and pipeline planning live in pure domain modules with unit tests and fixtures.

**Major components:**
1. CLI shell - owns `Bun.argv`, help text, command syntax, top-level error rendering, and exit codes.
2. Boundary parsers - convert argv, prompt answers, config, environment, `ffprobe` JSON, and tool probes into domain values.
3. Domain media model - represents containers, streams, codecs, durations, selected streams, output policies, and tool capabilities.
4. Preset resolver - turns friendly cleanup presets and overrides into typed pipeline intent.
5. Pipeline planner - builds sequential audio cleanup plans and intermediate artifact policies.
6. Remux planner - decides copy-safe video remuxing, final audio codec, alternate containers, and explicit fallback states.
7. Tool adapters - expose pure argv builders plus small runners for FFprobe, FFmpeg, SoX, Demucs, and optional Audacity.
8. Workspace and executor - create temp workspaces, run planned steps in order, keep logs/intermediates as configured, and emit structured results.
9. Reporter - renders dry-run previews, progress, warnings, fallback reasons, final summaries, and later machine-readable reports.
10. Batch runner - expands inputs, plans each file independently, caps concurrency, records per-job results, and supports safe retries.

### Critical Pitfalls

1. **Treating "preserve video" as one flag** - avoid with `ffprobe`-backed stream models, explicit `-map` decisions, `-c:v copy`, deliberate `-c:a`, compatibility checks, and typed fallback states.
2. **Encoding cleaned audio into incompatible container/codec pairs** - choose final audio codecs deliberately and test MP4, MOV, MKV, WebM, WAV, and FLAC combinations.
3. **Using lossy intermediates** - default to WAV, FLAC, or PCM-oriented intermediates and reserve lossy encoding for final delivery or explicit user opt-in.
4. **Losing A/V sync after denoising** - record source timing, probe intermediates, compare duration/sample-rate/channel layout, and make trim/pad policy explicit.
5. **Over-denoising speech** - make v1 presets conservative, label aggressive modes, add clipping/loudness checks, and provide preview/sample workflows after the baseline is stable.
6. **Skipping dependency capability discovery** - implement `doctor` and per-run preflight checks for versions, filters, encoders, muxers, effects, models, and plugins.
7. **Building shell command strings** - execute external tools with argv arrays and no shell; separately render safe display commands for logs and dry-run previews.
8. **Adding batch as a naive loop** - model each input as a job with manifest, temp output, collision checks, status, planned commands, and resumable failure handling.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Bun CLI Foundation and Domain Model
**Rationale:** Every later feature depends on strict TypeScript types, boundary parsing, safe subprocess execution, and a testable functional core.
**Delivers:** Bun project shell, strict TypeScript config, Commander/Clack/Zod wiring, stable exit-code model, safe process runner, initial `doctor` command skeleton, and domain types for requests, media, tools, policies, plans, results, and diagnostics.
**Addresses:** Local install/run, guided plus flags architecture, configurable pipeline model, dependency diagnostics, path safety.
**Avoids:** Mixed orchestration/media logic, shell-string command execution, hidden fallback states.

### Phase 2: Media Probing and No-Video-Recompression Planner
**Rationale:** Video preservation is the highest-risk promise and must be modeled before processing commands or UX can honestly describe outcomes.
**Delivers:** FFprobe adapter, JSON parsers, media fixture tests, stream-selection model, container/codec compatibility rules, `VideoOutputPlan` union, and dry-run plan output for copy-safe versus fallback-required cases.
**Addresses:** Format probing, stream preservation, fallback reporting, no-video-recompression guarantees.
**Avoids:** Treating preserve-video as one FFmpeg flag, implicit stream selection, codec/container surprises.

### Phase 3: Lossless FFmpeg/SoX Audio Pipeline
**Rationale:** The product needs a real cleanup path, but it should run through the already-tested planner and artifact policy.
**Delivers:** Lossless audio extraction, intermediate format policy, FFmpeg baseline filters, SoX_ng/SoX capability checks, conservative presets, command-builder snapshots, and quality/duration checks for intermediates.
**Uses:** FFmpeg, FFprobe, SoX_ng/SoX, Zod, Bun subprocess APIs.
**Implements:** Pipeline planner, tool adapters, workspace manager, and sequential step executor.
**Avoids:** Lossy intermediates, unmanaged sample-rate/channel changes, over-aggressive default denoising.

### Phase 4: Final Remux, Fallbacks, and Trustworthy Reporting
**Rationale:** Users do not receive the core value until cleaned audio is safely written back to audio/video outputs with a clear explanation of what happened.
**Delivers:** FFmpeg final audio encoding, video stream-copy remux, explicit stream maps, alternate container/audio-codec suggestions, final `ffprobe` verification, user-facing fallback diagnostics, and final run summaries.
**Addresses:** Video output with cleaned audio, stream-copy-first behavior, clear fallback reporting, output naming, overwrite safety.
**Avoids:** Silent re-encoding, dropped streams, raw muxer errors, A/V sync drift, "Done" without media facts.

### Phase 5: Guided Workflow, Power Flags, and Preset Transparency
**Rationale:** Guided UX should sit on top of a working single-file plan so prompts teach and confirm decisions instead of hiding missing media logic.
**Delivers:** Interactive preset selection, fallback confirmations, equivalent command output, non-interactive flags for the same request model, dry-run UX polish, conservative/aggressive preset warnings, and documented examples.
**Addresses:** Friendly CLI, power-user repeatability, simple recommended presets, plan previews, user trust.
**Avoids:** Separate guided and flag code paths, raw expert filter UX as the primary interface, hidden global config.

### Phase 6: Batch Processing and Run Manifests
**Rationale:** Batch is a core requirement, but it should reuse the proven single-file planner and executor per input rather than start as a loop around shell commands.
**Delivers:** `fast-glob` input expansion, collision-safe output naming, per-file planning and summaries, controlled `p-limit` concurrency, partial failure handling, manifests, temp-output atomic rename, and early resume/skip policies.
**Addresses:** Batch mode, per-file summaries, partial failures, output safety, future JSON/JSONL report path.
**Avoids:** Unsafe overwrites, unclear failures, reprocessing successful jobs, unbounded Demucs-style resource contention.

### Phase 7: Optional Heavy Backends and Advanced Integrations
**Rationale:** Demucs, Audacity, LADSPA, and Kdenlive/MLT are useful but should not shape v1's core architecture or become mandatory runtime dependencies.
**Delivers:** Demucs voice-isolation preset with model/cache/resource preflight; optional DeepFilterNet/RNNoise/LADSPA feasibility; Audacity macro/script-pipe spike behind opt-in security prompts; Kdenlive/MLT decision gate rather than required integration.
**Addresses:** Stronger voice isolation, advanced FOSS pipeline options, optional ecosystem compatibility.
**Avoids:** Mandatory GUI dependencies, surprise model downloads, Kdenlive dependency creep, platform-specific plugin assumptions.

### Phase Ordering Rationale

- Build the typed core and safe command-runner first because every other feature depends on parsed media/tool facts and argv-array execution.
- Prove no-video-recompression planning before audio processing so the roadmap protects the product's most important promise from the start.
- Add FFmpeg/SoX cleanup before Demucs/Audacity because FFmpeg and SoX are more scriptable, lighter, and better suited to deterministic v1 defaults.
- Put guided UX after the core plan can already explain stream-copy, codec, fallback, and output decisions.
- Put batch after single-file verification because each batch item needs independent probing, planning, collision handling, and reporting.
- Gate heavy and GUI/plugin integrations behind later research so optional ecosystems do not destabilize the base CLI.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Validate exact SoX_ng versus classic SoX installation names, effects availability, and output behavior across target OSes.
- **Phase 4:** Build and verify a codec/container compatibility matrix for common outputs; confirm copy-safe remux edge cases with real fixtures.
- **Phase 6:** Research manifest shape, resume semantics, and failure classes if stable batch mode is promised in initial launch.
- **Phase 7:** Research Demucs fork/package status, model download behavior, device controls, Audacity `mod-script-pipe` limitations, LADSPA discovery, and whether `melt` offers any practical value.

Phases with standard patterns where `/gsd-research-phase` can usually be skipped:
- **Phase 1:** Bun/TypeScript CLI shell, strict config, Zod parsing, process-runner wrapper, and unit-test setup are well-documented.
- **Phase 2:** FFprobe JSON parsing, functional-core planner design, and tagged-union state modeling are well-documented enough to proceed from existing research.
- **Phase 5:** Guided prompts, flags, dry-run display, and command echo are standard CLI UX patterns once the request model exists.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Bun/TypeScript, FFmpeg/FFprobe, Commander, Clack, Zod, Biome, and Bun test findings are backed by official docs or package metadata. Optional Demucs/Audacity/LADSPA/Kdenlive confidence is medium because install and runtime behavior varies. |
| Features | MEDIUM-HIGH | Table-stakes features align strongly with project priorities and competitor patterns. Exact v1 breadth for Demucs, Audacity, and batch resume needs validation. |
| Architecture | HIGH | Functional core, imperative shell, boundary parsing, explicit state modeling, pure command builders, and fixture-backed tests directly match Bright Builds guidance and media-domain risks. |
| Pitfalls | MEDIUM-HIGH | FFmpeg, FFprobe, Demucs, and Audacity risks are documented by official sources. Cross-platform SoX, plugin, and MLT behavior requires implementation-time validation. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Target platform support:** Decide which operating systems are officially supported in v1 and validate FFmpeg, SoX, and Demucs discovery on those systems.
- **Codec/container matrix:** Define and test common output decisions for MP4, MOV, MKV, WebM, WAV, FLAC, AAC, Opus, Vorbis, PCM, and FLAC.
- **Multi-stream preservation policy:** Decide how v1 handles multiple audio tracks, subtitles, chapters, attachments, metadata, and rotation/display metadata.
- **SoX_ng availability:** Confirm whether docs should recommend `sox_ng`, classic `sox`, or both per platform.
- **Demucs maintenance path:** Pick a default external invocation and document the current fork/package recommendation before making it a user-facing preset.
- **Audacity scope:** Validate whether scripting/macro support can deliver the desired value; otherwise keep Audacity out of launch scope.
- **Batch launch bar:** Decide whether resumable manifests are v1 required or v1.x hardening; batch should not be advertised as stable without collision-safe and partial-failure behavior.
- **Quality verification fixtures:** Gather representative media fixtures or generated synthetic fixtures for multiple streams, long duration, sync offsets, noisy speech, clipping, and container incompatibility.

## Sources

### Primary (HIGH confidence)
- `STACK.md` - Bun, TypeScript, FFmpeg/FFprobe, SoX_ng/SoX, package versions, and external tool discovery contract.
- `FEATURES.md` - launch table stakes, differentiators, anti-features, MVP definition, and Bright Builds design implications.
- `ARCHITECTURE.md` - functional-core/imperative-shell structure, component boundaries, data flow, no-video-recompression model, and verification strategy.
- `PITFALLS.md` - critical media, dependency, UX, security, and batch pitfalls mapped to roadmap phases.
- Bright Builds Rules at commit `05f8d7a6c9c2e157ec4f922a05273e72dab97676` - architecture, code shape, verification, testing, and TypeScript/JavaScript guidance.
- Bun documentation - runtime APIs, subprocesses, TypeScript config, and executable builds.
- FFmpeg and FFprobe documentation - stream selection, `-map`, streamcopy, filters, transcoding, JSON probing, and format behavior.

### Secondary (MEDIUM confidence)
- SoX and SoX_ng documentation and manpage mirrors - `noiseprof`, `noisered`, effects, stats, and packaging caveats.
- Demucs PyPI, original repository, and maintained fork documentation - source separation behavior, output formats, device/runtime controls, and maintenance status.
- Audacity scripting, macro, and noise reduction docs - `mod-script-pipe`, macro behavior, noise-profile requirements, and security/automation limitations.
- Kdenlive and MLT docs - render profiles, LADSPA effect context, `melt` presets, and optional ecosystem guidance.
- npm package metadata - Commander, extra typings, Clack, Zod, yaml, p-limit, fast-glob, Biome, TypeScript, and `@types/bun` versions.

### Tertiary (LOW confidence)
- Community FFmpeg audio-replacement examples - useful for examples but not sufficient authority for stream mapping, metadata, or no-recompression guarantees.
- Community multimedia wrapper projects - useful for feature inspiration and integration shape, but require validation before adopting behavior.

---
*Research completed: 2026-05-01*
*Ready for roadmap: yes*
