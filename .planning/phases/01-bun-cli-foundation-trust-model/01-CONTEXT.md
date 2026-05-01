---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 01-2026-05-01T23-00-58
generated_at: 2026-05-01T23:00:58.240Z
---

# Phase 1: Bun CLI Foundation & Trust Model - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning
**Mode:** Yolo

<domain>
## Phase Boundary

Phase 1 establishes the installable Bun/TypeScript CLI foundation and trust model. It should make the repository runnable, testable, and safe for later media work, but it should not implement real denoise pipelines, FFmpeg remuxing, SoX cleanup, Demucs, Audacity, Kdenlive, batch processing, or guided media workflows yet.

Discussion refresh: same boundary; codebase now contains Phase 1 deliverables plus later-phase modules added by roadmap execution. Rearrchitecting or expanding Phase 1 scope is out of scope—only clarify decisions that downstream work should keep honoring.
</domain>

<decisions>
## Implementation Decisions

### CLI Surface

- **D-01:** Build a Bun-first TypeScript CLI with `src/cli/main.ts` as the executable entrypoint and `src/index.ts` as the library-style export surface for reusable modules.
- **D-02:** Provide a first working command surface with help output, a `doctor` command, and a lightweight default invocation that points users toward `doctor` and later phase commands rather than pretending denoise behavior exists.
- **D-03:** Keep every guided or future command path anchored to a typed request model; Phase 1 should create the places and patterns for that model, not a parallel interactive-only path.

### Trust and Safety Model

- **D-04:** External command execution must go through one safe process-runner abstraction that accepts an executable and argv array. Do not use shell command strings for user-provided values.
- **D-05:** Establish stable exit-code names and numeric values in Phase 1 so later media failures can map to documented categories without churn.
- **D-06:** The `doctor` surface should report required and optional tools as structured facts, even if Phase 1 uses lightweight PATH/version checks and stubs for tool-specific capabilities.

### Architecture

- **D-07:** Follow functional core / imperative shell from the start: domain modules hold pure data-in/data-out decisions, while CLI, filesystem, prompts, and process execution stay in adapters.
- **D-08:** Parse at boundaries into domain types using Zod or narrow parser modules. Avoid passing raw unknown JSON, loose argv maps, or unchecked strings into core logic.
- **D-09:** Model invalid states with tagged unions for exit outcomes, tool availability, and command results instead of optional boolean fields or sentinel strings.
- **D-10:** Prefer composition, plain objects, and functions. Do not introduce class inheritance for project-owned TypeScript code.

### Verification

- **D-11:** Phase 1 must add repo-native verification commands for formatting/linting, typechecking, tests, and an aggregate check command.
- **D-12:** Unit tests should cover pure/business logic created in this phase: exit-code mapping, doctor result aggregation, tool availability parsing, command-result handling, and safe command-builder behavior.
- **D-13:** Tests should use clear Arrange / Act / Assert sections unless the structure is unmistakable.
- **D-14:** Scope Biome verification to package manifests, config files, `src/`, and tests so generated or planning metadata (for example under `.planning/`) does not fail unrelated lint rules.

### Claude's Discretion

- Exact package script names, module filenames, and help text wording are left to Claude as long as they remain discoverable, conventional for a Bun CLI, and are recorded in `package.json`.
- Exact `doctor` output formatting is left to Claude for Phase 1, but it must be human-readable and structured enough for tests.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope

- `.planning/PROJECT.md` — Project vision, core value, constraints, and key decisions.
- `.planning/REQUIREMENTS.md` — Phase 1 requirement IDs (CLI-01–03, TRUST-01, TRUST-04) and acceptance scope.
- `.planning/ROADMAP.md` — Phase boundary, dependencies, and success criteria.
- `.planning/STATE.md` — Current project position and known concerns.

### Research

- `.planning/research/SUMMARY.md` — Research synthesis and recommended phase ordering.
- `.planning/research/STACK.md` — Bun/TypeScript stack, library choices, and tool discovery contract.
- `.planning/research/ARCHITECTURE.md` — Functional-core/imperative-shell layout and component boundaries.
- `.planning/research/PITFALLS.md` — Command execution, diagnostics, and media-tool pitfalls to avoid.

### Standards

- `AGENTS.md` — Repo instruction entrypoint with Bright Builds and GSD guidance.
- `AGENTS.bright-builds.md` — Managed Bright Builds sidecar and pinned standards metadata.
- `standards/index.md` — Bright Builds standards routing entrypoint.
- `standards-overrides.md` — Repo-local standards deviations, currently none active.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/cli/main.ts`, `src/cli/command.ts`, `src/cli/render.ts` — Commander wiring, help, and human-oriented rendering.
- `src/app/run-command.ts`, `src/app/doctor.ts` — Application orchestration for CLI requests and doctor aggregation.
- `src/adapters/process-runner.ts` — Central `Bun.spawn` argv-only execution boundary.
- `src/adapters/tool-discovery.ts` — PATH resolution and injectable test doubles for external tools.
- `src/domain/exit-codes.ts`, `src/domain/command-outcome.ts`, `src/domain/doctor-report.ts`, `src/domain/cli-request.ts`, `src/domain/process-command.ts` — Trust-model types and pure transitions.
- Later roadmap modules also live under `src/` (for example `inspect` and media probe planning). Treat them as downstream integration points that must keep honoring the Phase 1 process and exit contracts—they are not an invitation to weaken argv-only execution or untyped boundaries in the core.

### Established Patterns

- `AGENTS.md` is the canonical instruction file with `CLAUDE.md` as a symlink compatibility alias.
- Planning docs are committed to git and should remain in sync with phase progress.
- Bright Builds rules require functional core / imperative shell, boundary parsing, unit tests for pure logic, Bun as the repo-owned TypeScript surface, and no repo-owned Python scripts.

### Integration Points

- New trust or CLI work should extend existing domain modules and adapters rather than adding parallel execution paths.
- External tool calls must continue to flow through `ProcessRunner` (or a deliberate successor that preserves the argv contract).
</code_context>

<specifics>
## Specific Ideas

- The first phase should make the project feel real and trustworthy without overclaiming media processing features.
- `doctor` is the main early trust feature: it should tell users what is available and what is missing before later phases depend on FFmpeg, SoX, Demucs, Audacity, or Kdenlive.
- The process-runner abstraction is a security and correctness foundation for every external media tool integration that follows.
</specifics>

<deferred>
## Deferred Ideas

- Real FFmpeg/FFprobe probing, media stream models, and no-video-recompression planning belong to Phase 2.
- Video fallback approvals belong to Phase 3.
- SoX cleanup, actual audio extraction, and denoise presets belong to Phase 4.
- Final media remuxing and reports belong to Phase 5.
- Guided prompts, power-user media flags, and dry-run UX polish belong to Phase 6.
- Batch mode belongs to Phase 7.
- Demucs, Audacity, and Kdenlive/MLT integrations belong to Phase 8.
</deferred>

---
*Phase: 01-bun-cli-foundation-trust-model*
*Context gathered: 2026-05-01*
