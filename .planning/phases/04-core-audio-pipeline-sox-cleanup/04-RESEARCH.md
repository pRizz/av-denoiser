# Phase 4: Core Audio Pipeline & SoX Cleanup - Research

**Researched:** 2026-05-02  
**Domain:** Bun CLI + FFmpeg / SoX_ng sequential audio pipeline  
**Confidence:** MEDIUM-HIGH for architecture and codebase fit; MEDIUM for concrete FFmpeg/SoX filter recipes (validated pattern, not exhaustive matrix)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase boundary**

- Phase 4 delivers **MEDIA-01** and **PIPE-01 … PIPE-06** plus **TOOL-02**: a **sequential**, **preset-driven** cleanup path for **a single audio file** input that yields a **cleaned audio output file**, using **transparent** ordered steps (FFmpeg core + optional **SoX / SoX_ng** when available), **PCM-oriented intermediates by default**, and **explicit warnings** for aggressive, slow, model-backed, or artifact-prone steps.
- **Explicitly defer to Phase 5:** final **video+audio** remux execution, VIDEO-04-style run reports beyond what Phase 4 needs locally, and full **TOOL-01** “always-on” FFmpeg filter execution as the only path (Phase 4 still requires FFmpeg for decode/encode at minimum).
- **Explicitly defer to Phase 8:** Demucs, Audacity, Kdenlive/MLT integrations (TOOLS 03–08).
- Interactive guided UX and flag-for-non-interactive parity (**CLI-04**, UX-*) remain **Phase 6**—Phase 4 should still define **deterministic typed requests** so later phases mirror the same underlying plan/run model.

**Execute surface and modality gate (MEDIA-01 alignment)**

- **D-01:** Introduce a **dedicated execution subcommand** (exact name implementation detail — e.g. `clean`) rather than turning `inspect` into a blended plan+execute command. **Inspect stays plan-only for all modalities**; the new command owns “run pipeline when safe.”
- **D-02:** Phase 4 **audio execute path** gates on **`OutputPlan.modality === "audio-only"`**. Inputs that resolve to `video-copy-safe`, `fallback-required`, or `unsupported` are **plan-time rejected** from this command with stable outcomes (reuse **Phase 1** exit taxonomy — e.g. `invalid-input`, `fallback-required`, or a dedicated **`unsupported-input-modality`** if cleaner). **Phase 5** will add execution for mixed A/V once remux/reporting lands.
- **D-03:** Preserve **collision-safe defaults** from Phase 2 (`output-path` rules, sibling naming, overwrite opt-in)** for audio outputs.**

**Preset transparency (PIPE-01, PIPE-02)**

- **D-04:** Ship a **small, named preset set** authored as **typed data in the functional core** (e.g. `src/domain/` registry + discriminated unions + Zod at boundaries)—not arbitrary user FFmpeg filtergraphs (see REQUIREMENTS Out of Scope).
- **D-05:** Every preset **expands to an ordered list of pipeline steps** (tool + step kind + bounded options) surfaced in **`--dry-run` / textual summary before execution** alongside resolved binary paths after discovery (**doctor-style** readiness still optional for Phase 4 but mismatches fail with actionable errors).

**Per-step tuning (PIPE-03)**

- **D-06:** Bounded **preset-level knobs** only for v1 (e.g. overall strength / profile enum / a few numeric fields validated per step)—no open-ended filter strings. Prefer **explicit flags** mirrored later in Phase 6 rather than YAML/JSON authoring (**AUTO-04** deferred).

**Sequential execution and intermediates (PIPE-04, PIPE-05)**

- **D-07:** Runner executes **exactly one step at a time**; step *k* consumes the previous artifact path and writes the next. Fail fast preserves partial artifacts only when useful for debugging (implementation discretion; default bias: **cleanup temps on success**, **leave on failure** configurable later).
- **D-08:** Default intermediate serialization is **`wav` PCM (e.g. s16le)** for maximum compatibility across FFmpeg ⇄ SoX handoffs; ** FLAC** remains an allowable implementation optimization only if equivalently lossless and covered by tests.

**FFmpeg vs SoX responsibilities (PIPE-*, TOOL-02)**

- **D-09:** **FFmpeg** owns **decode from source container**, **encode to final planned audio codec/container** aligned with **`OutputPlan` / Phase 2** defaults for audio-only (**AAC + MP4 today** unless planning introduces an audio-only divergent branch—prefer **reuse `plannedAudioCodec` / `plannedContainer`** fields rather than silently inventing defaults in the runner).
- **D-10:** **Native FFmpeg denoise / dynamics / EQ filters** belong in **typed FFmpeg substeps**. **SoX / SoX_ng** substeps handle **effects-based cleanup** only when **`sox_ng` preferred, `sox` fallback** discovery matches STACK + existing **doctor-report** tooling names.
- **D-11:** If SoX unavailable for a preset that includes SoX, **surface a clear planning/runtime error** (“missing optional tool”)—no silent omission of billed steps unless preset metadata explicitly marks alternate FFmpeg-only degraded paths (**default: no silent degradation without user-visible preset variant**).

**Risk warnings (PIPE-06)**

- **D-12:** Attach **`pipelineWarnings[]`** (stable string IDs + human titles) during preset expansion and/or preflight—not only stderr from tools. Warn for **heavy CPU**, **artifact risk**, **double dynamics**, **narrowband speech destruction**, etc., following product tone (“honest companion,” not alarming spam).

**Trust and observability continuity**

- **D-13:** All external tool invocations continue **argv-only** (`ProcessRunner` pattern). Log **effective argv arrays** into structured summaries where TRUST-focused reporting exists; raw media noise remains **never** the only error signal (align mindset with Phase 5 **TRUST-02**/03 even if fuller reporting waits).

### Claude's Discretion (folded under Implementation Decisions in CONTEXT.md)

- Exact preset names, default FFmpeg filter choices (**afftdn** vs **anlmdn** ordering), tempfile naming schema, parallelism (none in Phase 4), and whether **`arnndn`** appears in presets before optional models are ergonomically surfaced (bias: **defer model-file UX** toward Phase 8 / ADV-* unless trivially guarded).
- Whether **Phase 4** exposes a minimal **`--json`** for pipeline plans before run (recommended for parity with inspect, but schema can evolve in planning).

### Deferred Ideas (OUT OF SCOPE — from CONTEXT.md)

- **Demucs / Audacity / melt** integration paths (**Phase 8**).
- **Video output** execution + **final human reports** verifying stream copy (**Phase 5** + VIDEO-04 / TRUST-02/03).
- **Interactive wizard** equivalents + copied command strings (**Phase 6**, CLI-04).
- Full **AUTO-04** authored pipeline config files vs Phase 4 bounded knobs.

*(Folded todos: none.)*
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **MEDIA-01** | Single audio input → cleaned audio output | `clean` orchestration: probe + path resolve + modality gate (**audio-only**) + sequential steps + final encode per `OutputPlan` |
| **PIPE-01** | Recommended presets vs raw filtergraphs | Typed preset registry + expansion only to known step kinds; REQUIREMENTS forbid raw FFmpeg UX |
| **PIPE-02** | Inspect preset resolution before run | Mirror `inspect`: `--dry-run` prints ordered steps + resolved tool paths + warnings |
| **PIPE-03** | Bounded enable/tune options | Explicit CLI flags mapped into validated structs; clamp ranges in domain expansion |
| **PIPE-04** | Sequential consume-produce pipeline | Explicit runner loop over expanded steps; argv from pure builders |
| **PIPE-05** | Lossless/PCM intermediates default | WAV `pcm_s16le` contract between FFmpeg and SoX; avoid lossy in the middle |
| **PIPE-06** | Warnings for aggressive/slow/model risk | Stable `pipelineWarnings[]` IDs at expansion time (**D-12**) |
| **TOOL-02** | SoX / SoX_ng when installed | Prefer `which("sox_ng")` then `which("sox")` — matches `doctor-report` / `tool-discovery` tool names |

</phase_requirements>

---

## Summary (executive)

Phase 4 should mirror the **`inspect`** proof chain (**ffprobe → `resolveOutputPath` → `planMediaOutput`**) before any processing, then **reject non–audio-only modalities** at the CLI/app boundary per **D-02** instead of branching inside the runner. The functional core owns **preset selection → expansion → ordered `PipelineStep` discriminated unions → argv-level `ProcessCommand` plans**, including **`pipelineWarnings[]`**. Adapters retain **argv-only `Bun.spawn`** via **`runProcessCommand`**.

Encode ownership stays with **FFmpeg** end-to-end for container decode/re-encode (**D-09,D-10**): first step extracts a **canonical PCM WAV intermediate** aligned to a chosen sample rate / channel layout; middle steps optionally invoke **SoX_ng/sox** for effect chains **only after** verifying the subprocess exists; terminal step emits **`plannedAudioCodec` + `plannedContainer`** from **`OutputPlan`** (today **AAC in MP4** for supported non-unsupported plans). This keeps Phase 5 able to reuse the same step model for mixed A/V.

**Primary recommendation:** Implement **`clean`** (or similarly named subcommand), **`CliRequest` extension**, **`runCleanRequest`** patterned on **`runInspectRequest`**, and a **`src/domain/` pipeline module** exporting pure **expandPreset → buildArgvForStep** helpers with exhaustive `switch (step.kind)` typing.

---

## Project constraints (repository)

- **`AGENTS.md` / STACK:** Bun CLI, FFmpeg-first, **`sox_ng` preferred, `sox` fallback**, Zod at boundaries, argv-only **`ProcessRunner`**, functional core vs imperative shell. [CITED: repo `AGENTS.md` embedded stack section]
- **`.cursor/rules/`:** No workspace rules directory with actionable files (Glob returned 0 entries). **[VERIFIED: repo scan]**

---

## Current codebase integration points

| Concern | File(s) | Notes |
|--------|---------|-------|
| Modality gate | `src/domain/output-plan.ts` (`OutputPlan`, `audio-only`) | `clean` must fail early when modality ≠ **`audio-only`** |
| Probe + planning flow | `src/app/inspect.ts` | Duplicate **preflight skeleton**: ffprobe presence, **`runFfprobeProbe`**, **`resolveOutputPath`**, **`planMediaOutput`** |
| Routing | `src/cli/command.ts`, `src/domain/cli-request.ts`, `src/app/run-command.ts` | Add **`CliRequest` variant** + **`case "clean"`** |
| Spawn contract | `src/adapters/process-runner.ts`, `src/domain/process-command.ts` | Preserve **`createProcessCommand`** + **`runProcessCommand`** only |
| Tool names | `src/adapters/tool-discovery.ts`, `src/domain/doctor-report.ts` | **`ToolName`** already includes **`sox_ng`**, **`sox`** optional; preset expansion should **`Bun.which("sox_ng") ?? Bun.which("sox")`** in app layer **[ASSUMED]** or inject `maybeWhich` for tests (**same pattern as `inspect`**). |
| Outcomes / exits | `src/domain/command-outcome.ts`, `src/domain/exit-codes.ts` | Extend **`CommandFailureReason`** only if **`unsupported-input-modality`** needs distinct semantics; mapping must stay coherent with **`mapOutcomeToExitCode`** (**D-02**, Phase 1 doc) **[ASSUMED]** |
| Summaries | `src/domain/inspect-summary.ts` | Optional parallel type **`CleanDryRunSummary`** for **`--json` / text** (**Claude’s discretion**) |

---

## Recommended domain model

### Preset registry (functional core)

- **`PresetId`** as string union literal type (`type PresetId = "speech-soft" | ...`).
- **`PipelinePreset`** object: **`id`, `displayName`, `description`, step templates, default warning IDs**, optional **`requiresTool: readonly ("ffmpeg" \| "sox")[]`** for preflight grouping.
- **Boundaries:** Optional **Zod** schema parsing only if preset IDs/options arrive from CLI flags as strings (**align with existing Zod/ffprobe boundaries**).

### Pipeline step discriminated unions

Separate **logical step** vs **executable plan**:

```typescript
// Illustrative shape — planners should refine field names/types.
export type FFmpegStepKind =
  | { kind: "extract-pcm-wav"; mapAudioStreamFromInput: boolean }
  | { kind: "afftdn"; strength: number } // bounded
  | { kind: "encode-deliverable"; audioCodec: PlannedAudioCodec; container: PlannedContainer };

export type SoxStepKind =
  | { kind: "highpass-lowpass"; /* … */ }
  | { kind: "compand-soft"; /* … */ }; // placeholders – exact effects are discretion

export type PipelineStep =
  | { readonly tool: "ffmpeg"; readonly step: FFmpegStepKind }
  | { readonly tool: "sox"; readonly step: SoxStepKind };
```

Planner task: freeze **minimal v1 FFmpeg kinds** aligned to installed filter checks later (doctor may stay “not-checked-yet” Phase 01 but **preset expansion** can probe **`ffmpeg -filters`** selectively if needed **[ASSUMED: optional Phase 4 scope]**).

### Expansion → argv plans

- **`expandPreset(presetId, knobs, probeMeta) → ExpandedPipeline`** where **`ExpandedPipeline`** includes:

  - **`steps: PipelineStep[]`**
  - **`warnings: ReadonlyArray<{ id: string; title: string; detail?: string }>`**

- **`buildProcessCommands(step, paths, probeContext) → readonly ProcessCommand[]`** (often one command per step).

**Serializable dry-run artifact:** ordered list of **`renderDisplayCommand`-style previews** (**TRUST**) plus **tool absolute paths**.

---

## FFmpeg vs SoX responsibilities and WAV intermediate contract

### Division of labor (**D-09, D-10**)

| Role | FFmpeg | SoX / SoX_ng |
|------|--------|----------------|
| Demux/decode source | ✓ `-i`, `-map` selected stream | — |
| Denoise/EQ FFmpeg-native | ✓ **`filter_complex`/`-af`** typed substeps (**afftdn**, etc.) [CITED: project `research/STACK.md` intent] | — |
| Gentle dynamics / EQ / chains SoX excels at | — | ✓ effect chain **`sox`** (`soxi` sidecar optional later) **[ASSUMED naming: SoX invocation style]** |
| Final encode (**AAC/MP4** per plan) | ✓ **`OutputPlan`** fields | — |

### WAV / PCM (**D-08, PIPE-05**)

- **Format:** WAV container + **PCM s16le** (`pcm_s16le` in FFmpeg terms) aligns with **`PlannedAudioCodec`** union’s **`pcm_s16le`** and MAX interchange **FFmpeg ↔ SoX**.
- **Pin metadata explicitly** in extraction: **`-ar SAMPLE_RATE`** and **`-ac CHANNELS`** (from probe-derived selected stream `[ASSUMED: required to avoid tacit ffmpeg resamplers changing sound between steps`).
- FFmpeg-style encode example surface (conceptual argv fragments, not shell strings): `-f wav -c:a pcm_s16le` on output **`intermediate.wav`**. **[CITED: FFmpeg documents PCM/audio encoding concepts at https://ffmpeg.org/ffmpeg-all.html — filter/codec specifics project-specific]**  
- FLAC as intermediate is **explicitly secondary** (**D-08**): only if lossless-parity proven + tests (**planner gates**).

### Stream selection

Reuse **`plan.selectedAudioStreamIndex`** (**Phase 2/3**) in **FFmpeg `-map 0:N`** where **N** is the stream index **`0:`** namespace rules — verify against ffprobe **`index`** field semantics in implementation (**common pitfall** below).

---

## CLI surface (`clean` or equivalent)

Per **D-01, D-02, D-05, D-06**:

| Concern | Suggested behavior |
|---------|---------------------|
| **Arguments** | **`<input>`** path plus **`-o, --output`**, **`--force`** parity with **`inspect`** |
| **Preset** | **`--preset <id>`** (required unless you add a deterministic default preset — recommend **explicit default literal** (`speech-light`) in code to avoid ambiguity) **[ASSUMED]** |
| **Dry run** | **`--dry-run`**: prints steps, warnings, tools, collisions; exits **0** on success (**no ffmpeg run**) |
| **JSON** | Optional **`--json`** dry-run + maybe post-run structured summary (**Claude’s discretion**) — mirror **`InspectPlanSummary` JSON path** (`src/cli/render.ts`) |
| **Modality rejection** (**D-02**) | Before tools: **`plan.modality`** must be **`audio-only`**; otherwise map to **`invalid-input`** (message names modality + points to **`inspect`** / **`Phase 5`**) OR add dedicated failure **`unsupported-input-modality`** if exit distinction matters |
| **Tuning knobs** | Start with **≤3 flags** wired to enums/numbers (**D-06**): e.g. **`--noise-strength`** clamped `[0–1]` or preset enum (**planner selects naming**) |

Inspect remains **plan-only**: **no_execute** invariant preserved.

---

## Error / outcome mapping (exit codes)

Existing **[VERIFIED: `src/domain/command-outcome.ts`, `exit-codes.ts`]**:

| Outcome flavor | Typical Phase 4 use |
|----------------|---------------------|
| **success** | Clean/dry-run completed |
| **invalid-input** | Video file on **`clean`**, bad preset id, modality gate |
| **missing-tools** | Missing **ffmpeg/ffprobe**, or preset needs **SoX** and neither **`sox_ng`/`sox`** (**D-11**) |
| **planning-failure** | Path collision without **`--force`**, probe/plan inconsistencies |
| **processing-failure** | Non-zero **ffmpeg/sox**, signal, malformed intermediate |
| **fallback-required** | Likely **not** emitted by **`clean`** if gate runs first; keep for shared helpers if **`planMediaOutput`** used before modality check inconsistently (**avoid**) |
| **internal-error** | Unexpected throws |

Gap (**D-02**): Decide whether modality mismatch uses **`invalid-input`** (reuse) or **`planningFailure`** vs new **`unsupported-input-modality` → invalidInput (2)** for documentation clarity (**open question below**).

---

## Risks and open questions

1. **ffprobe stream `index` vs FFmpeg `-map`**: Off-by-one or multi-program streams can select wrong audio; mitigation: unit tests with fixtures + explicit mapping helper ([**MEDIUM**, **ASSUMED** until fixture tests]).  
2. **SoX unavailable on dev/CI**: Presets requiring SoX must **fail visibly** (**D-11**); offer **paired FFmpeg-only preset variants** “in cards” (**Specific Ideas**) as separate **`PresetId`**s, **not silent drop**.  
3. **AAC in MP4** quality flags: Bounded **`-b:a` / VBR profiles** belong in FFmpeg encode substep (**Claude’s discretion**); omitting may produce FFmpeg defaults — stack says avoid hidden defaults at **delivery** (**VIDEO-05** alignment).  
4. **Filter availability**: FFmpeg builds vary; **`afftdn` vs `arnndn` (needs model)** — defer **`arnndn`** per discretion unless guarded. **[ASSUMED]**  
5. **`OutputPlan.reasonCodes`** for **`audio-only`** still includes stub-like **`phase-2-stub-audio-only`** in code (**`output-plan.ts`**) — harmless for gating **modality**, but summaries may confuse users; optionally normalize in **`inspect`/clean renderer** (**clarity**, not blocker). **[VERIFIED: `output-plan.ts` line 69]**  

---

## Suggested plan split (executor waves)

1. **Wave A — Domain types:** **`PresetId`**, **`PipelineStep`**, **`ExpandedPipeline`, `pipelineWarnings`**, pure **`expandPreset`**, knobs validation. **`bun test`** only.  
2. **Wave B — Argv builders:** **`buildExtractWavCommand`**, **`buildFfmpegFilterCommand`**, **`build.EncodeDeliverableCommand`**, **`buildSoxCommand`** returning **`createProcessCommand` results.** Unit-test snapshots of argv arrays (`TRUST`).  
3. **Wave C — Orchestration:** Temp dir / naming (`tmpdir`/`os.tmpdir` **`[ASSUMED Bun-compatible]`** ), sequential **`runProcess`**, non-zero mapping to **`processing-failure`**.  
4. **Wave D — CLI:** **`clean` commander wiring**, **`CliRequest`**, **`run-command` routing**, **`--dry-run`/`--preset`/`--json`**, text render.  
5. **Wave E — Integration smoke (optional CI-gated):** If **ffmpeg** on PATH (**[VERIFIED: dev env has ffmpeg 8.1]** ), generate synthetic WAV fixture in test or skip when missing — **avoid hard dependency on SoX for default CI**.

---

## Testing strategy (**Nyquist off** — `workflow.nyquist_validation: false` **[VERIFIED: `.planning/config.json`]**

- **Pure core:** Expansion, warning attachment, modality gate, argv generation — **`bun test`** with deterministic inputs (unchanged **`test/`** convention). **[VERIFIED: `package.json` `"test": "bun test"`]**  
- **Shell adapters:** **`runInspectRequest`-style mocked `runProcess`** to assert ffmpeg/sox invoked with expected argv (**existing Phase 1 injectable deps pattern** **[VERIFIED: `inspect.ts`]**).  
- **Integration smoke:** Optional **fixture audio** (~1 s sine) piped through **FFmpeg-only** preset when **`ffmpeg`** present; **`sox`** tests gated behind **`SOX_AVAILABLE=1`** or `command -v` at test start (**[ASSUMED]** pattern).

---

## Standard stack (**Phase 4 scope** — no major new libs)

### Core (**[VERIFIED: `package.json`]** npm registry subset)

| Library | Pin in repo | Purpose |
|---------|--------------|---------|
| **Bun** | runtime (dev shows **1.3.9** — **≠** STACK doc **1.3.13**; treat as **[VERIFIED: local]** `bun --version`) | spawn, CLI |
| **commander** + **@commander-js/extra-typings** | **^14.x** (**latest registry 14.0.3** **[VERIFIED: npm registry `npm view commander version`]**) | subcommands |
| **zod** | **^4.4.x** (**registry 4.4.2** **[VERIFIED: npm registry]**) | flag/preset envelope parsing |

### External tools

| Tool | Role |
|------|------|
| **ffmpeg/ffprobe** | required |
| **sox_ng / sox** | optional (**TOOL-02**) |

---

## Sources

### Primary

- Repo **`.planning/phases/04-core-audio-pipeline-sox-cleanup/04-CONTEXT.md`** — locked decisions (**[VERIFIED]**).  
- **`src/domain/output-plan.ts`**, **`src/app/inspect.ts`**, **`src/adapters/process-runner.ts`** — wiring facts (**[VERIFIED]**).  
- FFmpeg project documentation (**pcm / encoding / filters**) — **[CITED: https://ffmpeg.org/ffmpeg-all.html]** general reference; preset-specific graphs require implementation-time filter doc lookup.  

### Secondary / assumptions

- SoX invocation and effect chaining — **[ASSUMED: SoX manual behavior]** pending install for live verification (**STATE.md** flags SoX friction).  

---

## Assumptions log

| # | Claim | Risk |
|---|-------|------|
| A1 | Explicit **`-map 0:N`** matches **ffprobe** stream index convention for inputs | Wrong stream selected → wrong audio processed |
| A2 | Pinning **`-ar`/`-ac`** on WAV intermediates suffices for FFmpeg↔SoX stability | Rare edge codecs/layout quirks |
| A3 | **Modality gate** rejects video before spawning — users rely on **`inspect`** for modality story | UX confusion when error message drafting is weak |

---

## Environment availability (**Step 2.6** — sandbox check)

**Host:** Darwin dev session **2026-05-02**.

| Dependency | Available | Version / note | Fallback |
|------------|-----------|----------------|----------|
| **ffmpeg** | ✓ | **8.1** | — |
| **ffprobe** | ✓ | **8.1** | — |
| **sox_ng** | ✗ | — | **sox** **✗** here — FFmpeg-only presets or install SoX_ng (**[VERIFIED: `command -v`]** ) |
| **bun** | ✓ | **1.3.9** | — |

Planner should assume **optional SoX absent** frequently; deterministic tests must not require it unless flagged.

---

## Metadata

**Valid until:** ~30 days (toolchain + Bun version drift).

---

## RESEARCH COMPLETE
