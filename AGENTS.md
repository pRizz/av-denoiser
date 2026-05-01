<!-- bright-builds-rules-managed:begin -->

# Bright Builds Rules

`AGENTS.md` is the entrypoint for repo-local instructions, not the complete Bright Builds Rules specification.

This managed block is owned upstream by `bright-builds-rules`. If this block needs a fix, open an upstream PR or issue instead of editing the managed text in a downstream repo. Keep downstream-specific instructions outside this managed block.

Before plan, review, implementation, or audit work:

1. Read the repo-local instructions in `AGENTS.md`, including any `## Repo-Local Guidance` section and any instructions outside this managed block.
1. Read `AGENTS.bright-builds.md`.
1. Read `standards-overrides.md` when present.
1. Read the pinned canonical standards pages relevant to the task.
1. If you have not done that yet, stop and load those sources before continuing.

Use this routing map when deciding what to load next:

- For repo-specific commands, prerequisites, generated-file ownership, CI-only suites, or recurring workflow facts, use the local `AGENTS.md`, especially `## Repo-Local Guidance`.
- For the Bright Builds default workflow and high-signal cross-cutting rules used in most tasks, use `AGENTS.bright-builds.md`.
- For deliberate repo-specific exceptions to the Bright Builds defaults, use `standards-overrides.md`.
- To choose the right pinned canonical standards page, start with the Bright Builds entrypoint `standards/index.md`.
- For business-logic structure, domain modeling, and functional-core versus imperative-shell decisions, use the canonical page `standards/core/architecture.md`.
- For control flow, naming, function/file size, and readability rules, use the canonical page `standards/core/code-shape.md`.
- For sync, bootstrap, and pre-commit verification rules, use the canonical page `standards/core/verification.md`.
- For unit-test expectations, use the canonical page `standards/core/testing.md`.
- For Rust or TypeScript/JavaScript-specific rules, use the matching canonical page under `standards/languages/`.
- Keep recurring repo-specific workflow facts, commands, and links in a `## Repo-Local Guidance` section elsewhere in this file.
- Record deliberate repo-specific exceptions and override decisions in `standards-overrides.md`.
- If instructions elsewhere in `AGENTS.md` conflict with `AGENTS.bright-builds.md`, follow the repo-local instructions and treat them as an explicit local exception.

<!-- bright-builds-rules-managed:end -->

<!-- GSD:project-start source:PROJECT.md -->
## Project

**av-denoiser**

`av-denoiser` is a simple TypeScript/Bun-based CLI for cleaning noisy audio in audio or video files. It accepts a media file, runs the source audio through a configurable sequence of free and open source denoise/cleanup tools, and writes a cleaned output file while preserving the video stream whenever possible.

The first version should feel friendly and guided: users can run an interactive workflow without learning flags, while power users can still use CLI options and batch processing for repeatable jobs. It is intended for general-purpose local media cleanup, creator workflows such as podcasts, videos, lectures, and interviews, and optional batch processing across many recordings.

**Core Value:** Users can pass an audio or video file through a guided denoise pipeline and get a cleaned output while avoiding video recompression whenever possible.

### Constraints

- **Tech stack**: TypeScript on Bun — this is the preferred runtime and package/script surface for the CLI.
- **Tooling**: Use free and open source processing tools — no proprietary or paid denoise engines for v1.
- **Media integrity**: Avoid video recompression whenever possible — video streams should usually be copied/remuxed while only the audio track changes.
- **UX**: Friendly guided workflow first — users should not need to learn flags before getting value.
- **Power users**: CLI flags and batch mode are still required — automation and repeatability are part of the product.
- **Pipeline model**: Sequential processing — each enabled tool step consumes the previous step's output and produces the next intermediate artifact.
- **Dependency risk**: Demucs and Audacity/Kdenlive integrations need research — availability, install friction, and scriptability may vary by platform.
- **Cross-platform expectations**: v1 should avoid unnecessary OS-specific assumptions where practical, but exact platform support needs research.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Bun | 1.3.13 | Runtime, package manager, script runner, test runner, and optional single-binary build surface | Bun is current, TypeScript-native, fast at CLI startup, and matches the Bright Builds default for new standalone TS projects. Use `bun install`, `bun run`, `bun test`, and Bun subprocess APIs as the repo-owned surface. Confidence: HIGH. |
| TypeScript | 6.0.3 | Strict domain modeling and CLI implementation | TypeScript 6 is the current stable npm line. Use `strict`, `noUncheckedIndexedAccess`, discriminated unions, and parser-backed domain types so media states and pipeline plans are not loose strings. Confidence: HIGH. |
| `@types/bun` | 1.3.13 | Bun runtime type definitions | Official Bun docs recommend installing `@types/bun` and setting `"types": ["bun"]`, especially with TypeScript 6+. Confidence: HIGH. |
| FFmpeg / FFprobe | 8.1 "Hoare" | Primary media engine: probe, extract audio, apply native filters, copy video streams, and remux outputs | FFmpeg 8.1 is the current stable release. It provides the most important default surface: `ffprobe -print_format json`, `-map`, `-c:v copy`, audio re-encoding, and native denoise filters including `afftdn`, `anlmdn`, and `arnndn`. Treat FFmpeg as required for v1. Confidence: HIGH. |
| SoX_ng | 14.7.1.1 stable | Scriptable baseline audio cleanup: trim/silence, high/low-pass, compand, normalization, noise profiles, stats | Prefer `sox_ng` when available because classic SoX 14.4.2 is old while SoX_ng is actively releasing. Support classic `sox` as a compatibility fallback because package-manager availability for SoX_ng is uneven. Confidence: MEDIUM-HIGH. |
| Demucs | 4.0.1 PyPI / `adefossez/demucs` maintained fork | Optional source separation and voice isolation step | Demucs remains useful for vocals/speech isolation, but it is Python/PyTorch-based and not actively feature-developed. Keep it an optional external CLI discovered at runtime, not repo-owned Python code. Confidence: MEDIUM. |
| Audacity | 3.7.7 | Optional advanced automation bridge for Audacity noise reduction and macro workflows | Audacity ships `mod-script-pipe`, but it is disabled by default, requires a running GUI app, has security implications, and scripting has known limitations. Use only as an optional adapter after the FFmpeg/SoX/Demucs path works. Confidence: MEDIUM. |
| Kdenlive / MLT `melt` | Kdenlive docs 25.12 / current MLT renderer path | Optional reference and advanced `.mlt` rendering compatibility | Kdenlive uses MLT/melt and FFmpeg-style render parameters. It should inform filter/render choices but should not be a mandatory dependency for an audio cleanup CLI. Use direct FFmpeg/LADSPA where possible. Confidence: MEDIUM. |
| FFmpeg LADSPA filters + RNNoise-style plugins | FFmpeg `ladspa` filter; plugin versions vary | Optional plugin-host path for LADSPA voice denoise/effects | FFmpeg can load LADSPA plugins if the FFmpeg build includes `--enable-ladspa` and plugin binaries are installed. Useful for RNNoise-style voice suppression, but discovery and packaging are OS-specific. Confidence: MEDIUM. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `commander` | 14.0.3 | Stable CLI parser and help system | Use for subcommands, options, defaults, `--help`, and repeatable non-interactive workflows. Stay on Commander 14 for now; Commander 15 is still prerelease and raises runtime requirements. Confidence: HIGH. |
| `@commander-js/extra-typings` | 14.0.0 | Stronger typing for Commander option/action shapes | Use instead of raw `commander` imports when defining the command tree so parsed flags stay typed. Confidence: HIGH. |
| `@clack/prompts` | 1.2.0 | Guided interactive workflow | Use for first-run guidance, preset selection, confirmations, multi-select pipeline steps, spinners, and cancellation handling. Confidence: HIGH. |
| `zod` | 4.4.1 | Boundary parsing and domain type construction | Use for CLI flags, config files, `ffprobe` JSON, tool capability probes, and pipeline preset definitions. This matches Bright Builds parse-at-boundaries guidance. Confidence: HIGH. |
| `yaml` | 2.8.3 | Optional human-editable presets/config | Use only if roadmap chooses YAML config. JSON plus Zod is enough for v1 internals; YAML is useful for user-authored presets later. Confidence: HIGH. |
| `p-limit` | 7.3.0 | Batch concurrency control | Use for batch mode so multiple jobs do not saturate CPU/GPU, disk, or Demucs memory. Confidence: HIGH. |
| `fast-glob` | 3.3.3 | Batch input expansion | Use for user-supplied globs in batch mode after explicit confirmation. Keep file resolution in the shell adapter and pass parsed file sets to pure planning logic. Confidence: HIGH. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| Bun test | Unit tests for pure pipeline planning and parser logic | Prefer `bun test` over Vitest for the first repo-native test surface. Unit-test the functional core: media probe parsing, stream-copy decisions, pipeline plan generation, preset expansion, and tool capability interpretation. |
| TypeScript `tsc --noEmit` | Static type verification | Keep Bun as runtime, but run TypeScript for type checking in verification. Use Bun's recommended compiler options with `"types": ["bun"]`. |
| Biome 2.4.14 | Formatter and linter | Use `@biomejs/biome` for fast TS/JSON formatting and linting unless the repo later needs ESLint-only rules. Install with an exact dev dependency. |
| Bun `build --compile` | Optional distributable CLI binary | Useful later, but do not treat a compiled binary as self-contained media tooling. FFmpeg, SoX_ng/SoX, Demucs, Audacity, and LADSPA plugins still need runtime discovery. |
## Installation
# Repo-owned Bun/TypeScript surface
# Required external media engine, installed by the user/system package manager
# macOS example:
# Optional external processors, discovered at runtime
# Prefer sox_ng where available; otherwise support classic sox as fallback.
# Install Demucs as an isolated external CLI, not as repo-owned Python code.
## External Tool Discovery Contract
| Tool | Discovery | Minimum Capability Checks | Roadmap Implication |
|------|-----------|---------------------------|---------------------|
| FFmpeg | Locate `ffmpeg` and `ffprobe` on `PATH`, then allow config/env overrides | `ffmpeg -version`, `ffprobe -version`, `ffmpeg -filters`; require JSON probe support and check filters such as `afftdn`, `anlmdn`, `arnndn`, `ladspa` | Build v1 around FFmpeg. Presets should degrade based on actual filters, not assumed builds. |
| FFprobe | Same install as FFmpeg | `ffprobe -v error -print_format json -show_format -show_streams input` | Parse JSON into strict domain types before planning extraction/remux commands. |
| SoX_ng / SoX | Prefer `sox_ng`; fallback to `sox` | Version, supported formats/effects, presence of `soxi`; check effects used by presets | Keep SoX steps optional but first-class for baseline cleanup. |
| Demucs | Locate `demucs`, then fallback to `python3 -m demucs` | Version/help output, writable model/cache directory, CPU/GPU mode, output stem paths | Optional high-quality isolation preset. Warn about first-run model downloads and high memory/runtime. |
| Audacity | Locate app/binary only after user enables Audacity integration | `mod-script-pipe` enabled, pipe paths accessible, Audacity running, command round-trip works | Phase behind an explicit advanced integration because it is GUI-driven and security-sensitive. |
| LADSPA plugins | Check FFmpeg `ladspa` filter and `LADSPA_PATH`; optionally inspect known plugin files | Plugin library exists, plugin label exists, controls can be listed with `c=help` | Treat as optional preset family. Never assume RNNoise/LADSPA is present from FFmpeg alone. |
| Kdenlive / MLT | Locate `melt` only for advanced `.mlt` compatibility | `melt -version`; generated `.mlt` can render with `melt your_script.mlt` | Do not require Kdenlive for v1. Prefer direct FFmpeg filtergraphs for the main product. |
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Bun subprocess adapter using `Bun.spawn` | `execa` | Use `execa` only if Bun subprocess APIs prove insufficient for cancellation, output streaming, or Windows behavior. The default should be Bun-native to keep the runtime surface small. |
| Direct FFmpeg command construction from typed plans | `fluent-ffmpeg` or similar JS wrapper | Use a wrapper only if it is demonstrably maintained and supports current FFmpeg features. The standard path should construct argv arrays from typed domain plans and execute them directly. |
| System FFmpeg 8.1+ | `ffmpeg-static` | Use static packages only for a constrained demo or fully reviewed distribution story. They can lag FFmpeg, may omit needed filters, download binaries at install time, and carry GPL/redistribution considerations. |
| FFmpeg native filters first | Kdenlive/MLT as required runtime | Use Kdenlive/MLT only when importing/rendering `.mlt` workflows matters. For a denoise CLI, direct FFmpeg filtergraphs are simpler and more portable. |
| Optional Demucs CLI | Repo-owned Python integration package | Use Python only as the external Demucs runtime. Do not add repo-owned Python scripts in this Bun-friendly TS repo unless a concrete compatibility blocker is documented. |
| SoX_ng preferred with SoX fallback | Classic SoX only | Classic SoX is widely packaged, so support it. Prefer SoX_ng in docs and capability checks because it is actively maintained. |
| Zod 4 | Ad hoc validation or repeated primitive checks | Use ad hoc checks only inside a parser implementation. Domain logic should receive typed values, not raw `string`/`unknown` objects from CLI, config, or `ffprobe`. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `fluent-ffmpeg` | The project is deprecated, read-only, and states it no longer works properly with recent FFmpeg versions. | Typed argv builders plus `Bun.spawn`. |
| `ffmpeg.wasm` for local CLI processing | It is browser/WASM-oriented, slower for large local files, and not a good host for system FFmpeg filters, LADSPA plugins, Demucs, or stream-copy/remux workflows. | System FFmpeg/FFprobe. |
| Mandatory `ffmpeg-static` | The current package downloads FFmpeg 6.1.1-era static binaries, not current 8.1, and licensing/filter availability must be reviewed per binary. | User-installed FFmpeg plus explicit `doctor` diagnostics. |
| Kdenlive as a required dependency | Kdenlive is a full GUI/video editor and uses MLT/FFmpeg underneath. Making it mandatory would add install weight and awkward runtime behavior for a CLI that mostly needs audio replacement/remuxing. | Direct FFmpeg, optional `melt` adapter later. |
| Audacity as the default denoise path | `mod-script-pipe` is disabled by default, weakens local security, requires a running GUI app, and has known automation limitations. | FFmpeg/SoX/Demucs default presets; Audacity optional advanced adapter. |
| Repo-owned Python scripts | Bright Builds rules prohibit new Python scripts in a Bun-friendly TS repo unless there is a concrete compatibility reason. | TypeScript adapters that call external Python CLIs only when the external tool requires Python. |
| Unvalidated filter strings from user config | Filtergraphs can become quoting and safety bugs, and invalid combinations are hard to diagnose after spawning FFmpeg. | Parse config into typed pipeline steps, then render safe argv arrays. |
## Stack Patterns by Variant
- Use FFmpeg extraction/probe/remux plus FFmpeg native `afftdn`/EQ/dynamics filters and optional SoX_ng normalization.
- Because this minimizes external dependencies and preserves video streams with `-c:v copy` whenever container/codec compatibility allows.
- Add an optional Demucs step using `--two-stems vocals` or a selected model, then remux the isolated/cleaned vocal stem back with FFmpeg.
- Because Demucs is valuable but heavyweight; it should be opt-in with clear runtime, disk, and model-cache warnings.
- Use an optional Audacity adapter that sends macro/scripting commands over `mod-script-pipe` after a doctor check proves the pipe is enabled and reachable.
- Because Audacity automation is powerful for existing macros but not reliable enough for the default pipeline.
- Prefer FFmpeg's `ladspa` filter when available and require explicit plugin discovery (`LADSPA_PATH`, plugin file, plugin label, controls).
- Because the FFmpeg filter is standard, but plugin binaries and licenses are platform-specific.
- Treat Kdenlive/MLT as an import/export bridge for `.mlt` or render-profile knowledge, not as the core pipeline.
- Because Kdenlive is valuable ecosystem context but the CLI's core job is cleaner as typed FFmpeg/SoX/Demucs orchestration.
## Version Compatibility
| Package or Tool | Compatible With | Notes |
|-----------------|-----------------|-------|
| Bun 1.3.13 | TypeScript 6.0.3, `@types/bun` 1.3.13 | Use Bun's recommended `tsconfig` shape with `"module": "Preserve"`, `"moduleResolution": "bundler"`, `"types": ["bun"]`, and `"strict": true`. |
| Commander 14.0.3 | Bun ESM/TS CLI | Stable latest. Commander 15 prerelease is ESM-only and raises Node runtime assumptions; skip until stable and tested under Bun. |
| Zod 4.4.1 | TypeScript 5.5+ / 6.x | Use strict mode. Ideal for `ffprobe` JSON and config parsing. |
| FFmpeg 8.1 | Native `afftdn`, `anlmdn`, `arnndn`, stream copy/remux, `ladspa` when compiled in | Do not assume every packaged build has every optional filter. Doctor must inspect `ffmpeg -filters`. |
| `arnndn` | External `.rnnn` model files | The model option is required. Common models are community-maintained and older; treat model selection as configurable and document confidence. |
| SoX_ng 14.7.1.1 | Classic SoX-compatible workflows with newer maintenance | Install names may be `sox_ng` unless built with `--enable-replace`. Discover both `sox_ng` and `sox`. |
| Demucs 4.0.1 | Python >=3.8 and PyTorch stack | Keep it external. Expect CPU to be slow and GPU behavior platform-dependent. First run may download model weights. |
| Audacity 3.7.7 | `mod-script-pipe` and Audacity macros/scripting commands | Pipe automation is disabled by default and should be opt-in only. |
| Kdenlive/MLT | `melt` rendering of generated `.mlt` scripts | Useful for advanced compatibility; not a required audio cleanup dependency. |
## Roadmap Recommendations
## Sources
- Bun official site and release notes — Bun 1.3.13 current release, all-in-one runtime/package manager/test runner, TypeScript support, subprocess APIs. Confidence: HIGH.
- Bun TypeScript docs — `@types/bun`, recommended `tsconfig`, TypeScript 6+ note. Confidence: HIGH.
- Bright Builds pinned standards at commit `05f8d7a6c9c2e157ec4f922a05273e72dab97676` — Bun preference, no repo-owned Python scripts in Bun-friendly TS repos, functional core/imperative shell, parse boundaries, testing guidance. Confidence: HIGH.
- FFmpeg official download/news/docs — FFmpeg 8.1 "Hoare" current stable release and filter documentation for `afftdn`, `anlmdn`, `arnndn`, `ladspa`. Confidence: HIGH.
- SoX_ng Codeberg releases and README — 14.7.1.1 stable, active release cadence, `sox_ng` naming, FFmpeg format support option. Confidence: HIGH.
- Demucs PyPI and `adefossez/demucs` GitHub README — v4.0.1 PyPI package, maintained fork status, CLI usage, default models, optional Python/PyTorch runtime. Confidence: MEDIUM.
- Audacity official download and manual — Audacity 3.7.7, `mod-script-pipe` shipped but disabled by default, scripting capabilities and limitations. Confidence: HIGH for availability, MEDIUM for robust CLI automation.
- Kdenlive manual 25.12 and render profile docs — `melt` rendering path, MLT presets, FFmpeg-style render parameters, LADSPA filter category. Confidence: MEDIUM.
- LADSPA official site and FFmpeg filter docs — LADSPA API/plugin model, `LADSPA_PATH`, FFmpeg `ladspa` behavior. Confidence: MEDIUM.
- npm registry / official package pages — `commander` 14.0.3, `@commander-js/extra-typings` 14.0.0, `@clack/prompts` 1.2.0, `zod` 4.4.1, `yaml` 2.8.3, `p-limit` 7.3.0, `fast-glob` 3.3.3, `@biomejs/biome` 2.4.14, `@types/bun` 1.3.13, TypeScript 6.0.3. Confidence: HIGH.
- `fluent-ffmpeg` GitHub README/issues — deprecated, read-only, not working properly with recent FFmpeg. Confidence: HIGH.
- `ffmpeg-static` registry/GitHub — v5.3.0 downloads FFmpeg 6.1.1-era binaries and carries GPL/redistribution considerations. Confidence: HIGH.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
