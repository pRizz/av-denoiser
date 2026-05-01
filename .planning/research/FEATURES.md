# Feature Research

**Domain:** Audio/video denoising CLI and local media cleanup pipelines
**Researched:** 2026-05-01
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Single-file audio cleanup | Every comparable denoise CLI starts with "input file -> cleaned output" as the core workflow. | MEDIUM | Must support common audio formats by normalizing through FFmpeg when backend tools require WAV or a fixed sample rate. |
| Video input with cleaned audio output | Creator workflows usually start from MP4/MOV/MKV interview, lecture, or screen-recording files, not standalone WAV files. | HIGH | Treat video as a first-class media input whose audio is replaced after processing. |
| Video stream preservation by default | FFmpeg streamcopy is fast and avoids quality loss, and the project explicitly values preserving video without recompression. | HIGH | First-class feature: plan `-c:v copy` where legal, keep non-audio streams when safe, and never silently re-encode video. |
| Clear fallback reporting when video cannot be stream-copied | FFmpeg documents that streamcopy can fail when the target container lacks required information or compatibility, so users need an explanation. | MEDIUM | First-class feature: report whether video was copied, remuxed, or would require re-encoding; include the reason and suggested output container. |
| Format probing and support matrix | Tools have different constraints: DeepFilterNet binary expects 48 kHz WAV, Demucs resamples, FFmpeg filters vary by build. | MEDIUM | Use `ffprobe`/tool probes to parse raw media into domain types before planning the pipeline. |
| Friendly guided workflow | The project is positioned for users who should not need to memorize flags before getting value. | MEDIUM | Guided prompts should choose input, output, preset, video-copy policy, and batch scope, then show the planned work before running. |
| Non-interactive flags | Power users need repeatable shell, CI, cron, and batch workflows. | MEDIUM | Every guided choice should have an equivalent CLI/config representation. |
| Batch processing | Current denoise tools commonly accept multiple files or folder-style workflows; media cleanup is often repetitive. | MEDIUM | Support file lists and directories, per-file summaries, partial failure handling, and collision-safe output names. |
| Recommended presets | Users expect choices like light cleanup, voice focus, noisy room, strong isolation, and normalize-only. | MEDIUM | Presets should compile to typed pipeline plans rather than freeform strings. |
| Configurable free/open-source pipeline | The core product promise is a sequence of FOSS tools users can enable, disable, and tune. | HIGH | Model pipeline steps as explicit variants, such as `ffmpeg-afftdn`, `sox-noisered`, `demucs-vocals`, and optional Audacity macro adapters. |
| Tool availability checks | External tools have different install paths, model downloads, GPU/CPU modes, and platform constraints. | MEDIUM | Add a `doctor` or preflight check that reports missing tools, versions, models, and likely remediation. |
| Audio quality safeguards | Denoising can create artifacts, clipping, speech damage, or loudness jumps. | HIGH | Include clipping detection/prevention, optional normalization, conservative defaults, dry/wet or strength controls where supported, and warnings for aggressive presets. |
| Intermediate artifact handling | Multi-step pipelines need extracted audio, normalized WAV, denoised stems, and remuxed outputs. | MEDIUM | Default to cleanup, but offer `--keep-temp`/debug output for troubleshooting. |
| Progress, logging, and summary output | Batch media processing can be slow, especially Demucs or high-quality filters. Users need visibility. | MEDIUM | Provide quiet, normal, verbose, and eventually JSON/JSONL modes; keep errors on stderr for automation. |
| Dry-run / plan preview | Comparable production CLIs expose dry-run JSON previews, and this project has enough fallback logic to justify previewing. | MEDIUM | Show selected preset, resolved tools, stream-copy decision, expected outputs, and fallback risks before processing. |
| Output naming and overwrite safety | Batch tools must avoid destroying source files or clobbering previous outputs. | LOW | Default to suffixes like `_clean`, explicit `--output`, `--force` for overwrite, and stable per-file paths in batch mode. |
| Exit codes and machine-readable failure classes | Power users need scripts to distinguish unsupported input, missing tool, pipeline failure, and fallback-required outcomes. | MEDIUM | Make invalid workflow states unrepresentable internally, then map typed failures to stable CLI exits. |
| Basic before/after inspection hooks | Users need confidence that cleanup helped rather than damaged speech. | MEDIUM | Start with stats/reporting; later add optional short sample export or side-by-side snippets. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Guided CLI that still prints the equivalent command | Teaches users without trapping them in interactive mode. | MEDIUM | After a guided run, show the repeatable command/config that recreates it. |
| Stream-copy-first video policy with explainable fallbacks | Many simple tools say they "keep video quality" but do not expose the actual stream-copy/remux decision. | HIGH | This should be a headline differentiator for video creators. |
| Typed pipeline planner | Prevents impossible combinations, such as asking a WAV-only model to process MP4 directly or combining video filters with no-reencode guarantees. | HIGH | Bright Builds guidance points toward boundary parsing plus data-in/data-out planning functions. |
| Preset-to-pipeline transparency | Users can start friendly and later inspect or tune the actual tool chain. | MEDIUM | Useful bridge between nontechnical users and FFmpeg/SoX/Demucs power users. |
| Configurable FOSS backend strategy | Avoids locking the project to one denoiser and lets users choose quality, speed, hardware, and licensing tradeoffs. | HIGH | Start with FFmpeg/SoX, add Demucs/DeepFilterNet-style steps behind explicit presets or optional installs. |
| Per-file batch report with fallback decisions | Batch success is not binary; some files may preserve video, others may need different containers or audio codecs. | MEDIUM | Produce a table for humans and a future JSONL report for scripts. |
| "Conservative by default" audio policy | Differentiates from one-click aggressive denoisers that can produce underwater artifacts. | MEDIUM | Default presets should protect speech intelligibility and require explicit opt-in for strong isolation. |
| Dependency and model cache awareness | ML tools may download models or need GPU memory; users appreciate knowing before a long run starts. | MEDIUM | Preflight can estimate whether a preset may download models, use CUDA/CPU, or run slowly. |
| Resume and skip completed files | Batch media runs can be long and fragile. | MEDIUM | Use output manifests or hash-based records after MVP if batch usage validates. |
| Optional comparison snippets | Lets users audition the first N seconds or a sampled segment before committing a full batch. | MEDIUM | Especially useful for SoX profile amount, FFmpeg `afftdn` strength, and Demucs voice isolation. |
| Preset packs for common creator contexts | Users think in scenarios, not filters. | LOW | Examples: podcast voice, classroom lecture, conference room, phone recording, hiss/hum cleanup, normalize-only. |
| Audit trail / reproducibility manifest | Supports repeatable media pipelines and bug reports. | MEDIUM | Record versions, commands, preset, input metadata, copy/fallback decisions, and output paths. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Always re-encode video | Simplifies implementation for video outputs. | Violates the core value, costs time, can degrade quality, and hides when video pixels changed. | Stream-copy by default; report when fallback requires re-encode and ask/require a flag. |
| Silent fallback from copy to re-encode | Makes more files "just work." | Users lose trust when quality, size, time, or metadata change without warning. | Explicit fallback report plus opt-in `--allow-video-reencode`. |
| Raw FFmpeg filtergraph as primary UX | Power users may ask for maximum control. | Invalid states multiply, guided users are overwhelmed, and typed pipeline planning becomes harder. | Provide presets and typed step options first; allow expert raw overrides later as an escape hatch. |
| Mandatory Audacity automation | Audacity has familiar noise reduction and macros. | Official scripting docs say Noise Reduction is not currently available from scripting, and macro behavior around noise profiles is awkward for reliable CLI automation. | Treat Audacity as optional/exportable macro inspiration until integration is proven. |
| Mandatory Kdenlive integration | It sounds like a way to access video-editor filters. | A video editor dependency is heavy for a CLI audio cleanup tool and likely duplicates FFmpeg/LADSPA capabilities. | Keep Kdenlive informational; use FFmpeg/LADSPA/SoX directly where practical. |
| Proprietary or paid denoise engines in v1 | Some products have strong cleanup quality. | Conflicts with the FOSS/local scope and can complicate licensing, privacy, and install. | Keep v1 to free/open-source tools; leave plugin adapters as future optional work. |
| Cloud processing service | Avoids local installs and GPU constraints. | Conflicts with local/private/dependency-light v1 and changes the product category. | Provide local-only processing; document install constraints clearly. |
| Train custom models | Appealing for advanced users. | Huge scope, data requirements, hardware requirements, and support burden. | Use pretrained FOSS models and configurable presets. |
| Full video denoising / image cleanup in v1 | The name may suggest video pixel denoising. | Applying video filters requires video decoding/re-encoding, which conflicts with preserving the video stream. | Scope v1 to audio cleanup for audio/video containers; consider video-pixel denoise as a separate future mode with explicit re-encode. |
| Automatic in-place replacement | Saves disk space. | Risky for original media, especially when denoise quality is subjective. | Always write new outputs; offer explicit overwrite only for outputs, not source replacement. |
| Aggressive cleanup as default | Demo output can sound dramatically cleaner. | Speech can become metallic/underwater and music/background ambience can be damaged. | Start conservative, show strength controls, and warn on strong isolation presets. |
| Hidden global config that changes results | Convenient once set. | Makes runs hard to reproduce and debug. | Prefer explicit config files, printed effective config, and manifests. |

## Feature Dependencies

```text
Input probing and tool preflight
    -> Typed media and pipeline plan
        -> Guided workflow
        -> Non-interactive flags
        -> Dry-run / plan preview
        -> Clear fallback reporting

FFmpeg extraction and stream mapping
    -> Single-file audio cleanup
    -> Video audio replacement
        -> Video stream preservation
            -> Fallback reporting
            -> Batch per-file summary

Recommended presets
    -> Configurable pipeline steps
        -> Quality safeguards
        -> Reproducibility manifest

Batch processing
    -> Collision-safe output naming
    -> Per-file errors and summaries
    -> Optional resume / skip completed files

ML voice isolation backends
    -> Tool/model preflight
    -> Device and memory options
    -> Conservative warning and audition workflow

Full video pixel denoising
    -> conflicts with -> Default no-video-reencode policy
```

### Dependency Notes

- **Video preservation requires probing and planning:** the CLI must know container, stream layout, codec compatibility, and output format before it can promise streamcopy.
- **Fallback reporting requires typed failure reasons:** "could not copy video" should become specific states such as incompatible output container, unsupported stream, missing codec, filter requires decoding, or user policy disallows re-encode.
- **Guided UX requires presets first:** prompts should select a validated preset and only then expose advanced knobs.
- **Power flags require the same domain model as guided mode:** flags should parse into the same typed pipeline plan instead of maintaining a second code path.
- **Batch depends on per-file isolation:** one bad file should not erase progress for the rest of the batch.
- **Demucs/DeepFilterNet-style features require preflight:** model downloads, fixed sample-rate expectations, GPU/CPU mode, memory limits, and runtime duration should be visible before execution.
- **Audacity macros are not a stable core dependency:** macros can inform workflows, but Noise Reduction scripting limitations make it risky as a v1 required backend.

## MVP Definition

### Launch With (v1)

Minimum viable product - what's needed to validate the concept.

- [ ] Single-file audio cleanup through a conservative FFmpeg/SoX pipeline - validates local cleanup value.
- [ ] Video input -> cleaned-audio video output with stream-copy-first behavior - validates the central creator workflow.
- [ ] Explicit no-reencode fallback report - prevents silent quality loss and satisfies the project requirement.
- [ ] Guided interactive workflow with recommended presets - makes the CLI friendly on first use.
- [ ] Equivalent non-interactive flags for the same workflows - keeps the tool scriptable.
- [ ] Basic batch mode with per-file summaries and partial failure handling - supports repeatable media cleanup.
- [ ] Tool preflight/doctor for FFmpeg and SoX - reduces setup friction and makes errors actionable.
- [ ] Dry-run plan preview - lets users see stream-copy and pipeline decisions before processing.
- [ ] Output naming and overwrite safety - protects source media and batch outputs.
- [ ] Human-readable final report - summarizes input, preset, steps, output, video preservation status, and warnings.

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Demucs voice-isolation preset - add when baseline cleanup cannot handle noisy voice recordings well enough.
- [ ] DeepFilterNet/RNNoise backend option - add when speech-enhancement quality needs a stronger FOSS model than FFmpeg/SoX.
- [ ] JSON/JSONL report mode - add when automation and agent workflows become common.
- [ ] Keep-temp/debug manifest - add when users report hard-to-diagnose pipeline failures.
- [ ] Audition snippets or before/after samples - add when users need help choosing preset strength.
- [ ] Resume/skip completed files for batch runs - add when long batch runs become common.
- [ ] More detailed stream mapping controls - add when users process files with multiple audio tracks, subtitles, or data streams.
- [ ] Optional Audacity macro export/import - add only after practical CLI automation is proven.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Full video pixel denoising - defer because it requires video re-encoding and changes the product promise.
- [ ] GUI or TUI application - defer because v1 is CLI-first.
- [ ] Cloud processing - defer because v1 is local/private/FOSS-first.
- [ ] Custom model training - defer because it is a separate ML product surface.
- [ ] Multitrack production mixer - defer unless podcast/interview users need separate speaker tracks.
- [ ] Plugin marketplace/preset registry - defer until a stable pipeline schema exists.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Single-file audio cleanup | HIGH | MEDIUM | P1 |
| Video input with cleaned audio output | HIGH | HIGH | P1 |
| Video stream preservation | HIGH | HIGH | P1 |
| Clear fallback reporting | HIGH | MEDIUM | P1 |
| Format probing and support matrix | HIGH | MEDIUM | P1 |
| Guided workflow | HIGH | MEDIUM | P1 |
| Non-interactive flags | HIGH | MEDIUM | P1 |
| Batch processing | HIGH | MEDIUM | P1 |
| Recommended presets | HIGH | MEDIUM | P1 |
| Tool preflight/doctor | HIGH | MEDIUM | P1 |
| Dry-run / plan preview | MEDIUM | MEDIUM | P1 |
| Output naming and overwrite safety | HIGH | LOW | P1 |
| Human-readable final report | HIGH | LOW | P1 |
| Configurable pipeline steps | HIGH | HIGH | P2 |
| Audio quality safeguards | HIGH | HIGH | P2 |
| Machine-readable JSON/JSONL reports | MEDIUM | MEDIUM | P2 |
| Demucs voice isolation | HIGH | HIGH | P2 |
| DeepFilterNet/RNNoise backend | HIGH | HIGH | P2 |
| Before/after audition snippets | MEDIUM | MEDIUM | P2 |
| Resume/skip completed batch files | MEDIUM | MEDIUM | P2 |
| Multi-audio-track controls | MEDIUM | HIGH | P2 |
| Audacity macro integration | MEDIUM | HIGH | P3 |
| Full video pixel denoising | MEDIUM | HIGH | P3 |
| GUI/TUI | MEDIUM | HIGH | P3 |

**Priority key:**

- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | DeepFilterNet / DFM-style tools | Demucs | Auphonic CLI / production CLIs | Our Approach |
|---------|---------------------------------|--------|--------------------------------|--------------|
| Simple single command | `deep-filter` and DFM-style wrappers support simple input-to-output cleanup. | `demucs PATH` separates tracks. | `process input --wait --download` style workflows. | Offer `av-denoiser input.mp4` plus guided mode when flags are missing. |
| Batch processing | Multiple files and output directory are common. | Multiple input files and `-j` jobs are supported, with memory warnings. | Batch is usually achieved through scripts/CI around a scriptable CLI. | Built-in batch with per-file isolation and summaries. |
| Presets/models | Model and post-filter flags are exposed. | Model names, two-stem mode, segment, overlap, jobs, clip mode. | Presets are a core production concept. | Friendly presets compile into typed pipeline steps and can be inspected. |
| Format handling | Some tools require WAV/48 kHz or resample automatically. | Reads common audio formats, resamples as needed, uses FFmpeg on Windows. | Handles production input/output formats through service API. | Probe media and normalize inputs per backend, with warnings for sample-rate or codec changes. |
| Video handling | DFM-style tools accept video and reassemble with cleaned audio. | Audio/source-separation focused. | Audio/podcast production focused. | Preserve video streams by default and report fallback decisions clearly. |
| Progress/reporting | Verbose/log-level flags are common. | CLI output plus resource-related flags. | Dry-run JSON, JSON/JSONL, quiet, verbose, exit-code-friendly behavior. | Start with human reports, design for JSON/JSONL once stable. |
| Tool pipeline transparency | Usually tied to one backend. | Single ML backend family. | Presets hide service-side algorithms. | Expose a configurable FOSS pipeline while keeping presets approachable. |
| Local/FOSS scope | DeepFilterNet and Demucs are FOSS; wrappers vary. | MIT, but not actively maintained in the original repository. | Cloud service, not the v1 target. | Prefer local FOSS backends and flag maintenance/licensing risks. |

## Source-Derived Feature Implications

| Source Finding | Confidence | Product Implication |
|----------------|------------|---------------------|
| FFmpeg streamcopy copies packets without decode/filter/encode, is fast and lossless, but may not work in all container/stream cases. | HIGH | Make video preservation and fallback reporting explicit launch features. |
| FFmpeg filters include audio denoisers such as `afftdn` and `arnndn`; `afftdn` exposes noise reduction, floor, tracking, and noise-profile commands. | HIGH | FFmpeg can support baseline presets and expert strength controls. |
| SoX `noiseprof`/`noisered` requires a noise-only profile and amount tuning; higher amounts risk removing wanted signal. | MEDIUM | Guided presets should be conservative and should explain/profile the noise sample path. |
| DeepFilterNet CLI supports model selection, postfilter, delay compensation, output directory, verbosity, and fixed 48 kHz WAV constraints. | HIGH | Backend adapters need sample-rate normalization, delay/alignment options, and preflight warnings. |
| Demucs supports multi-file input, two-stem vocals, model selection, output formats, device, segment, overlap, jobs, and clipping modes. | HIGH | Voice isolation is valuable but should be optional and preflighted for runtime/memory. |
| Demucs original repository states it is no longer actively maintained. | HIGH | Treat Demucs as useful but risk-managed; avoid making it the only core backend. |
| Audacity macros can batch apply effects, but Noise Reduction is documented as not currently available from scripting and macro noise-profile behavior is awkward. | HIGH | Do not require Audacity for v1; consider optional macro export only after deeper integration research. |
| Auphonic CLI exposes dry-run JSON, quiet mode, structured JSON/JSONL output, exit-code-friendly scriptability, presets, and progress/wait behaviors. | MEDIUM | These are good UX patterns for a local CLI even though Auphonic itself is cloud/proprietary. |

## Bright Builds Design Implications

- Parse CLI flags, guided answers, config files, and probed media metadata at boundaries into typed domain values.
- Make workflow states explicit: audio-only output, video-copy-safe output, fallback-required output, and reencode-required output should not be optional booleans on one loose object.
- Keep the preset resolver and pipeline planner as pure data-in/data-out TypeScript functions so tests can cover invalid combinations without invoking FFmpeg, SoX, or ML tools.
- Keep tool execution, filesystem I/O, temp directories, and subprocess logging in a thin imperative shell.
- Preserve user-facing operability with dry-run previews, clear fallback reports, breadcrumb-heavy logs, and stable summaries.

## Sources

- FFmpeg documentation, streamcopy and transcoding: https://ffmpeg.org/ffmpeg.html
- FFmpeg filters documentation, `afftdn` and `arnndn`: https://ffmpeg.org/ffmpeg-filters.html
- DeepFilterNet README: https://github.com/Rikorose/DeepFilterNet
- Demucs README: https://github.com/facebookresearch/demucs
- SoX effects manual: https://www.manpagez.com/man/7/soxeffect/
- Audacity scripting reference: https://audacity.gitbook.io/dev/scripting/scripting-reference
- Audacity macro documentation: https://github.com/audacity/audacity-support/blob/main/audio-editing/macros/manage-macros.md
- Auphonic CLI documentation: https://auphonic.com/help/resources/cli.html
- Example FOSS multimedia wrapper research: https://github.com/svemyh/deepfilter-multimedia
- Example FOSS denoise backend wrapper research: https://github.com/oele-isis-vanderbilt/denoise-audio

---
*Feature research for: audio/video denoising CLI products and local media cleanup pipelines*
*Researched: 2026-05-01*
