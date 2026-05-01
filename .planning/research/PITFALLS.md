# Pitfalls Research

**Domain:** Audio/video denoising CLI and external media-tool orchestration
**Researched:** 2026-05-01
**Confidence:** MEDIUM

Confidence is high for FFmpeg, FFprobe, Demucs, Audacity, Kdenlive, and MLT behaviors that are documented in official sources. Confidence is medium overall because SoX packaging, Kdenlive headless behavior, and cross-platform binary availability vary by OS/package manager and should be validated during implementation.

## Critical Pitfalls

### Pitfall 1: Treating "preserve video" as a single FFmpeg flag

**What goes wrong:**
The CLI promises "no video recompression" but builds commands with broad `-c copy`, implicit stream selection, or output extensions alone. This can fail outright, silently choose the wrong stream, drop alternate audio/subtitles/metadata, or accidentally re-encode video when only audio should change.

Common video-copy/remux failure modes:

- Using global `-c copy` after producing cleaned PCM/WAV audio, then trying to mux that audio into a target container that does not accept it.
- Forgetting that filters require decoded frames, so stream copy and filtering cannot be applied to the same stream.
- Letting FFmpeg auto-select streams in files with multiple audio tracks, commentary tracks, descriptive audio, subtitles, data streams, attachments, or chapters.
- Assuming stream handling options influence stream selection. FFmpeg applies codec choices after stream selection, so selection must be explicit.
- Specifying an encoder that produces a stream the output muxer cannot accept, causing FFmpeg to abort after work has already started.
- Changing containers without checking whether the existing video bitstream has the metadata/extradata required by the target container.
- Replacing audio without preserving the original video stream mapping, rotation/display metadata, chapters, and user-expected side streams.

**Why it happens:**
FFmpeg commands look deceptively simple, and many examples are optimized for one input file with one video and one audio stream. A denoiser has a harder shape: it must decode/process only audio, choose a container-compatible cleaned-audio codec, and copy the video stream unchanged when possible.

**How to avoid:**
Make media planning a pure, unit-tested decision layer before command execution.

- Always probe with `ffprobe` using machine-readable output before building commands.
- Represent each input as typed domain data: container, streams, codecs, duration, time base, language, default flags, dispositions, metadata, and chapters.
- Build explicit maps, for example "copy selected video stream(s) from input 0; map cleaned audio from input 1; preserve or intentionally drop side streams according to a visible policy."
- Use stream-specific codec choices: `-c:v copy` for video, and an explicit cleaned-audio codec selected for the target container.
- Validate the planned command against a compatibility table and, where possible, a short dry-run/remux probe before processing a full file.
- If no-video-copy is impossible, report why and offer a named fallback such as "copy video into MKV", "encode audio to AAC for MP4", or "allow video transcode".

**Warning signs:**

- FFmpeg command builder accepts only input path and output path, with no typed stream model.
- Tests assert command strings instead of command plans and stream decisions.
- Commands use `-c copy` globally after audio processing.
- Multiple-stream fixtures are missing.
- The CLI says "converted" or "done" without stating whether video was copied, audio was encoded, and which streams were preserved or dropped.

**Phase to address:**
Phase 1: Media probe and command-plan engine.

**Release priority:**
V1 blocker.

---

### Pitfall 2: Encoding cleaned audio into an incompatible or surprising container/codec pair

**What goes wrong:**
The CLI cleans audio to a lossless intermediate, then writes the final file using the input extension, output extension, or FFmpeg defaults without choosing a compatible audio codec deliberately. Users see failures such as "could not write header", playable-but-surprising files, missing audio, unsupported playback on common devices, or final audio that is lossy when they expected lossless.

**Why it happens:**
Developers conflate file extension, container, and codec. They also assume that "copy audio" can apply after the denoise pipeline, even though the cleaned audio is a new stream.

**How to avoid:**

- Treat final audio encoding as a separate policy decision from video copying.
- Choose conservative v1 defaults: AAC for MP4/MOV style outputs, Opus or Vorbis for WebM where appropriate, FLAC/PCM for audio-only lossless outputs, and MKV as the flexible fallback when preserving unusual streams matters more than device compatibility.
- Never let FFmpeg choose the default audio encoder invisibly for user-facing output.
- Expose the selected final audio codec, bitrate/sample rate, and container in the preview/summary.
- Unit test representative combinations: MP4 + AAC, MOV + AAC/PCM decisions, MKV + FLAC/Opus/AAC, WebM restrictions, audio-only WAV/FLAC.

**Warning signs:**

- Output codec selection is based only on filename extension.
- FFmpeg commands omit `-c:a` for final outputs.
- Errors from the muxer are shown raw without a human explanation.
- There is no fallback when the requested output container cannot carry the cleaned stream.

**Phase to address:**
Phase 1: Media probe and command-plan engine; Phase 3: Final remux and compatibility fallbacks.

**Release priority:**
V1 blocker.

---

### Pitfall 3: Using lossy intermediate files inside the denoise pipeline

**What goes wrong:**
The pipeline extracts source audio to MP3/AAC, runs SoX/Demucs/Audacity on that lossy file, then encodes again for the final video. The output can sound worse than the input even if the denoise step "worked", especially on speech consonants, room tone, and quiet sections.

**Why it happens:**
Lossy files are smaller and examples often use MP3 for convenience. Demucs also supports `--mp3`, which is tempting for intermediate storage even though it is the wrong default for a cleanup chain.

**How to avoid:**

- Use WAV, FLAC, or another lossless PCM-oriented intermediate between tools.
- Prefer a single internal sample format policy for v1, such as 48 kHz or source-rate PCM WAV/FLAC, and document when tools force conversion.
- Use Demucs `--float32` or `--int24` deliberately when preserving headroom matters; otherwise account for its documented default int16 WAV output.
- Keep lossy encoding only at the final delivery step unless the user explicitly chooses a lossy intermediate for disk constraints.
- Write intermediate metadata into the run manifest: sample rate, channels, bit depth/sample format, tool, command, and source stream.

**Warning signs:**

- The intermediate directory contains `.mp3`, `.m4a`, or low-bitrate `.ogg` files by default.
- Each pipeline step independently chooses its own output format.
- Tests only check that files exist, not that intermediate format policy is followed.
- The CLI has no "show pipeline" or manifest output.

**Phase to address:**
Phase 2: Lossless audio pipeline and artifact management.

**Release priority:**
V1 blocker.

---

### Pitfall 4: Losing A/V sync after denoising

**What goes wrong:**
The final video slowly drifts out of sync, ends early, has trailing silence, or starts with audio offset. Users often notice this only after upload or after processing a long lecture/interview.

**Why it happens:**
Audio tools may resample, trim, pad, split into chunks, alter channel layout, or emit slightly different duration/timestamp behavior. Demucs resamples on the fly and emits 44.1 kHz stereo WAV stems by default. Audacity and SoX effects can alter duration when trimming, silence removal, or selections/macros are involved.

**How to avoid:**

- Record source audio duration, sample rate, channel count, start time, and stream time base from `ffprobe`.
- After every tool step, probe the intermediate and compare duration/sample rate/channel layout against expected tolerances.
- Make trim/pad behavior explicit in presets and summaries.
- For final muxing, choose a deliberate sync policy: preserve full video duration, pad audio, trim audio, or stop at shortest stream. Never hide this behind an implicit default.
- Include long-file fixtures and synthetic offset fixtures in tests.

**Warning signs:**

- The pipeline does not probe intermediates.
- Demucs, SoX, and Audacity steps are chained by filename only, without metadata checks.
- The final FFmpeg command uses `-shortest` everywhere without explaining the consequence.
- Only short sample clips are tested.

**Phase to address:**
Phase 2: Lossless audio pipeline and artifact management; Phase 3: Final remux and verification.

**Release priority:**
V1 blocker.

---

### Pitfall 5: Over-denoising and destroying the wanted signal

**What goes wrong:**
The tool removes hiss but also damages voices, creates musical-noise artifacts, pumps room tone, clips peaks, or makes speech less intelligible. Users lose trust because the CLI presents one "cleaned" answer without showing tradeoffs.

**Why it happens:**
Noise reduction is content-dependent. Audacity documents that Noise Reduction works best for constant background noise and is not suitable for irregular noise like traffic or audience sounds. SoX `noisered` requires a representative noise profile and higher amounts increase the chance of damaging wanted audio. Demucs can rescale stems to avoid clipping, which may change relative volumes.

**How to avoid:**

- Design v1 presets around conservative speech cleanup, not maximum noise removal.
- Keep "aggressive" modes opt-in and label them as more likely to introduce artifacts.
- Provide short before/after preview generation or at least a sample window mode.
- For profile-based tools, make noise-profile selection explicit and explain when a profile cannot be inferred safely.
- Add loudness, peak, clipping, and duration checks after each step.
- Keep originals and intermediates until the run completes successfully.

**Warning signs:**

- Presets are named only "low/medium/high" with no explanation.
- A single noise profile is reused across unrelated batch files.
- There is no artifact warning for variable noise.
- The tool deletes intermediates before the final output has been verified.

**Phase to address:**
Phase 4: Guided presets and quality safeguards.

**Release priority:**
V1 blocker for default presets; later hardening for advanced preview/comparison UX.

---

### Pitfall 6: Treating Audacity as a normal headless CLI dependency

**What goes wrong:**
Automation works on the developer machine but fails for users because Audacity scripting requires enabling `mod-script-pipe`, restarting Audacity, interacting with a GUI/project window, managing named pipes, and handling weak or missing error messages. On shared systems, enabling scripting can also weaken local security.

**Why it happens:**
Audacity has powerful macros and scripting, but the documented scripting interface is intended mainly for advanced users/developers and drives Audacity through named pipes from outside the UI. It is not a simple batch CLI engine.

**How to avoid:**

- Do not make Audacity a required v1 runtime dependency.
- Treat Audacity support as an optional integration with an explicit preflight: version, scripting module enabled, pipe available, security warning accepted, macro present, export settings known.
- Prefer FFmpeg/SoX/Demucs for default v1 scripted paths.
- If Audacity macros are supported, generate deterministic macro files and document where they live per OS.
- Avoid using Audacity scripting in server or multi-user contexts.

**Warning signs:**

- The roadmap says "Audacity noise reduction" without a phase for module enablement, macro export settings, and security prompts.
- Tests assume Audacity is installed and already configured.
- Errors are just "Audacity failed" without pipe/module diagnostics.
- The CLI tries to control a running GUI app in non-interactive batch mode.

**Phase to address:**
Phase 6: Optional Audacity integration after core FFmpeg/SoX/Demucs pipeline.

**Release priority:**
Later hardening/optional integration. Not a v1 blocker unless Audacity becomes a promised v1 path.

---

### Pitfall 7: Promoting Kdenlive itself to a required processing engine

**What goes wrong:**
The CLI depends on Kdenlive for audio cleanup and inherits a large GUI/editor stack, MLT preset discovery, LADSPA plugin discovery, render-profile quirks, and headless rendering problems. Users install the CLI expecting a simple denoiser but are forced into video-editor dependencies.

**Why it happens:**
Kdenlive exposes useful ideas and FFmpeg/MLT/LADSPA effects, but Kdenlive is an editor. Its render profiles are ultimately FFmpeg/MLT parameters, and its LADSPA effects require plugin availability that varies by system.

**How to avoid:**

- Use Kdenlive research to inform FFmpeg/MLT/LADSPA choices, not as a required v1 dependency.
- If Kdenlive/MLT is explored, validate `melt`, preset enumeration, LADSPA path discovery, and audio-only filter behavior separately from Kdenlive GUI behavior.
- Keep a clear dependency policy: FFmpeg/FFprobe required; SoX and Demucs optional/feature-gated; Audacity/Kdenlive optional experiments unless proven practical.

**Warning signs:**

- The CLI invokes `kdenlive` or `kdenlive_render` directly for simple audio cleanup.
- There is no `melt -query presets` or LADSPA discovery check.
- Kdenlive is listed as required before FFmpeg/SoX/Demucs basics work.
- The app cannot explain which filters are available on the user's machine.

**Phase to address:**
Phase 7: Kdenlive/MLT feasibility spike, if roadmap still wants it.

**Release priority:**
Later hardening/optional integration. Not a v1 blocker.

---

### Pitfall 8: Skipping dependency capability discovery

**What goes wrong:**
The CLI finds an executable name on `PATH` and assumes the installed build supports the needed codecs, muxers, filters, models, plugins, GPU/CPU mode, and JSON output. Processing fails late, or worse, falls back to a different behavior without telling the user.

**Why it happens:**
Media tools are commonly installed through OS package managers, static builds, Homebrew, Conda, pip, app bundles, or third-party Windows builds. FFmpeg itself provides source code and points users to external binary distributors. Feature sets differ by build.

**How to avoid:**

- Implement `doctor` and per-run preflight checks before processing.
- Check command path, version, and minimum capability for each enabled tool.
- For FFmpeg/FFprobe: verify JSON probing, needed demuxers/muxers, encoders, decoders, and filters.
- For SoX: verify effect availability (`noiseprof`, `noisered`, `stats`, `gain`, `norm`) and format support.
- For Demucs: verify executable/module invocation, model availability/download behavior, Python environment, device mode, and memory-sensitive options.
- For Audacity/Kdenlive/MLT: verify optional integration prerequisites before offering them in presets.
- Cache capability results with tool path/version keys, but invalidate when paths or versions change.

**Warning signs:**

- The CLI only runs `which ffmpeg` or `command -v`.
- There is no `doctor` command.
- Errors tell the user to "install FFmpeg" even when FFmpeg exists but lacks the required encoder/muxer/filter.
- Demucs model download or GPU fallback occurs during a batch without prior notice.

**Phase to address:**
Phase 1: Dependency discovery and diagnostics.

**Release priority:**
V1 blocker.

---

### Pitfall 9: Building command lines as shell strings

**What goes wrong:**
Files with spaces, quotes, Unicode characters, leading dashes, brackets, or glob characters fail or are interpreted as flags. Batch processing corrupts paths. Unsafe quoting can turn user-controlled filenames into shell behavior.

**Why it happens:**
Examples on the web are usually shell snippets. A TypeScript CLI should not paste those snippets into `sh -c`. Demucs has also had community reports where loop/stdin behavior corrupted filenames in shell pipelines.

**How to avoid:**

- Use Bun/Node child process APIs with argument arrays, never shell-joined command strings, for repo-owned orchestration.
- Use `--` before user paths where supported by the tool.
- Keep command-plan rendering separate from command execution so logs can show a safe display command without being the execution surface.
- Test paths with spaces, quotes, Unicode, leading dashes, and nested directories.
- Avoid stdin-driven shell loops for Demucs batch execution; feed explicit argument arrays per file.

**Warning signs:**

- Code contains `exec("ffmpeg ... " + path)` or hand-rolled quote escaping.
- Tests use only simple ASCII filenames.
- Batch implementation pipes `find` into external tools.
- The same string is used for both display and execution.

**Phase to address:**
Phase 1: External command runner and path safety.

**Release priority:**
V1 blocker.

---

### Pitfall 10: Batch mode that is not resumable, auditable, or collision-safe

**What goes wrong:**
A batch run overwrites files, skips unclear failures, leaves partial outputs that look complete, reprocesses successful files on retry, or loses the mapping between inputs, commands, intermediates, and outputs.

**Why it happens:**
Batch support is often added as a loop around a single-file command. Media processing is slow and disk-heavy, so partial failures and retries are normal rather than exceptional.

**How to avoid:**

- Treat each input as a job with a manifest, status, planned commands, tool versions, input probe, output path, temporary paths, and final verification result.
- Write outputs to a temp path and atomically rename only after verification passes.
- Default to non-destructive output naming and require explicit overwrite or replace mode.
- Detect output collisions before starting work.
- Support `--dry-run`, `--resume`, `--skip-existing`, `--fail-fast`, and `--continue-on-error` as clear policies.
- Cap concurrency based on CPU/GPU/memory/disk constraints, especially for Demucs.
- Persist run summaries and detailed logs to a repo-defined or user-selected ignored/local output directory.

**Warning signs:**

- Batch processing is a `for` loop over files with no manifest.
- Failed outputs have the same extension and naming pattern as successful outputs.
- Re-running a batch starts every job from scratch.
- The user cannot tell which files were copied, encoded, skipped, failed, or partially processed.

**Phase to address:**
Phase 5: Batch processing and resumable run manifests.

**Release priority:**
V1 blocker if batch mode is in v1 scope; otherwise first hardening phase before advertising batch as stable.

---

### Pitfall 11: Hiding fallback behavior and eroding user trust

**What goes wrong:**
The CLI silently changes output format, re-encodes video, drops streams, lowers audio quality, changes loudness, or overwrites files. Even technically valid output feels untrustworthy because users cannot explain what happened.

**Why it happens:**
Media tooling has many legitimate fallbacks, but a friendly CLI can accidentally turn those into invisible surprises.

**How to avoid:**

- Before running, show a concise plan: input streams, enabled tools, intermediate format, final container/audio codec, video copy/transcode decision, expected output path, overwrite behavior, and known risks.
- After running, show a result summary: video copied yes/no, final audio codec, duration delta, peak/clipping status, files written, logs/manifest path, and any streams intentionally dropped.
- Require explicit confirmation for destructive operations and for any video transcode fallback.
- Provide `--yes` only for automation, and make it print the same plan.
- Use clear language: "video copied without recompression" versus "video re-encoded" versus "video copy unavailable because..."

**Warning signs:**

- The only success message is "Done".
- The tool uses fallbacks without displaying them.
- The CLI has an overwrite flag but no dry-run plan.
- Users need FFmpeg knowledge to understand why a run changed behavior.

**Phase to address:**
Phase 4: Guided interactive workflow and user-trust summaries.

**Release priority:**
V1 blocker.

---

### Pitfall 12: Mixing orchestration logic with media decision logic

**What goes wrong:**
FFmpeg/Demucs/SoX command construction, parsing, probing, prompt handling, file-system operations, and business decisions live in one imperative function. Bugs become hard to test, and every new tool integration risks breaking existing remux behavior.

**Why it happens:**
Media workflows are naturally procedural, so it is tempting to build commands directly in CLI handlers.

**How to avoid:**

- Follow a functional-core / imperative-shell architecture.
- Keep pure decision modules for probe parsing, stream selection, codec/container compatibility, preset expansion, batch job planning, and fallback selection.
- Keep external process execution, file I/O, prompts, and logging in thin adapters.
- Unit test pure media decisions with fixture probes and expected command plans.
- Use Bun/TypeScript for repo-owned automation rather than adding ad hoc Python helper scripts.

**Warning signs:**

- CLI command handlers are hundreds of lines long.
- Tests need FFmpeg installed to verify stream-selection logic.
- Compatibility rules are spread across string templates.
- A fallback changes command execution directly instead of returning a new typed plan.

**Phase to address:**
Phase 1: Core architecture and command-plan test harness.

**Release priority:**
V1 blocker.

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-code one FFmpeg command for all videos | Fast demo | Breaks on multiple streams, incompatible containers, metadata, and sync edge cases | Never for shipped v1 |
| Use lossy intermediates to save disk | Smaller temp directory | Irreversible quality loss and confusing output quality | Only explicit user opt-in with warning |
| Parse FFmpeg human logs for business logic | Quick implementation | Brittle across versions/locales/log levels | Only for diagnostics display, not decisions |
| Depend on PATH checks only | Simple install check | Fails late when builds lack encoders/filters/models | Never for required capabilities |
| Add Python helper scripts for orchestration | Easy for Demucs-adjacent logic | Splits repo-owned automation across runtimes | Only if a tool API truly requires Python and the exception is documented |
| Delete intermediates immediately | Saves disk | Prevents recovery, audit, and debugging | Only after verified success, unless user chooses ephemeral mode |
| Hide fallbacks behind "auto" | Smooth demo | Users cannot trust outputs | Never for video recompression or stream-dropping decisions |

## Integration Gotchas

Common mistakes when connecting to external tools.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| FFmpeg | Use global `-c copy` after replacing audio | Use `-c:v copy` and explicit final `-c:a` selected for the output container |
| FFmpeg | Rely on automatic stream selection | Use explicit `-map` decisions based on `ffprobe` data |
| FFmpeg | Let default encoders choose output behavior | Pick audio encoders deliberately and explain them |
| FFprobe | Parse console text | Use structured JSON output and typed parsers |
| SoX | Run `noisered` without a representative noise profile | Generate or ask for a per-file/per-profile noise sample, then use conservative amounts |
| SoX | Ignore clipping/dither/bit-depth changes | Probe/stat outputs, use guard/gain policies, and record format decisions |
| Demucs | Use MP3 outputs as intermediates | Use WAV/FLAC/float/int24 when quality matters; reserve MP3 for final user-requested delivery |
| Demucs | Assume GPU availability or unlimited memory | Preflight device/memory policy; expose CPU fallback and segment settings |
| Audacity | Assume macros are deterministic by default | Set macro parameters/export settings explicitly and preflight plugin/module state |
| Audacity | Use scripting as a server/headless automation layer | Keep it optional and warn about named-pipe security and GUI coupling |
| Kdenlive/MLT | Treat Kdenlive as the engine | Validate MLT/melt/preset/plugin availability directly if this path is explored |
| LADSPA | Assume plugins exist where Kdenlive lists them | Discover plugin paths/capabilities on the user's machine |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Running Demucs concurrently across many files | GPU/CPU memory exhaustion, swapping, thermal throttling | Concurrency caps and per-tool resource estimates | A few long videos or multi-hour batches |
| Processing full files before detecting mux incompatibility | Failure after minutes/hours of work | Probe and plan compatibility before processing | Any long video |
| Keeping WAV intermediates without disk estimates | Disk fills mid-run | Estimate temp size and check free space before each job | Long videos, batch mode |
| Re-running failed batches from scratch | Wasted hours | Per-file manifest and resume support | Any multi-file batch |
| Using GUI tools in unattended batch | Stalled jobs waiting for focus/dialogs | Keep GUI-backed integrations optional and preflighted | Headless or remote machines |

## Security Mistakes

Domain-specific security and safety issues beyond general CLI hygiene.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Shell-executing user paths | Command injection or path corruption | Spawn tools with argument arrays and no shell |
| Enabling Audacity scripting silently | Named-pipe control can let local malicious software drive Audacity | Require explicit user opt-in and document the risk |
| Downloading models/tools during processing without notice | Supply-chain surprise, offline failure, privacy concern | Preflight downloads and show source/version/cache path |
| Overwriting source-adjacent outputs by default | Data loss | Non-destructive naming, collision checks, temp files, explicit overwrite |
| Trusting media metadata blindly | Malformed files can trigger tool bugs or resource exhaustion | Run external tools as subprocesses with timeouts, size checks, and clear failure handling |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "Done" without media summary | User cannot tell whether video was copied or re-encoded | Show copy/transcode, codecs, streams, duration delta, and output path |
| Raw FFmpeg errors only | Non-experts cannot recover | Map common failures to explanations and next actions |
| Too many expert flags before first value | Casual users abandon the CLI | Guided presets first, expert flags available after |
| Silent stream dropping | Users lose alternate audio/subtitles/chapters | Plan summary lists preserved/dropped streams before run |
| Aggressive preset defaults | Speech sounds damaged | Conservative defaults with warnings for aggressive cleanup |
| No preview/sample mode | Long runs waste time | Add sample-window processing before full-file mode |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **No-video-recompression:** Verify final `ffprobe` shows the video codec/profile matches the source and the plan used `-c:v copy`.
- [ ] **Audio replacement:** Verify cleaned audio is mapped from the processed input and encoded with a container-compatible codec.
- [ ] **Multiple streams:** Test inputs with multiple audio tracks, subtitles, chapters, rotation metadata, and attachments.
- [ ] **Lossless intermediates:** Verify no lossy intermediate appears unless user opted in.
- [ ] **Sync:** Compare source and output duration/start-time deltas against tolerance.
- [ ] **Dependency discovery:** Run `doctor` on machines with missing FFmpeg, old FFmpeg, missing SoX effects, missing Demucs, CPU-only Demucs, and missing LADSPA plugins.
- [ ] **Batch safety:** Kill a batch mid-run and verify `--resume` does not corrupt or duplicate outputs.
- [ ] **Path safety:** Test spaces, Unicode, quotes, leading dashes, brackets, and deep paths.
- [ ] **User trust:** Verify dry-run and final summaries explain every fallback and destructive choice.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Incompatible final mux | LOW if intermediates kept | Choose a compatible audio codec/container, rerun final mux only |
| Accidental video re-encode | MEDIUM | Reuse cleaned audio intermediate and remux with copied source video |
| Lossy intermediate used | HIGH | Re-extract source audio losslessly and rerun cleanup |
| A/V sync drift | MEDIUM | Inspect intermediate durations, apply explicit trim/pad policy, rerun final mux |
| Over-denoised output | MEDIUM | Rerun from lossless intermediate with conservative preset or different profile |
| Batch partial failure | LOW if manifest exists, HIGH otherwise | Resume failed jobs from last verified stage; otherwise audit temp/output files manually |
| Missing external capability | LOW | Run doctor, install/upgrade correct tool/build, rerun from manifest |
| Audacity/Kdenlive optional path fails | LOW to MEDIUM | Fall back to FFmpeg/SoX/Demucs path; keep optional integration disabled |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Treating "preserve video" as one flag | Phase 1: Media probe and command-plan engine | Unit tests from `ffprobe` fixtures plus final `ffprobe` video-copy assertion |
| Codec/container mismatch | Phase 1 and Phase 3 | Compatibility matrix tests and mux failure fixtures |
| Lossy intermediates | Phase 2: Lossless audio pipeline | Manifest checks for intermediate formats |
| A/V sync drift | Phase 2 and Phase 3 | Duration/start-time tolerance checks on long fixtures |
| Over-denoising | Phase 4: Guided presets and quality safeguards | Conservative preset tests, clipping/loudness checks, preview workflow |
| Audacity headless assumptions | Phase 6: Optional Audacity integration | Preflight tests and manual UAT on supported OSes |
| Kdenlive required dependency creep | Phase 7: Kdenlive/MLT feasibility spike | Decision gate: keep optional unless melt/LADSPA path proves reliable |
| Missing dependency capabilities | Phase 1 | `doctor` fixtures/mocks for missing and partial tool installs |
| Shell-string command execution | Phase 1 | Path-safety tests and command runner review |
| Unsafe batch mode | Phase 5: Batch processing | Interrupt/resume/collision/overwrite tests |
| Hidden fallbacks | Phase 4 | Dry-run and final-summary snapshot tests |
| Mixed orchestration and decision logic | Phase 1 | Pure planner coverage and thin process adapter boundaries |

## Sources

- FFmpeg Documentation: `https://ffmpeg.org/ffmpeg.html` (HIGH) - stream selection, `-map`, streamcopy, filter incompatibility with streamcopy, codec handling, mux failure behavior.
- FFmpeg Formats Documentation: `https://ffmpeg.org/ffmpeg-formats.html` (HIGH) - container/muxer behavior, MP4/MOV, Matroska, faststart/index considerations.
- FFprobe Documentation: `https://ffmpeg.org/ffprobe.html` (HIGH) - machine-readable probing, stream and format inspection.
- FFmpeg Download Page: `https://ffmpeg.org/download.html` (HIGH) - FFmpeg source/releases and third-party binary distribution reality.
- Demucs README: `https://raw.githubusercontent.com/facebookresearch/demucs/main/README.md` (HIGH for documented behavior, MEDIUM for maintenance outlook) - unmaintained status, install requirements, output format, sample rate, clipping, memory/device options.
- Demucs PyPI: `https://pypi.org/project/demucs/` (MEDIUM) - current package metadata and release history.
- Audacity Scripting Manual: `https://manual.audacityteam.org/man/scripting.html` (HIGH) - `mod-script-pipe`, named-pipe caveats, security warning, known limitations.
- Audacity Macros Manual: `https://manual.audacityteam.org/man/macros.html` (HIGH) - macro behavior, batch limit guidance, parameter/export behavior.
- Audacity Noise Reduction Manual: `https://manual.audacityteam.org/man/noise_reduction.html` (HIGH) - noise-profile requirements, artifact risks, macro profile behavior, limitations.
- Audacity Support: Manage Macros: `https://support.audacityteam.org/audio-editing/macros/manage-macros` (HIGH) - macro parameters, export settings, compatibility errors, plugin issues.
- Kdenlive LADSPA Plugins Manual: `https://docs.kdenlive.org/en/effects_and_filters/audio_effects/ladspa_plugins/index.html` (HIGH) - Kdenlive audio effects are LADSPA-backed and plugin-documentation dependent.
- Kdenlive Render Profile Parameters: `https://docs.kdenlive.org/tips_and_tricks/useful_info/render_profile_parameters.html` (HIGH) - Kdenlive render profiles are MLT/FFmpeg parameters.
- MLT Property Presets: `https://www.mltframework.org/docs/presets/` (HIGH) - MLT preset discovery and inspection via `melt`.
- SoX man page mirrors and SoX documentation search results (MEDIUM) - `noiseprof`/`noisered`, dither/guard/clipping, batch suitability; validate exact installed SoX/sox_ng behavior per platform.
- Bright Builds Rules at commit `05f8d7a6c9c2e157ec4f922a05273e72dab97676` (HIGH) - functional core/imperative shell, TypeScript/Bun repo-owned automation, rerunnable scripts with useful diagnostics, repo-native verification, pure business logic tests.

---
*Pitfalls research for: audio/video denoising CLI and media-tool orchestration*
*Researched: 2026-05-01*
