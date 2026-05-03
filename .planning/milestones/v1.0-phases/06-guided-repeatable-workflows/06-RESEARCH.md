## RESEARCH COMPLETE

### Phase question

What do we need to know to **plan Phase 6** (guided workflows + equivalent flags) well?

### Current codebase anchors

- **CLI routing**: `createCommandProgram` in `src/cli/command.ts` registers `doctor`, `inspect`, `clean`; `parseCliRequest` / `runCli` in `src/cli/main.ts`.
- **Execution**: `runCliRequest` in `src/app/run-command.ts` dispatches typed `CliRequest` variants.
- **Clean orchestration**: `runCleanRequest` in `src/app/clean.ts` already supports **`dryRun`**, **`json`**, **`allowVideoFallback`**, **`presetId`**, **`knobs.noiseStrength`** — guided flow should converge on the **same** inputs as a fully-specified `clean` invocation.
- **Inspect**: `runInspectRequest` in `src/app/inspect.ts` provides modality/output planning without transcoding — useful messaging alongside dry-run clean preview if needed.
- **Rendering**: `src/cli/render.ts` owns human-readable summaries for clean success.

### Dependency

- **`@clack/prompts`** (STACK ~1.2.0): confirms/spinners/text prompts/cancellation (`isCancel`). Not yet in `package.json`; Phase 6 adds it.

### Recommended architecture

1. **Functional core**: Pure **`GuidedCleanSelections`** (or similarly named) record mirroring everything `clean` needs (`inputPath`, `maybeOutputPath`, `force`, `dryRun`, `presetId`, `noiseStrength`, `allowVideoFallback`). Pure **`argvTokensForEquivalentClean`** (or build argv array + join for display) so **CLI-04 / UX-04** stay testable without TTY.
2. **Imperative shell**: `runGuidedCleanSession(deps)` in `src/app/` uses `@clack` prompts to fill selections, runs **dry-run clean** for **UX-03**, prints **`inspect`-style modality hints** when helpful, shows **equivalent command line** via core helper, confirms execution, then calls **`runCleanRequest`** with **`dryRun: false`** for real work.
3. **Progress (UX-05)**: Prefer **`spinner()` / `log.step`** around coarse milestones (probe/plan, each FFmpeg/SoX step if exposed via optional **`CleanDeps` progress hook**, final verify/report). If hooking every subprocess step is invasive, minimum bar: spinner for overall clean + preserved **`renderCleanRunReportText`** summary on success.

### Testing strategy

- **Domain**: Unit-test argv equivalence (`test/domain/guided-clean-equivalent.test.ts`) with frozen expected strings for representative selections.
- **App**: Test guided orchestration with **injected prompt stubs** (deps supply canned answers) and fake **`runCliRequest`** / **`runCleanRequest`** boundaries — avoid real TTY in CI.

### Risks / constraints

- **Non-TTY / CI**: `@clack` may degrade; guided command should detect non-interactive stdin and exit with a clear **`failure`** outcome (“stdin is not a TTY”) unless tests inject deps.
- **Scope**: Single guided flow for **`clean`** matches roadmap Phase 6; **`inspect`**/`doctor` guided variants stay out unless CONTEXT says otherwise (no CONTEXT — defer).

### Requirement mapping sketch

| REQ-ID | Primary plans |
|--------|----------------|
| CLI-04 | 06-01 (equivalent argv), 06-02 (surfacing), 06-03 (replay parity tests) |
| UX-01–UX-04 | 06-02 |
| UX-05 | 06-03 |
