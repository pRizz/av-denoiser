---
phase: 08-optional-heavy-editor-integrations
verified: "2026-05-02T12:25:00.000Z"
status: passed
score: roadmap 5/5 success criteria + 6/6 REQ IDs verified
generated_by: inline-verifier
lifecycle_mode: yolo
phase_lifecycle_id: 12-2026-05-02T11-44-26
generated_at: "2026-05-02T12:00:00.000Z"
lifecycle_validated: true
---

# Phase 08: Optional Heavy & Editor Integrations — Verification Report

**Phase goal:** Users can opt into Demucs, Audacity automation, and FFmpeg LADSPA / melt-related signals when prerequisites exist, with clear warnings and diagnostics.

**Verified:** 2026-05-02T12:25:00.000Z

**Status:** passed

## Goal achievement

### Roadmap success criteria (goal-backward)

| # | Success criterion (must be true) | Status | Evidence |
|---|-----------------------------------|--------|----------|
| 1 | User can run a Demucs voice/source isolation step when Demucs and its runtime dependencies are installed. | ✓ VERIFIED | **`orderedSteps`** + **`expandPreset`** add **`tool: "demucs"`** with **`two-stems-vocals`** for **`speech-vocals-demucs`** (`src/domain/audio-pipeline-plan.ts`). **`buildLogicalStepCommand`** builds argv with **`--two-stems`**, **`vocals`**, **`-n`**, model, **`-o`** (`src/domain/audio-pipeline-argv.ts`). **`test/domain/audio-pipeline-plan.test.ts`** (**`expandPreset speech-vocals-demucs inserts demucs step`**), **`test/domain/audio-pipeline-argv.test.ts`**. **App-layer orchestration (mocked):** **`runCleanRequest speech-vocals-demucs executes demucs between extract and encode`** in **`test/app/clean.test.ts`**. |
| 2 | User receives clear warnings before Demucs uses significant CPU/GPU resources, downloads models, or runs slowly. | ✓ VERIFIED | Warning objects **`WARN_DEMUCS_MODEL`**, **`WARN_DEMUCS_HEAVY`**, **`WARN_DEMUCS_RESOURCE`** → ids **`warn-demucs-model-download`**, **`warn-demucs-heavy-runtime`**, **`warn-demucs-resource`** (`src/domain/audio-pipeline-plan.ts`). Asserted in **`test/domain/audio-pipeline-plan.test.ts`** (**`expandPreset speech-vocals-demucs inserts demucs step and warnings`**). |
| 3 | User can run an Audacity automation step when scripting or macro prerequisites are installed, enabled, and accepted. | ✓ VERIFIED | **`runAudacityMacro`**, opt-in gating via **`acceptAudacityPipeRisk`** / CLI wiring (`src/adapters/audacity-pipe.ts`, `src/app/clean.ts`, `src/domain/cli-request.ts`). **`test/adapters/audacity-pipe.test.ts`**. |
| 4 | User receives actionable diagnostics when Audacity cannot be automated because scripting, macro, pipe, GUI, or export settings are unavailable. | ✓ VERIFIED | **`formatAudacityDiagnostic`**, **`AudacityDiagnosticKind`** (`src/adapters/audacity-pipe.ts`). Covered in **`test/adapters/audacity-pipe.test.ts`**. |
| 5 | User can run a Kdenlive/MLT or Kdenlive-derived audio-filter integration when a practical headless path and required plugins are available, and can still complete supported FFmpeg/SoX/Demucs pipelines when it is unavailable. | ✓ VERIFIED | **`probeFfmpegLadspaFilter`**, **`melt`** discovery, doctor optional facts (`src/app/doctor.ts`, `src/adapters/tool-discovery.ts`, `src/domain/doctor-report.ts`). **`test/adapters/tool-discovery.test.ts`**, **`test/app/doctor.test.ts`**. Graceful degradation: planning fails LADSPA only when **`maybeLadspa`** requested without filter; Demucs path independent (**`src/app/clean.ts`**). |

### Requirements coverage (`REQUIREMENTS.md`)

| Requirement | Claimed in PLAN frontmatter | Status | Evidence |
|-------------|----------------------------|--------|----------|
| **TOOL-03** | `08-01-PLAN.md`, `08-02-PLAN.md` | ✓ SATISFIED | Demucs logical step, argv, **`resolveDemucsInvocation`**, **`runSequentialPipeline`** stem resolution (`src/domain/audio-pipeline-plan.ts`, `src/domain/audio-pipeline-argv.ts`, `src/app/clean.ts`); tests above + **`runCleanRequest speech-vocals-demucs executes demucs between extract and encode`**. |
| **TOOL-04** | `08-01-PLAN.md`, `08-02-PLAN.md` | ✓ SATISFIED | Pipeline warnings + batch/manifest parity per Phase 7/8 plans; warning ids in **`audio-pipeline-plan.ts`**; **`test/domain/audio-pipeline-plan.test.ts`**. |
| **TOOL-05** | `08-03-PLAN.md` | ✓ SATISFIED | Audacity opt-in and macro step integration (`src/adapters/audacity-pipe.ts`, `src/app/clean.ts`, `src/cli/command.ts`). |
| **TOOL-06** | `08-03-PLAN.md` | ✓ SATISFIED | **`formatAudacityDiagnostic`** + kinds (`src/adapters/audacity-pipe.ts`); **`test/adapters/audacity-pipe.test.ts`**. |
| **TOOL-07** | `08-04-PLAN.md` | ✓ SATISFIED | Doctor **`ladspa`** / **`melt`** / Demucs discovery (`src/app/doctor.ts`, `src/adapters/tool-discovery.ts`). **`test/app/doctor.test.ts`**, **`test/adapters/tool-discovery.test.ts`**. |
| **TOOL-08** | `08-04-PLAN.md` | ✓ SATISFIED | Degraded optional paths without hard coupling to melt; docs + clean integration (`docs/doctor.md`, `src/app/clean.ts` per **08-04**). |

### Anti-patterns

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No new TODO/FIXME required for Phase 8 contract in this verification pass. |

### Behavioral spot-checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Aggregate verification gate | `bun run verify` | Exit 0 — Biome `ci`, `tsc --noEmit`, `bun test` suite passes | ✓ PASS |

### Gaps summary

**CI vs real machine:** Unit and app-layer tests use **mocked** `runProcess` and fixtures. **`v1.0-MILESTONE-AUDIT.md`** *tech_debt* still notes real-machine validation for Demucs, Audacity **mod-script-pipe**, and distro **LADSPA** installs — this artifact does **not** claim green E2E coverage for those environments.

---

_Phase 12 gap closure (`12-01-PLAN.md`) — `08-VERIFICATION.md`_
