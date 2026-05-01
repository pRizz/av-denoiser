# Architecture Research

**Domain:** Bun/TypeScript CLI for sequential audio/video denoising
**Researched:** 2026-05-01
**Confidence:** HIGH for core CLI, pipeline, and FFmpeg boundaries; MEDIUM for optional Demucs/Audacity integration details

## Standard Architecture

### System Overview

Use a functional core with a thin imperative shell. The domain core decides what should happen; adapters perform file system work, probing, prompts, and child-process execution.

```text
+------------------------------------------------------------------------+
| CLI Shell                                                               |
| argv parser | interactive prompts | progress renderer | batch runner    |
+-------------------------------+----------------------------------------+
                                |
                                v
+------------------------------------------------------------------------+
| Boundary Parsing                                                        |
| raw argv/prompt answers -> RunRequest -> PresetSelection -> ToolPolicy  |
+-------------------------------+----------------------------------------+
                                |
                                v
+------------------------------------------------------------------------+
| Functional Core                                                         |
| media model | preset resolver | pipeline planner | remux planner       |
| validates invariants and returns ExecutionPlan values                   |
+-------------------------------+----------------------------------------+
                                |
                                v
+------------------------------------------------------------------------+
| Imperative Execution Shell                                              |
| workspace manager | process runner | step executor | result reporter    |
+-------------------------------+----------------------------------------+
                                |
                                v
+------------------------------------------------------------------------+
| External Tool Adapters                                                  |
| ffprobe | ffmpeg | sox | demucs | audacity optional | kdenlive none     |
+------------------------------------------------------------------------+
```

The core architectural rule is one-way dependency flow:

```text
CLI/prompt/filesystem/process adapters -> parsed domain inputs -> pure planning -> execution shell -> tool adapters
```

Domain modules must not import Bun process APIs, prompt libraries, filesystem APIs, or external tool wrappers. Adapters may import domain types and pure command builders, but the core must not import adapters.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| CLI entrypoint | Own `Bun.argv`, help text, exit codes, and top-level error rendering. | `src/cli/main.ts` delegates immediately after parsing raw inputs. |
| Argument parser | Convert flags/positionals into raw command intent. | Use Bun-supported `Bun.argv` plus `util.parseArgs` or a small CLI library; parse to a typed `CliInput`. |
| Interactive UX | Ask missing choices for guided mode and confirm fallbacks. | Prompt adapter returns plain data; it never plans media commands directly. |
| Request parser | Merge argv, prompt answers, defaults, and environment into `RunRequest`. | Boundary parser validates paths, batch mode, preset names, overwrite policy, and no-recompression policy. |
| Preset catalog | Declare named cleanup presets and tunable step defaults. | Pure data plus pure resolver functions. |
| Media probe adapter | Run `ffprobe` and parse JSON output. | Adapter executes `ffprobe`; parser converts JSON into `MediaProbe` domain types. |
| Media model | Represent containers, streams, codecs, duration, and selected streams. | Tagged unions and branded path/duration/stream-id types. |
| Pipeline planner | Build a sequential denoise plan from request, probe, presets, and tool capabilities. | Pure function returning `ExecutionPlan` or typed planning errors. |
| Remux planner | Decide whether output can copy video streams and how audio is encoded/remuxed. | Pure function that returns `VideoCopyRemuxPlan` or a fallback decision requiring consent. |
| Tool capability detector | Find installed tools and versions. | `Bun.which()` and version commands in an adapter; results parsed into `ToolCapabilities`. |
| Workspace manager | Own temporary directories, intermediate filenames, cleanup policy, and logs. | Shell component creates a per-run workspace and passes paths into executor. |
| Step executor | Run planned steps sequentially and stop with clear diagnostics on failure. | Imperative shell over `ExecutionPlan.steps`. |
| Process runner | Spawn external tools safely with args arrays, timeouts, signal handling, and captured logs. | Thin wrapper around `Bun.spawn`; no shell command strings for user-provided paths. |
| Tool adapters | Convert typed step specs to argv arrays and parse tool-specific outputs. | One adapter folder per tool with pure command builders plus effectful runners. |
| Batch runner | Expand inputs and run per-file plans with controlled concurrency. | Plans each item independently; execution concurrency defaults to 1 for heavy tools. |
| Reporter | Render progress, warnings, fallback reasons, and final summaries. | Consumes domain events/results emitted by executor. |

## Recommended Project Structure

```text
src/
|-- cli/
|   |-- main.ts                 # Thin executable entrypoint
|   |-- args.ts                 # Raw argv parsing
|   |-- help.ts                 # User-facing usage text
|   `-- exit-codes.ts           # Stable CLI exit code mapping
|-- app/
|   |-- run.ts                  # Imperative single-file run orchestration
|   |-- batch.ts                # Batch orchestration and concurrency policy
|   `-- request-parser.ts       # Merge CLI/prompt/defaults into domain request
|-- domain/
|   |-- media.ts                # MediaProbe, streams, codecs, containers
|   |-- requests.ts             # RunRequest, BatchRequest, output policy
|   |-- presets.ts              # Preset definitions and resolver
|   |-- pipeline-plan.ts        # Sequential denoise plan types/builders
|   |-- remux-plan.ts           # Video-copy/fallback decision logic
|   |-- tool-capabilities.ts    # Installed tool capability model
|   `-- results.ts              # StepResult, RunSummary, diagnostics
|-- adapters/
|   |-- process-runner.ts       # Bun.spawn wrapper
|   |-- filesystem.ts           # Paths, workspace, cleanup
|   |-- prompts.ts              # Interactive UX adapter
|   |-- ffprobe/
|   |   |-- commands.ts         # Pure argv builders
|   |   `-- parse.ts            # ffprobe JSON -> MediaProbe
|   |-- ffmpeg/
|   |   |-- commands.ts         # Extract/remux/filter argv builders
|   |   `-- progress.ts         # stderr/progress parsing
|   |-- sox/
|   |   `-- commands.ts         # noiseprof/noisered/effects argv builders
|   |-- demucs/
|   |   |-- commands.ts         # separation argv builders
|   |   `-- outputs.ts          # expected stem path calculation
|   `-- audacity/
|       |-- commands.ts         # optional macro/script-pipe command builders
|       `-- availability.ts     # opt-in readiness checks
|-- test-fixtures/
|   `-- probes/                 # Stored ffprobe JSON for unit tests
`-- index.ts                    # Public library-ish exports if useful later
```

### Structure Rationale

- **`domain/`:** Holds business decisions as data-in/data-out functions, matching Bright Builds guidance for functional core, boundary parsing, and illegal-state modeling.
- **`adapters/`:** Contains every side effect: child processes, file I/O, tool discovery, prompt libraries, and parsing raw tool output.
- **`app/`:** Coordinates the use case without owning media rules. It is allowed to be imperative but should stay thin.
- **`cli/`:** Owns command syntax only. It should not know how FFmpeg maps streams or how Demucs names stems.
- **Tool subfolders:** Prevents FFmpeg flag knowledge, SoX profiling behavior, Demucs output conventions, and Audacity pipe details from leaking through the whole app.

## Architectural Patterns

### Pattern 1: Functional Core, Imperative Shell

**What:** Model the desired run as an immutable `ExecutionPlan`, then execute that plan in a shell that owns files and processes.

**When to use:** Always for preset resolution, stream selection, no-recompression decisions, batch item planning, and fallback messaging.

**Trade-offs:** Requires slightly more modeling up front, but it makes the riskiest logic unit-testable without installing FFmpeg, SoX, Demucs, or Audacity.

**Example:**

```typescript
type PlannedStep =
  | { kind: "extract-audio"; spec: ExtractAudioSpec }
  | { kind: "sox-denoise"; spec: SoxDenoiseSpec }
  | { kind: "demucs-vocals"; spec: DemucsVoiceSpec }
  | { kind: "remux-video-copy"; spec: RemuxVideoCopySpec };

type ExecutionPlan = {
  input: MediaInput;
  workspace: WorkspacePlan;
  steps: PlannedStep[];
  output: OutputPlan;
};

function planDenoiseRun(input: {
  request: RunRequest;
  probe: MediaProbe;
  tools: ToolCapabilities;
}): PlanResult {
  // Pure rules only: no filesystem, no prompts, no process spawning.
  return buildExecutionPlan(input);
}
```

### Pattern 2: Parse at Boundaries Into Domain Types

**What:** Convert raw CLI flags, prompt answers, environment variables, and `ffprobe` JSON into strict domain types once.

**When to use:** At every external boundary: argv, prompts, filesystem discovery, JSON probe output, and tool capability checks.

**Trade-offs:** Adds parser code, but avoids passing raw strings like `"mp4"`, `"copy"`, or `"0:v:0"` throughout the planner.

**Example:**

```typescript
type VideoRecompressionPolicy =
  | { kind: "require-copy" }
  | { kind: "allow-audio-transcode-only" }
  | { kind: "allow-video-fallback"; reasonAcceptedByUser: string };

type MediaInput =
  | { kind: "audio"; path: ExistingFilePath; probe: AudioProbe }
  | { kind: "video"; path: ExistingFilePath; probe: VideoProbe };
```

### Pattern 3: Adapter Split Between Command Builders and Runners

**What:** Each external tool adapter should expose pure command builders and a small runner. The planner depends on command specs; only the executor invokes the runner.

**When to use:** FFmpeg extraction/remuxing, SoX effects, Demucs source separation, and Audacity scripting.

**Trade-offs:** Some duplicated-looking types around commands are worthwhile because they keep tool execution testable and inspectable.

**Example:**

```typescript
type ProcessCommand = {
  executable: ToolExecutable;
  args: string[];
  cwd: WorkspacePath;
  stdout: "pipe" | "ignore";
  stderr: "pipe" | "inherit";
};

function buildReplaceAudioCommand(input: RemuxPlan): ProcessCommand {
  return {
    executable: input.ffmpegPath,
    args: [
      "-i",
      input.sourceVideoPath,
      "-i",
      input.cleanedAudioPath,
      "-map",
      "0",
      "-map",
      "-0:a",
      "-map",
      "1:a",
      "-c:v",
      "copy",
      "-c:a",
      input.audioCodec,
      input.outputPath,
    ],
    cwd: input.workspacePath,
    stdout: "ignore",
    stderr: "pipe",
  };
}
```

### Pattern 4: Explicit Fallback State Machine

**What:** Treat no-video-recompression as a first-class policy, not a best-effort flag.

**When to use:** Any video input, any remux step, and any audio codec/container compatibility decision.

**Trade-offs:** Users may see one more confirmation prompt, but the app avoids silently recompressing video.

**Recommended states:**

```text
Video input probed
  -> Can copy selected video streams
       -> Remux with -c:v copy and selected replacement audio
  -> Cannot prove copy-safe remux
       -> If policy is require-copy: stop with explanation
       -> If policy allows fallback: ask/record consent
       -> If consented: choose audio-only output or explicit video-transcode fallback
```

## Data Flow

### Single-File Request Flow

```text
User runs CLI
  -> parse argv into CliInput
  -> if guided, collect PromptAnswers
  -> parse/merge into RunRequest
  -> discover tool capabilities
  -> run ffprobe adapter
  -> parse probe JSON into MediaProbe
  -> resolve preset into PipelineConfig
  -> plan sequential ExecutionPlan
  -> create workspace
  -> execute planned steps in order
  -> emit RunSummary and cleanup/archive logs
```

### Media Processing Flow

```text
Input audio
  -> probe
  -> normalize/extract working WAV if needed
  -> Step 1 output
  -> Step 2 output
  -> ...
  -> encode final audio output

Input video
  -> probe
  -> extract selected source audio to working WAV
  -> Step 1 output
  -> Step 2 output
  -> ...
  -> encode cleaned audio to target codec
  -> remux original non-audio streams + cleaned audio
  -> output video, preferably with video streams copied
```

### Key Data Flows

1. **Probe flow:** `ffprobe` emits JSON; adapter parses raw JSON into `MediaProbe`; all later logic uses domain stream types.
2. **Preset flow:** preset name plus overrides resolve to a `PipelineConfig`; the executor never interprets presets directly.
3. **Pipeline flow:** planner creates an ordered list of intermediate artifacts; each step consumes the previous step's audio path and writes a new path.
4. **Remux flow:** remux planner combines `MediaProbe`, output container, cleaned audio codec, stream-preservation policy, and user fallback policy into one remux decision.
5. **Batch flow:** glob/positionals expand to independent `RunRequest` values; each item probes and plans separately because media containers and stream maps differ per file.

## Component Boundaries and Ownership

| Boundary | Communication | Notes |
|----------|---------------|-------|
| CLI -> app | `CliInput` and `PromptAnswers` | CLI syntax can change without changing media planning. |
| app -> domain | `RunRequest`, `MediaProbe`, `ToolCapabilities` | Pure core returns `PlanResult`; no side effects. |
| domain -> executor | Tool-neutral step specs | The domain returns media intent; adapters turn that intent into concrete argv arrays. |
| executor -> process runner | `ProcessCommand` | Runner owns `Bun.spawn`, stdout/stderr capture, signals, and timeouts. |
| ffprobe adapter -> domain parser | raw JSON string | Parser validates and narrows into stream/domain types. |
| prompt adapter -> app parser | raw answers | Prompt labels do not leak into domain rules. |
| batch runner -> single-file app | `RunRequest[]` | Batch is orchestration around the same single-file use case. |

## Build Order and Dependency Graph

### Suggested Build Order

1. **Project shell and verification:** initialize Bun, TypeScript strict config, `bun:test`, formatting/linting, and a thin CLI entrypoint.
2. **Domain model:** define media input/output types, run requests, preset types, video recompression policy, and result/error unions.
3. **FFprobe adapter and parser:** implement tool discovery, `ffprobe` JSON command, stored JSON fixtures, and parser tests.
4. **Preset resolver:** implement simple v1 presets as pure data and test override handling.
5. **Pipeline planner:** plan audio-only sequential steps with intermediate artifact naming, but use fake adapters in tests.
6. **FFmpeg extraction/output adapter:** extract working audio and produce cleaned audio outputs.
7. **SoX adapter:** add baseline noise profiling/reduction and normalization as first real denoise step.
8. **Video remux planner:** implement explicit stream mapping and no-video-recompression guarantees before adding complex tools.
9. **FFmpeg remux adapter:** replace audio while copying video streams where allowed; report exact fallback reasons otherwise.
10. **Interactive UX:** add guided prompts over already-working request/preset/fallback models.
11. **Flags and batch mode:** expose non-interactive repeatability and batch expansion/concurrency after single-file behavior is stable.
12. **Demucs adapter:** add voice isolation as an optional heavy step with resource warnings and predictable output path parsing.
13. **Audacity adapter:** add only if phase research validates a practical, secure, opt-in automation path.
14. **Advanced fallback/reporting:** add richer diagnostics, logs, dry-run command preview, and per-item batch summaries.

### Dependency Graph

```text
types/results
  -> request parser
  -> preset resolver
  -> media probe parser
  -> pipeline planner
  -> remux planner
  -> command builders
  -> executor
  -> CLI/prompt/batch surfaces

process runner
  -> ffprobe adapter
  -> ffmpeg adapter
  -> sox adapter
  -> demucs adapter
  -> audacity adapter

workspace manager
  -> executor
  -> tool adapters
```

Do not build interactive UX or batch mode before the pure single-file plan is stable. Otherwise, media-specific errors become entangled with prompt flow and batch scheduling.

## No-Video-Recompression Guarantees

### Recommended Model

Represent video handling as a tagged union:

```typescript
type VideoOutputPlan =
  | {
      kind: "copy-video-remux";
      maps: StreamMap[];
      videoCodecArg: "copy";
      audioAction: AudioRemuxAction;
    }
  | {
      kind: "audio-only-output";
      reason: FallbackReason;
    }
  | {
      kind: "video-transcode-fallback";
      reason: FallbackReason;
      requiresExplicitConsent: true;
    };
```

The default video path should be `copy-video-remux`. The planner should stop instead of silently producing `video-transcode-fallback` when the user requested no video recompression.

### Copy-Safe Rules

- Use explicit FFmpeg stream maps for remuxing. Official FFmpeg docs state that `-map` manually controls output stream selection and `-c copy` stream-copies packets without decoding, filtering, or encoding.
- Preserve all non-audio streams when practical with `-map 0 -map -0:a -map 1:a`, then set `-c:v copy` and an explicit audio codec action.
- Treat audio transcoding as separate from video recompression. Re-encoding cleaned audio may be necessary for container compatibility; that should not violate a no-video-recompression guarantee.
- Do not apply video filters, resize, overlays, or video codec options in the denoise pipeline. FFmpeg filters require decoding, and video filters would break the copy guarantee.
- If the target container cannot accept the copied video stream or selected audio codec, prefer an alternate output container or audio codec before considering video transcode.
- Store a `NoVideoRecompressionReport` in the run summary: copied streams, dropped/replaced audio streams, output container, audio codec action, and any warnings.

### Fallback Policy

| Situation | Default Behavior | User-Facing Message |
|-----------|------------------|---------------------|
| Input has no video stream | Produce audio output. | "Input is audio-only; no video stream to preserve." |
| Video stream can be copied and cleaned audio is compatible | Remux with video copy. | "Video copied without recompression; audio replaced." |
| Cleaned audio codec is not compatible with target container | Transcode audio only or suggest container change. | "Video can still be copied, but audio must be encoded as X for this container." |
| Copy-safe remux fails or cannot be proven | Stop when policy is `require-copy`. | "No-video-recompression was requested, so no fallback was run." |
| User explicitly allows fallback | Prefer alternate container or audio-only output; video transcode only with explicit consent. | "Fallback may recompress video; continue?" |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single local file | Sequential plan, one workspace, clear progress output. |
| Dozens of local files | Batch runner with per-file plans, resumable summaries, and low default concurrency. |
| Hundreds of files | Add queue persistence, skip-if-output-exists, probe/result cache keyed by path plus mtime, and failure resume. |
| Very large media files | Avoid loading media into memory; use file paths and tool streaming, capture logs incrementally, and keep temporary workspace on a configurable volume. |

### Scaling Priorities

1. **First bottleneck:** external tool runtime and CPU/GPU contention. Fix with conservative batch concurrency and per-tool resource warnings.
2. **Second bottleneck:** temporary disk space. Fix with workspace planning, early free-space checks, cleanup policy, and `--keep-temp` for debugging.
3. **Third bottleneck:** unclear failures across batches. Fix with structured per-item results and log paths before adding parallelism.

## Anti-Patterns

### Anti-Pattern 1: Building Shell Command Strings

**What people do:** Concatenate `ffmpeg` commands into strings and pass them through a shell.

**Why it is wrong:** Paths, quotes, spaces, and user-provided values become injection and escaping risks. It also makes commands hard to test.

**Do this instead:** Build `string[]` argv arrays and pass them to `Bun.spawn`. Unit-test command builders as pure functions.

### Anti-Pattern 2: Letting FFmpeg Auto-Select Streams

**What people do:** Run remux commands without explicit `-map` options.

**Why it is wrong:** FFmpeg automatic stream selection can drop streams or choose unexpected audio/subtitle streams, especially for multi-track inputs.

**Do this instead:** Probe streams, choose a stream mapping in the planner, and render explicit `-map` args.

### Anti-Pattern 3: Silent Video Transcoding

**What people do:** Fall back to a command that omits `-c:v copy` when remuxing fails.

**Why it is wrong:** It violates the core value of preserving video without recompression and can be slow or lossy.

**Do this instead:** Model fallback states explicitly and require user consent for any video transcode path.

### Anti-Pattern 4: Tool-Specific Logic in Presets

**What people do:** Put raw FFmpeg/SoX/Demucs args directly in user-facing presets and let UI code mutate them.

**Why it is wrong:** Presets become untestable command fragments and cannot explain compatibility or fallback decisions.

**Do this instead:** Presets should describe domain intent, such as `voiceCleanup: "moderate"`, which the planner maps to tool steps.

### Anti-Pattern 5: Audacity as a Required Core Dependency

**What people do:** Make Audacity automation mandatory for v1 cleanup.

**Why it is wrong:** Audacity scripting requires a GUI app, a module that is not enabled by default, named pipes, and security-sensitive setup.

**Do this instead:** Keep Audacity as an optional adapter behind capability checks and explicit user opt-in.

## Integration Points

### External Tools

| Tool | Integration Pattern | Notes |
|------|---------------------|-------|
| Bun runtime | CLI entrypoint, TypeScript runtime, tests, child processes | Official docs support `Bun.argv`, `Bun.spawn`, `Bun.which`, `Bun.build --compile`, and `bun:test`. |
| ffprobe | JSON probe command -> parser -> `MediaProbe` | Use `-show_streams`, `-show_format`, and JSON output. Keep raw JSON fixtures for tests. |
| FFmpeg | Extract audio, filter audio, encode cleaned audio, remux output | Use explicit `-map`; use `-c:v copy` for no video recompression; use audio encoding as needed. |
| SoX | Scripted baseline cleanup | Good fit for deterministic batch steps such as `noiseprof`, `noisered`, normalization, and simple effects. |
| Demucs | Optional voice/source isolation step | Heavy dependency. Model as an adapter with capability checks, resource warnings, and expected stem path parsing. |
| Audacity | Optional advanced macro/script-pipe adapter | Requires enabled `mod-script-pipe`, running Audacity, named pipes, and security warnings. Not a core v1 dependency. |
| Kdenlive | No direct v1 runtime integration | Treat as research inspiration for filter choices. Prefer FFmpeg/LADSPA-compatible primitives unless a clean CLI path is proven later. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Presets -> planner | `PipelineConfig` | Presets are domain intent, not command fragments. |
| Planner -> executor | `ExecutionPlan` | Executor follows the plan; it does not make media decisions. |
| Executor -> adapters | `ProcessCommand` and typed step specs | Adapters handle tool-specific command lines and output parsing. |
| Adapters -> reporter | `StepEvent` and `ToolLogRef` | Reporter renders progress without parsing raw stderr itself. |
| Errors -> CLI | `Diagnostic` union | Distinguish user fixable errors, missing tools, media incompatibility, and internal bugs. |

## Verification Strategy

- Unit-test pure parsers and planners with no external binaries.
- Store representative `ffprobe` JSON fixtures for audio-only, single-audio video, multi-audio video, subtitles, incompatible container/codec, and missing-duration cases.
- Snapshot-test command builders for FFmpeg extraction, FFmpeg remux, SoX `noiseprof`/`noisered`, and Demucs stem extraction.
- Integration-test tool adapters behind opt-in flags or local environment checks so routine tests do not require every media tool.
- Add dry-run output early. A dry run should show the execution plan, command argv arrays, remux policy, and fallback reasons without running media tools.

## Sources

- Bright Builds Rules at commit `05f8d7a6c9c2e157ec4f922a05273e72dab97676`: architecture, TypeScript/JavaScript, code shape, and testing standards. Confidence: HIGH.
- Bun documentation: `Bun.argv`, `util.parseArgs` guidance, `Bun.spawn`, `Bun.which`, TypeScript config, and single-file executables. Confidence: HIGH. https://bun.sh/docs/guides/process/argv, https://bun.sh/docs/api/spawn, https://bun.sh/docs/runtime/bun-apis, https://bun.sh/docs/runtime/typescript, https://bun.sh/docs/bundler/executables
- FFmpeg documentation: stream selection, explicit `-map`, streamcopy, and transcoding behavior. Confidence: HIGH. https://ffmpeg.org/ffmpeg.html
- FFprobe documentation: JSON output, `-show_streams`, `-show_format`, and `-select_streams`. Confidence: HIGH. https://ffmpeg.org/ffprobe.html
- SoX manual references for `noiseprof` and `noisered`. Confidence: MEDIUM because sources are manpage mirrors rather than a modern canonical docs site. https://linux.die.net/man/1/sox, https://www.manpagez.com/man/7/soxeffect/
- Demucs GitHub documentation and current fork status. Confidence: MEDIUM. https://github.com/adefossez/demucs, https://github.com/facebookresearch/demucs
- Audacity manual for `mod-script-pipe` scripting. Confidence: MEDIUM. https://manual.audacityteam.org/man/scripting.html
- Community examples for replacing audio while copying video streams. Confidence: LOW to MEDIUM; useful as implementation examples, not as primary authority. https://stackoverflow.com/questions/11779490/how-to-add-a-new-audio-not-mixing-into-a-video-using-ffmpeg, https://superuser.com/questions/1137612/ffmpeg-replace-audio-in-video

---
*Architecture research for: Bun/TypeScript audio/video denoising CLI*
*Researched: 2026-05-01*
