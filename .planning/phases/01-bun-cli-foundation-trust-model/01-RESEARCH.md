# Phase 1: Bun CLI Foundation & Trust Model - Research

**Researched:** 2026-05-01  
**Domain:** Bun/TypeScript CLI foundation, safe process execution, diagnostics, and repo verification  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### CLI Surface

- **D-01:** Build a Bun-first TypeScript CLI with `src/cli/main.ts` as the executable entrypoint and `src/index.ts` as the library-style export surface for reusable modules.
- **D-02:** Provide a first working command surface with help output, a `doctor` command, and a lightweight default invocation that points users toward `doctor` and later phase commands rather than pretending denoise behavior exists.
- **D-03:** Keep every guided or future command path anchored to a typed request model; Phase 1 should create the places and patterns for that model, not a parallel interactive-only path.

#### Trust and Safety Model

- **D-04:** External command execution must go through one safe process-runner abstraction that accepts an executable and argv array. Do not use shell command strings for user-provided values.
- **D-05:** Establish stable exit-code names and numeric values in Phase 1 so later media failures can map to documented categories without churn.
- **D-06:** The `doctor` surface should report required and optional tools as structured facts, even if Phase 1 uses lightweight PATH/version checks and stubs for tool-specific capabilities.

#### Architecture

- **D-07:** Follow functional core / imperative shell from the start: domain modules hold pure data-in/data-out decisions, while CLI, filesystem, prompts, and process execution stay in adapters.
- **D-08:** Parse at boundaries into domain types using Zod or narrow parser modules. Avoid passing raw unknown JSON, loose argv maps, or unchecked strings into core logic.
- **D-09:** Model invalid states with tagged unions for exit outcomes, tool availability, and command results instead of optional boolean fields or sentinel strings.
- **D-10:** Prefer composition, plain objects, and functions. Do not introduce class inheritance for project-owned TypeScript code.

#### Verification

- **D-11:** Phase 1 must add repo-native verification commands for formatting/linting, typechecking, tests, and an aggregate check command.
- **D-12:** Unit tests should cover pure/business logic created in this phase: exit-code mapping, doctor result aggregation, tool availability parsing, command-result handling, and safe command-builder behavior.
- **D-13:** Tests should use clear Arrange / Act / Assert sections unless the structure is unmistakable.

### Claude's Discretion

- Exact package script names, module filenames, and help text wording are left to Claude as long as they remain discoverable, conventional for a Bun CLI, and are recorded in `package.json`.
- Exact `doctor` output formatting is left to Claude for Phase 1, but it must be human-readable and structured enough for tests.

### Deferred Ideas (OUT OF SCOPE)

- Real FFmpeg/FFprobe probing, media stream models, and no-video-recompression planning belong to Phase 2.
- Video fallback approvals belong to Phase 3.
- SoX cleanup, actual audio extraction, and denoise presets belong to Phase 4.
- Final media remuxing and reports belong to Phase 5.
- Guided prompts, power-user media flags, and dry-run UX polish belong to Phase 6.
- Batch mode belongs to Phase 7.
- Demucs, Audacity, and Kdenlive/MLT integrations belong to Phase 8.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLI-01 | User can install dependencies and run the Bun-based TypeScript CLI locally. | Use Bun as package manager/script runner, add `package.json`, `bun.lock`, strict `tsconfig.json`, and a `bin` entry pointing to `src/cli/main.ts`. [CITED: https://bun.sh/docs/runtime/typescript] [CITED: https://bun.com/docs/pm/bunx] |
| CLI-02 | User can run a `doctor` or preflight command that reports required and optional media tools, versions, and missing capabilities. | Use `Bun.which()` for PATH lookup, safe argv-based version probes through the process runner, and a `DoctorReport` union that distinguishes missing, version-only, and not-yet-checked capabilities. [CITED: https://bun.sh/docs/api/utils] [CITED: https://bun.sh/docs/api/spawn] |
| CLI-03 | User receives stable, documented exit codes for success, invalid input, missing tools, planning failures, processing failures, and fallback-required outcomes. | Define a single `ExitCode` enum/object plus `CommandOutcome` union in the functional core, and make Commander errors flow through that mapper instead of ad hoc `process.exit()` calls. [CITED: https://raw.githubusercontent.com/tj/commander.js/master/Readme.md] [VERIFIED: CONTEXT.md] |
| TRUST-01 | User can trust that external tools are invoked with argv arrays rather than unsafe shell command strings. | Use a single `ProcessRunner` adapter around `Bun.spawn` commands expressed as arrays; unit-test command specs with path edge cases. [CITED: https://bun.sh/docs/api/spawn] [VERIFIED: PITFALLS.md] |
| TRUST-04 | User can run tests or verification commands that cover pure planning logic, parser logic, command builders, and representative media probe fixtures. | Add `bun test`, `tsc --noEmit`, Biome checks, and focused unit tests for Phase 1 pure logic. `nyquist_validation` is false, so no separate validation-architecture expansion is required. [CITED: https://bun.sh/docs/cli/test] [VERIFIED: .planning/config.json] |
</phase_requirements>

## Summary

Phase 1 should produce a small but real Bun/TypeScript CLI shell, not a media-processing demo. The planner should bias toward durable foundations: strict package setup, typed command outcomes, a `doctor` command backed by structured tool facts, a single argv-array process runner, and repo-native verification scripts. [VERIFIED: CONTEXT.md] [VERIFIED: ROADMAP.md]

The most important implementation decision is to make the command surface thin and the trust model central. Commander should own command syntax and help text, Zod/parser modules should turn raw inputs into domain values, domain modules should aggregate doctor and exit outcomes, and adapters should own `Bun.spawn`, `Bun.which`, console output, and filesystem effects. [CITED: Bright Builds architecture standard] [CITED: https://bun.sh/docs/api/spawn]

**Primary recommendation:** Build `src/cli/main.ts` plus `src/index.ts`, install only the Phase 1 runtime dependencies (`commander`, `@commander-js/extra-typings`, `zod`) and dev tooling (`typescript`, `@types/bun`, `@biomejs/biome`), and defer `@clack/prompts` until Phase 6 unless an implementation task explicitly needs a prompt adapter stub. [VERIFIED: npm registry] [VERIFIED: CONTEXT.md]

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/`, `.cursor/skills/`, or `.agents/skills/` entries were found in this repository during research. [VERIFIED: workspace glob] Planner constraints therefore come from `AGENTS.md`, `AGENTS.bright-builds.md`, `standards-overrides.md`, the phase context, and the pinned canonical Bright Builds standards. [VERIFIED: AGENTS.md] [CITED: Bright Builds standards]

Actionable directives to enforce:

- Use Bun as the repo-owned TypeScript runtime, package manager, script runner, and test runner. [CITED: Bright Builds TypeScript/JavaScript standard] [CITED: https://bun.sh/docs/runtime/typescript]
- Keep business logic in a functional core and side effects in an imperative shell. [CITED: Bright Builds architecture standard]
- Parse raw inputs at boundaries and pass domain types into core logic. [CITED: Bright Builds architecture standard]
- Make illegal states unrepresentable with tagged unions, parser modules, and stronger types where useful. [CITED: Bright Builds architecture standard]
- Do not add repo-owned Python scripts in this Bun-friendly TypeScript repo. [CITED: Bright Builds TypeScript/JavaScript standard]
- Prefer composition, plain objects, and functions; do not use project-owned class inheritance. [CITED: Bright Builds TypeScript/JavaScript standard]
- Unit-test pure/business logic with focused tests and Arrange/Act/Assert sections. [CITED: Bright Builds testing standard]
- Before commits, run relevant repo-native verification and prefer aggregate repo-owned commands once they exist. [CITED: Bright Builds verification standard]
- `standards-overrides.md` has no active repo-specific exceptions. [VERIFIED: standards-overrides.md]

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Bun runtime | Phase 1 minimum 1.3.9; current target 1.3.13 | Runtime, package manager, script runner, test runner, and subprocess API | Bun is the locked project runtime and supports TypeScript execution, `bun test`, `Bun.spawn`, and `Bun.which`. Phase 1 must avoid 1.3.13-only flags and should document both the local/current Bun version and the target version in `doctor`. [CITED: https://bun.sh/blog/bun-v1.3.13] [VERIFIED: local shell] |
| TypeScript | 6.0.3 | Strict typing and domain modeling | Current npm version; Bun docs recommend strict Bun-friendly compiler options including `"module": "Preserve"`, `"moduleResolution": "bundler"`, `"types": ["bun"]`, and `"noUncheckedIndexedAccess": true`. [VERIFIED: npm registry] [CITED: https://bun.sh/docs/runtime/typescript] |
| `@types/bun` | 1.3.13 | Bun runtime type definitions | Current npm version; Bun docs instruct Bun TypeScript projects to install `@types/bun` for Bun globals. [VERIFIED: npm registry] [CITED: https://bun.sh/docs/runtime/typescript] |
| `commander` | 14.0.3 | CLI parser, subcommands, help, command errors | Current stable npm version; Commander provides command definition, strict option parsing, automated help, and action handlers. [VERIFIED: npm registry] [CITED: https://raw.githubusercontent.com/tj/commander.js/master/Readme.md] |
| `@commander-js/extra-typings` | 14.0.0 | Stronger TypeScript typings over Commander actions/options | Current npm version and version-aligned with Commander 14. [VERIFIED: npm registry] |
| `zod` | 4.4.1 | Boundary parsing for CLI options, tool facts, and command outcomes | Current npm version; Zod 4 is stable and requires TypeScript strict mode. [VERIFIED: npm registry] [CITED: https://zod.dev/] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| `@biomejs/biome` | 2.4.14 | Formatting, linting, import organization, CI-style checks | Install in Phase 1 and expose repo-native scripts. Biome docs recommend installing it as an exact dev dependency. [VERIFIED: npm registry] [CITED: https://biomejs.dev/guides/getting-started/] |
| Bun test | Runtime bundled | Unit tests for pure logic and command builders | Use for Phase 1 tests; Bun test supports TypeScript, Jest-like APIs, filtering, coverage, and non-zero exits on failure. [CITED: https://bun.sh/docs/cli/test] |
| `@clack/prompts` | 1.3.0 | Future guided prompts | Defer installation and runtime use until Phase 6. Phase 1 must not install Clack or create prompt adapter scaffolding. [VERIFIED: npm registry] [VERIFIED: CONTEXT.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Commander | `util.parseArgs` | `util.parseArgs` is smaller, but Commander gives help, subcommands, strict unknown-option behavior, and a conventional CLI surface immediately. [CITED: https://raw.githubusercontent.com/tj/commander.js/master/Readme.md] |
| Bun subprocess API | `execa` | `execa` is mature, but this repo should stay Bun-native unless Bun APIs prove insufficient; `Bun.spawn` already supports argv arrays, output capture, exit promises, AbortSignal, timeout, and kill signals. [CITED: https://bun.sh/docs/api/spawn] [VERIFIED: STACK.md] |
| Zod boundary parsing | Ad hoc guards | Ad hoc guards spread validation through core logic; Zod centralizes boundary parsing and matches the Bright Builds parse-at-boundaries rule. [CITED: https://zod.dev/] [CITED: Bright Builds architecture standard] |
| Biome | ESLint plus Prettier | Biome is enough for the initial TS/JSON formatting/lint surface and is already the project-level recommendation. [CITED: https://biomejs.dev/guides/getting-started/] [VERIFIED: STACK.md] |

**Installation:**

```bash
bun add commander @commander-js/extra-typings zod
bun add -d typescript @types/bun @biomejs/biome
```

Optional Phase 6 dependency, not required for the Phase 1 command surface and not to be installed in Phase 1:

```bash
bun add @clack/prompts
```

**Version verification:** Versions above were verified with `npm view <package> version` on 2026-05-01. [VERIFIED: npm registry]

| Package | Version | Published |
|---------|---------|-----------|
| `commander` | 14.0.3 | 2026-01-31 |
| `@commander-js/extra-typings` | 14.0.0 | 2025-05-18 |
| `@clack/prompts` | 1.3.0 | 2026-04-29 |
| `zod` | 4.4.1 | 2026-04-29 |
| `typescript` | 6.0.3 | 2026-04-16 |
| `@types/bun` | 1.3.13 | 2026-04-22 |
| `@biomejs/biome` | 2.4.14 | 2026-05-01 |

## Package Setup Recommendations

Use `package.json` as the product and verification contract. [VERIFIED: CONTEXT.md] Recommended shape:

```json
{
  "name": "av-denoiser",
  "type": "module",
  "bin": {
    "av-denoiser": "./src/cli/main.ts"
  },
  "scripts": {
    "cli": "bun run src/cli/main.ts",
    "doctor": "bun run src/cli/main.ts doctor",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "lint": "biome lint .",
    "check:biome": "biome ci .",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "verify": "bun run check:biome && bun run typecheck && bun test"
  }
}
```

Implementation notes:

- Put `#!/usr/bin/env bun` at the top of `src/cli/main.ts` because Bun package executables can force Bun via shebang and `package.json` `bin` entries are the normal executable surface. [CITED: https://bun.com/docs/pm/bunx] [CITED: Bun CLI search result]
- Use `"type": "module"` and Bun's recommended TypeScript compiler options. [CITED: https://bun.sh/docs/runtime/typescript]
- Commit `bun.lock` after `bun install`; Bun is the preferred package-manager surface for this greenfield standalone TS project. [CITED: Bright Builds TypeScript/JavaScript standard]
- Keep package scripts static. Do not interpolate user-provided file paths or tool arguments into scripts; user values should enter through Commander/Zod and later the process runner. [VERIFIED: PITFALLS.md] [CITED: Bright Builds code-shape standard]
- Add a `build` script only if Phase 1 explicitly wants a compiled smoke artifact. Bun supports `bun build --compile`, but the project should not imply external media tools are bundled into the compiled binary. [CITED: https://bun.sh/blog/bun-v1.3.13] [VERIFIED: STACK.md]

## Architecture Patterns

### Recommended Project Structure

```text
src/
|-- cli/
|   |-- main.ts                  # Executable entrypoint and top-level exit handling
|   |-- command.ts               # Commander program construction
|   |-- args.ts                  # Raw CLI option parsing helpers
|   `-- render.ts                # Human-readable output for help/default/doctor
|-- app/
|   |-- doctor.ts                # Imperative doctor orchestration
|   `-- run-command.ts           # Maps command requests to domain outcomes
|-- domain/
|   |-- cli-request.ts           # Typed command request model
|   |-- command-outcome.ts       # Success/failure unions and exit-code mapping
|   |-- doctor-report.ts         # Tool availability and report aggregation
|   |-- exit-codes.ts            # Stable names and numeric values
|   `-- process-command.ts       # Safe argv command spec
|-- adapters/
|   |-- process-runner.ts        # Bun.spawn wrapper
|   |-- tool-discovery.ts        # Bun.which + version probes
|   `-- console.ts               # stdout/stderr writing
|-- index.ts                     # Library-style exports for reusable modules
test/
|-- domain/
|-- adapters/
`-- fixtures/
```

This structure keeps domain logic independent from Commander, Bun process APIs, filesystem access, and console rendering. [CITED: Bright Builds architecture standard] It also gives future phases stable places for media probe parsers, command builders, and prompt adapters without putting media logic in `src/cli/main.ts`. [VERIFIED: ARCHITECTURE.md]

### Pattern 1: Thin CLI, Typed Request

**What:** Commander parses syntax; Zod or parser modules turn raw data into a typed `CliRequest`; application code dispatches typed requests. [CITED: https://raw.githubusercontent.com/tj/commander.js/master/Readme.md] [CITED: https://zod.dev/]

**When to use:** All commands, including `doctor` and the default invocation. [VERIFIED: CONTEXT.md]

**Example:**

```typescript
type CliRequest =
  | { kind: "show-help" }
  | { kind: "doctor"; strict: boolean };

type CommandOutcome =
  | { kind: "success"; message: string }
  | { kind: "failure"; exitCode: ExitCode; diagnostic: Diagnostic };
```

### Pattern 2: One Stable Exit Taxonomy

**What:** Define stable names and numeric values once, then map every command outcome through them. [VERIFIED: CONTEXT.md]

**Recommended taxonomy:**

| Name | Value | Use |
|------|-------|-----|
| `success` | 0 | Completed successfully. |
| `internalError` | 1 | Unexpected bug or uncaught exception. |
| `invalidInput` | 2 | CLI parse error, invalid flags, malformed config, or invalid request. |
| `missingTools` | 3 | Required external dependency or capability is missing. |
| `planningFailure` | 4 | A typed plan cannot be produced from valid inputs and available facts. |
| `processingFailure` | 5 | External tool execution or filesystem processing failed. |
| `fallbackRequired` | 6 | Requested safe behavior cannot continue without explicit fallback approval. |

**Why:** Low integer values are easy to document and shell-friendly, while reserving `1` for unexpected internal failures keeps user-fixable categories specific. [VERIFIED: REQUIREMENTS.md]

### Pattern 3: Doctor as Structured Facts

**What:** `doctor` should produce a domain report first, then render human text from that report. [VERIFIED: CONTEXT.md]

**Recommended model:**

```typescript
type ToolRequirement = "required" | "optional";

type ToolAvailability =
  | {
      kind: "available";
      tool: ToolName;
      requirement: ToolRequirement;
      path: string;
      version: string;
      capabilities: ToolCapabilityStatus[];
    }
  | {
      kind: "missing";
      tool: ToolName;
      requirement: ToolRequirement;
      installHint: string;
    }
  | {
      kind: "check-failed";
      tool: ToolName;
      requirement: ToolRequirement;
      path: string;
      reason: string;
    };

type ToolCapabilityStatus =
  | { kind: "available"; id: string }
  | { kind: "missing"; id: string; detail: string }
  | { kind: "not-checked-yet"; id: string; phase: string };
```

**Phase 1 scope:** Check PATH and simple versions for `ffmpeg`, `ffprobe`, `sox_ng`, `sox`, `demucs`, `audacity`, and `melt`; capability checks such as FFmpeg filters, SoX effects, Audacity pipe status, and Demucs model cache should be explicit `not-checked-yet` facts, not silent omissions. [VERIFIED: CONTEXT.md] [VERIFIED: STACK.md]

### Pattern 4: Process Runner as the Only Execution Gate

**What:** Represent external execution with a `ProcessCommand` value and run it through one adapter. [CITED: https://bun.sh/docs/api/spawn]

**Recommended shape:**

```typescript
type ProcessCommand = {
  executable: string;
  args: readonly string[];
  cwd?: string;
  env?: Readonly<Record<string, string>>;
  timeoutMs?: number;
  stdin?: "ignore";
};

type ProcessResult =
  | { kind: "exited"; exitCode: number; stdout: string; stderr: string }
  | { kind: "signaled"; signalCode: string; stdout: string; stderr: string }
  | { kind: "spawn-failed"; error: Error };
```

`Bun.spawn` accepts command arrays, returns a subprocess with `exited`, `exitCode`, and `signalCode`, and supports `AbortSignal`, `timeout`, and `killSignal`. [CITED: https://bun.sh/docs/api/spawn] The runner should capture bounded stdout/stderr for diagnostics and never accept a shell command string. [VERIFIED: PITFALLS.md]

### Anti-Patterns to Avoid

- **Shell command strings:** Do not build `ffmpeg ... ${path}` strings or use shell quoting helpers for execution. Use `ProcessCommand.args`. [VERIFIED: PITFALLS.md]
- **CLI handlers with business logic:** Do not aggregate doctor results or choose exit codes inside Commander `.action()` callbacks. [CITED: Bright Builds architecture standard]
- **Optional booleans for states:** Do not model tools as `{ found?: boolean, version?: string }`; use tagged unions. [CITED: Bright Builds architecture standard]
- **Premature media planning:** Do not implement real FFprobe JSON parsing, stream maps, remux planning, or denoise presets in Phase 1. [VERIFIED: CONTEXT.md]
- **Prompt-only future path:** Do not create an interactive-only branch for future guided mode; everything should point toward the typed request model. [VERIFIED: CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI parsing/help | Custom `Bun.argv` parser for subcommands and help | Commander with extra typings | Commander already handles options, arguments, subcommands, strict unknown-option errors, and generated help. [CITED: https://raw.githubusercontent.com/tj/commander.js/master/Readme.md] |
| Boundary validation | Repeated string checks in app/domain functions | Zod schemas or narrow parser modules | Zod validates untrusted data and infers TypeScript types; Bright Builds requires parse-at-boundaries behavior where useful. [CITED: https://zod.dev/] [CITED: Bright Builds architecture standard] |
| Process execution | Shell string assembly and quote escaping | `Bun.spawn` with command arrays | Bun's documented process API accepts array commands and supports process lifecycle controls. [CITED: https://bun.sh/docs/api/spawn] |
| Tool lookup | Third-party `which` package | `Bun.which()` | Bun has a built-in executable lookup API. [CITED: https://bun.sh/docs/api/utils] |
| Test runner | Vitest/Jest setup | `bun test` | Bun ships a TypeScript-capable Jest-like test runner. [CITED: https://bun.sh/docs/cli/test] |
| Formatter/linter wiring | Separate Prettier and ESLint config from scratch | Biome | Biome provides format, lint, check, and CI commands in one dev dependency. [CITED: https://biomejs.dev/guides/getting-started/] |

**Key insight:** The phase is about trustworthy surfaces, not feature breadth. Custom parsing, shell execution, and ad hoc diagnostics would become foundations that every later media phase has to unwind. [VERIFIED: PITFALLS.md]

## Common Pitfalls

### Pitfall 1: Commander exits outside the taxonomy

**What goes wrong:** Commander can display usage errors and terminate before the CLI maps failures to documented exit codes. [CITED: https://raw.githubusercontent.com/tj/commander.js/master/Readme.md]

**How to avoid:** Configure command construction so parse/action errors are caught at `src/cli/main.ts`, translated into `CommandOutcome`, rendered once, and exited through `ExitCode`. [VERIFIED: CONTEXT.md]

**Warning signs:** `process.exit()` appears in command handlers, tests assert raw Commander behavior only, or `invalidInput` is not covered by a unit test.

### Pitfall 2: Doctor overclaims capability readiness

**What goes wrong:** Phase 1 reports "FFmpeg ready" when it only checked PATH/version, so later phases inherit false confidence. [VERIFIED: PITFALLS.md]

**How to avoid:** Use capability statuses such as `not-checked-yet` with phase labels. Report "installed" separately from "capability verified." [VERIFIED: CONTEXT.md]

**Warning signs:** Doctor output has only green/red rows, no distinction between optional missing tools and unverified capabilities.

### Pitfall 3: Testing the process runner only with real tools

**What goes wrong:** Tests become machine-dependent or fail when optional media tools are absent. [VERIFIED: local shell]

**How to avoid:** Unit-test pure command specs and result mappers with fakes; keep real PATH/version checks behind a small adapter and a small smoke test if useful. [CITED: Bright Builds testing standard]

**Warning signs:** Routine tests require SoX, Demucs, Audacity, or Kdenlive even though those are deferred. [VERIFIED: CONTEXT.md]

### Pitfall 4: Bun version drift

**What goes wrong:** The project targets current Bun 1.3.13, while the local machine currently has Bun 1.3.9. [VERIFIED: local shell] [CITED: https://bun.sh/blog/bun-v1.3.13]

**How to avoid:** Either set a clear minimum matching APIs actually used in Phase 1 or document an upgrade prerequisite before using 1.3.13-specific test flags such as `--parallel`, `--isolate`, `--shard`, or `--changed`. [CITED: https://bun.sh/blog/bun-v1.3.13]

**Warning signs:** `package.json` scripts use new Bun flags without an engine/minimum check or local upgrade note.

### Pitfall 5: Hiding future media concepts in CLI text

**What goes wrong:** Default invocation implies denoise/remux behavior exists before the code can do it. [VERIFIED: CONTEXT.md]

**How to avoid:** Default output should say the CLI foundation is installed, point to `doctor`, and describe future commands as not implemented yet. [VERIFIED: CONTEXT.md]

**Warning signs:** Help text advertises processing flags, presets, batch mode, or Demucs/Audacity/Kdenlive commands in Phase 1.

## Code Examples

Verified patterns from official sources:

### `Bun.spawn` with an argv array

```typescript
// Source: https://bun.sh/docs/api/spawn
const proc = Bun.spawn(["bun", "--version"], {
  stdout: "pipe",
  stderr: "pipe",
  timeout: 5_000,
});

const exitCode = await proc.exited;
```

### `Bun.which` for executable lookup

```typescript
// Source: https://bun.sh/docs/api/utils
const maybePath = Bun.which("ffmpeg");

if (maybePath === null) {
  return { kind: "missing", tool: "ffmpeg" };
}
```

### Bun test Arrange / Act / Assert

```typescript
// Source: https://bun.sh/docs/cli/test and Bright Builds testing standard
import { expect, test } from "bun:test";

test("maps missing tools to the missingTools exit code", () => {
  // Arrange
  const outcome = { kind: "missing-required-tool" } as const;

  // Act
  const exitCode = mapOutcomeToExitCode(outcome);

  // Assert
  expect(exitCode).toBe(ExitCode.missingTools);
});
```

## Testing Strategy

Phase 1 tests should mostly avoid real media tools. [VERIFIED: CONTEXT.md]

Recommended test files:

- `test/domain/exit-codes.test.ts`: stable numeric values and outcome mapping. [VERIFIED: REQUIREMENTS.md]
- `test/domain/doctor-report.test.ts`: aggregation of required missing tools, optional missing tools, and unverified capabilities. [VERIFIED: CONTEXT.md]
- `test/domain/process-command.test.ts`: command specs preserve executable/argv boundaries and reject shell command strings if constructors are used. [VERIFIED: PITFALLS.md]
- `test/adapters/tool-discovery.test.ts`: fake runner parses version stdout/stderr into structured tool facts. [VERIFIED: CONTEXT.md]
- `test/cli/command.test.ts`: default invocation and `doctor` command produce typed requests without running media logic. [VERIFIED: CONTEXT.md]

Coverage priorities:

| Behavior | Test Type | Notes |
|----------|-----------|-------|
| Help/default command points to `doctor` and future work honestly | Unit/snapshot | Keep output stable enough for tests but not brittle about whitespace. |
| `doctor` result severity | Unit | Missing required tool should differ from missing optional tool. |
| Exit-code taxonomy | Unit | Numeric values should be locked by tests. |
| Safe command runner input shape | Unit | Assert `args` arrays are not display strings. |
| Tool version parsing | Unit with fake process results | Do not require missing optional tools for routine tests. |
| Local CLI smoke | Script/manual | `bun run doctor` can be part of verification if it is deterministic in the current environment. |

## Verification Scripts

Recommended scripts for Phase 1:

```json
{
  "scripts": {
    "format": "biome format --write .",
    "format:check": "biome format .",
    "lint": "biome lint .",
    "check:biome": "biome ci .",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "verify": "bun run check:biome && bun run typecheck && bun test",
    "doctor": "bun run src/cli/main.ts doctor"
  }
}
```

Planner notes:

- `verify` should be the aggregate phase gate once `package.json` exists. [CITED: Bright Builds verification standard]
- Use `bun test --coverage` only if the phase adds coverage expectations; Bun supports coverage, but Bright Builds requires meaningful pure logic tests more than a numeric threshold. [CITED: https://bun.sh/docs/cli/test] [CITED: Bright Builds testing standard]
- Avoid Bun 1.3.13-specific test flags in Phase 1. The local compatible baseline is Bun 1.3.9, while `doctor` should document the current target/current version so users can see runtime drift without requiring an upgrade for Phase 1. [VERIFIED: local shell] [CITED: https://bun.sh/blog/bun-v1.3.13]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Node plus `ts-node`/transpile step for small TS CLIs | Bun runs TypeScript directly and owns scripts/tests/package install in this repo | Project decision and Bright Builds TS guidance | Keep the repo-owned runtime surface small. [CITED: https://bun.sh/docs/runtime/typescript] [CITED: Bright Builds TypeScript/JavaScript standard] |
| `child_process.exec` or shell snippets for media tools | `Bun.spawn` with argv arrays and typed command specs | Phase 1 trust decision | Prevents shell injection and path quoting bugs. [CITED: https://bun.sh/docs/api/spawn] [VERIFIED: PITFALLS.md] |
| PATH-only dependency checks | Structured `doctor` facts with version and explicit unverified capability statuses | Phase 1 trust decision | Avoids false readiness claims. [VERIFIED: CONTEXT.md] |
| Separate Prettier/ESLint setup for every new TS repo | Biome as initial formatter/linter/check surface | Project stack recommendation | Fewer moving pieces for the first verification surface. [CITED: https://biomejs.dev/guides/getting-started/] [VERIFIED: STACK.md] |

**Deprecated/outdated for this phase:**

- `fluent-ffmpeg`: Do not add it; the project research found it deprecated/read-only and Phase 1 should not implement real FFmpeg command construction anyway. [VERIFIED: STACK.md]
- `ffmpeg-static`: Do not add it; Phase 1 should discover system tools and report readiness, not download binary media tools through npm. [VERIFIED: STACK.md]
- Repo-owned Python helpers: Forbidden unless a concrete compatibility reason is documented. [CITED: Bright Builds TypeScript/JavaScript standard]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Bun | CLI runtime and scripts | yes | 1.3.9 local; 1.3.13 current target | Phase 1 uses 1.3.9-compatible APIs, avoids 1.3.13-only flags, and has `doctor` document target/current Bun version information. [VERIFIED: local shell] [CITED: https://bun.sh/blog/bun-v1.3.13] |
| npm registry access | Dependency version verification | yes | npm 11.6.2 | None needed. [VERIFIED: local shell] |
| FFmpeg | Required future media tool reported by `doctor` | yes | 8.1 | Phase 1 version check only; real capabilities later. [VERIFIED: local shell] [VERIFIED: CONTEXT.md] |
| FFprobe | Required future media tool reported by `doctor` | yes | 8.1 | Phase 1 version check only; real probing later. [VERIFIED: local shell] [VERIFIED: CONTEXT.md] |
| SoX_ng | Optional future cleanup tool | no | - | Report optional missing; support classic `sox` later. [VERIFIED: local shell] [VERIFIED: STACK.md] |
| SoX | Optional future cleanup fallback | no | - | Report optional missing. [VERIFIED: local shell] |
| Demucs | Optional future source separation | no | - | Report optional missing; defer install/runtime research to Phase 8. [VERIFIED: local shell] [VERIFIED: CONTEXT.md] |
| Audacity | Optional future editor integration | no | - | Report optional missing; defer scripting checks to Phase 8. [VERIFIED: local shell] [VERIFIED: CONTEXT.md] |
| `melt` | Optional future Kdenlive/MLT path | no | - | Report optional missing; defer to Phase 8. [VERIFIED: local shell] [VERIFIED: CONTEXT.md] |

**Missing dependencies with no fallback:** None for Phase 1 implementation if `doctor` treats only Bun/npm registry access as development prerequisites. [VERIFIED: local shell]

**Missing dependencies with fallback:** SoX_ng/SoX, Demucs, Audacity, and `melt` are optional and should be reported rather than blocking Phase 1. [VERIFIED: CONTEXT.md]

## Security Domain

Security enforcement is enabled by default because `.planning/config.json` does not set `security_enforcement` to `false`. [VERIFIED: .planning/config.json]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V1 Encoding and Sanitization / legacy V5 Validation | yes | Parse CLI/config values once with Zod/parser modules; do not pass untrusted values into shell interpreters. [CITED: OWASP ASVS search result] [CITED: https://zod.dev/] |
| V5 File Handling | yes, limited | Phase 1 should only create path-safety test fixtures and no media file processing; later phases must validate and protect file paths. [CITED: https://asvs.dev/v5.0.0/V5-File-Handling/] [VERIFIED: CONTEXT.md] |
| Authentication | no | No accounts, sessions, or remote auth surface in Phase 1. [VERIFIED: REQUIREMENTS.md] |
| Access Control | no | Local CLI only; no multi-user authorization model in Phase 1. [VERIFIED: REQUIREMENTS.md] |
| Cryptography / Data Protection | limited | Do not add crypto; do not log secrets or `.env` contents if environment diagnostics are added. [CITED: OWASP ASVS search result] [VERIFIED: .gitignore] |

### Known Threat Patterns for Phase 1

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| OS command injection through filenames or flags | Tampering / Elevation of privilege | Only execute argv arrays through `ProcessRunner`; never use shell command strings for user values. [CITED: https://bun.sh/docs/api/spawn] [VERIFIED: PITFALLS.md] |
| PATH confusion or wrong executable | Spoofing / Tampering | Report resolved executable paths from `Bun.which()` and include them in doctor output. [CITED: https://bun.sh/docs/api/utils] |
| Diagnostic leakage | Information disclosure | Render concise diagnostics; do not dump full environment variables or raw long stderr by default. [VERIFIED: PITFALLS.md] |
| False capability reporting | Repudiation / Tampering | Distinguish `available`, `missing`, `check-failed`, and `not-checked-yet`. [VERIFIED: CONTEXT.md] |

## Assumptions Log

All implementation-shaping claims in this research were verified against phase/project files, current npm metadata, local shell probes, official docs, or pinned Bright Builds standards. No `[ASSUMED]` claims are required for planning.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| - | None | - | - |

## Open Questions (RESOLVED)

1. **What Bun minimum should `package.json` document?**
   - What we know: Current target research says Bun 1.3.13, while local Bun is 1.3.9. [VERIFIED: local shell] [CITED: https://bun.sh/blog/bun-v1.3.13]
   - RESOLVED: Phase 1 will use APIs compatible with local Bun 1.3.9, document target/current Bun information in `doctor`, and avoid requiring 1.3.13-only flags. The current project target remains 1.3.13 for forward-looking stack documentation.

2. **Should `@clack/prompts` be installed now or deferred?**
   - What we know: Guided prompts are out of scope until Phase 6, but the project stack recommends Clack for guided UX. [VERIFIED: CONTEXT.md] [VERIFIED: STACK.md]
   - RESOLVED: Defer `@clack/prompts` until Phase 6. Phase 1 will not install Clack and will not create prompt-adapter scaffolding.

3. **Should `doctor` fail nonzero when FFmpeg/FFprobe are missing?**
   - What we know: FFmpeg/FFprobe are required for v1 media work, and Phase 1 success says `doctor` reports required and optional tools. [VERIFIED: ROADMAP.md] [VERIFIED: STACK.md]
   - RESOLVED: `doctor` returns the `missingTools` exit behavior when required tools (`ffmpeg`, `ffprobe`) are missing. Missing optional tools are warnings and do not fail in Phase 1; a future strict mode can change that behavior when explicitly planned.

## Sources

### Primary (HIGH confidence)

- `.planning/phases/01-bun-cli-foundation-trust-model/01-CONTEXT.md` - locked Phase 1 decisions, discretion areas, and out-of-scope items.
- `.planning/REQUIREMENTS.md` - CLI-01, CLI-02, CLI-03, TRUST-01, and TRUST-04 requirement text.
- `.planning/ROADMAP.md` - Phase 1 goal and success criteria.
- `.planning/research/STACK.md` - stack recommendations and external tool discovery contract.
- `.planning/research/ARCHITECTURE.md` - functional-core/imperative-shell layout and process runner boundary.
- `.planning/research/PITFALLS.md` - command execution, dependency discovery, and trust pitfalls.
- `AGENTS.md`, `AGENTS.bright-builds.md`, `standards-overrides.md` - repo workflow and standards routing.
- Bright Builds pinned standards at commit `05f8d7a6c9c2e157ec4f922a05273e72dab97676` - architecture, code shape, verification, testing, and TypeScript/JavaScript rules.
- Bun docs: TypeScript, subprocesses, test runner, executable lookup, package executables, and Bun 1.3.13 release notes.
- Commander README - CLI parser, subcommands, help, strict option behavior, and TypeScript import examples.
- Zod docs - Zod 4 stability, TypeScript-first validation, strict-mode requirement.
- Biome docs - install, format, lint, check, and CI guidance.
- npm registry metadata - current package versions and publish dates.
- Local shell probes - installed Bun, FFmpeg, FFprobe, and missing optional tools.

### Secondary (MEDIUM confidence)

- OWASP ASVS web search and `asvs.dev` pages - ASVS v5 category mapping for CLI input, command injection, and file handling.

### Tertiary (LOW confidence)

- None used for implementation recommendations.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - package versions were checked against npm and runtime/tool availability was probed locally.
- Architecture: HIGH - locked phase decisions and Bright Builds standards directly prescribe the boundaries.
- Pitfalls: HIGH - Phase 1 pitfalls come from locked trust decisions, project pitfall research, and official Bun process docs.

**Research date:** 2026-05-01  
**Valid until:** 2026-05-31 for package/tool versions; architecture guidance remains valid until phase scope changes.
