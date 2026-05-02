---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 12-2026-05-02T11-44-26
generated_at: "2026-05-02T11:44:26.506Z"
---

# Phase 12: milestone-gap-phase-08-verification - Context

**Gathered:** 2026-05-02  
**Status:** Ready for planning  
**Mode:** Yolo

<domain>

## Phase Boundary

Close **v1.0 milestone audit** gaps for Phase 8: publish **`08-VERIFICATION.md`** that ties **TOOL-03**–**TOOL-08** to shipped code and tests (especially **`08-CONTEXT`** / **`08-01`–`08-04-PLAN`** intent), restore **`requirements-completed`** on **`08-01-SUMMARY.md`…`08-04-SUMMARY.md`** to match each plan’s **`requirements:`**, and strengthen **documented execution-path confidence** for optional heavy integrations per **ROADMAP** Phase 12 (verification artifact **plus** targeted test work **where** the audit flagged thin coverage — see **D-05**).

**Phase folder on disk:** `.planning/phases/08-optional-heavy-editor-integrations/` (not `08-optional-heavy-integrations`).

</domain>

<decisions>

## Implementation Decisions

### Verification artifact (parity with gap phases 9–11)

- **D-01:** Publish **`.planning/phases/08-optional-heavy-editor-integrations/08-VERIFICATION.md`** beside Phase 8 plans and summaries — not only under the Phase 12 gap directory.
- **D-02:** Mirror **goal-backward** layout used in **`03-VERIFICATION.md`**, **`04-VERIFICATION.md`**, **`05-VERIFICATION.md`**: ROADMAP **Phase 8** success-criteria table (**five** bullets); **`REQUIREMENTS.md`** coverage table for **TOOL-03**–**TOOL-08** with **✓ SATISFIED** and evidence columns (**paths + test names**); **Anti-patterns** (explicit **—** row if none); **Behavioral spot-checks** for **`bun run verify`**; short **Gaps / residual risk** note for **real-machine** optional tools (see **D-06**).
- **D-03:** YAML frontmatter on **`08-VERIFICATION.md`**: `phase: 08-optional-heavy-editor-integrations`, `status: pending` until verify gate passes, then `passed` + `verified` ISO timestamp; include `generated_by`, `lifecycle_mode`, `phase_lifecycle_id` aligned with Phase 12 execution, and **`lifecycle_validated: true`** after finalize — consistent with prior verification artifacts.

### SUMMARY hygiene (`requirements-completed`)

- **D-04:** Add or merge YAML frontmatter on **`08-01-SUMMARY.md`…`08-04-SUMMARY.md`** so **`requirements-completed`** matches **`requirements:`** on **`08-01-PLAN.md`…`08-04-PLAN.md`** respectively:
  - **08-01:** `[TOOL-03, TOOL-04]`
  - **08-02:** `[TOOL-03, TOOL-04]`
  - **08-03:** `[TOOL-05, TOOL-06]`
  - **08-04:** `[TOOL-07, TOOL-08]`
- **D-04b:** Optional verifier provenance on summaries (e.g. **`generated_by`**, **`phase_lifecycle_id`**) — non-destructive merge only; do not drop historical keys.

### Change policy (docs vs tests)

- **D-05:** **ROADMAP** Phase 12 calls for **`08-VERIFICATION.md`** **and** *add or extend app-layer tests wherever audit cited thin execution coverage*. **Default path:** documentation + verification + summary frontmatter. **Exception:** if authoring surfaces a **real gap** vs **`v1.0-MILESTONE-AUDIT.md`** *“thinner app-layer executed-path tests vs optional toolchain”* (TOOL-03), add **minimal**, **deterministic** tests (mocks / fakes / existing spawn stubs) — **not** CI that requires real Demucs, Audacity GUI, or distro LADSPA unless the repo already standardizes that. **STOP** and open a **defect / follow-up phase** if the gap needs large product rework.
- **D-06:** **Real-machine confidence:** `08-VERIFICATION.md` should **honestly scope** what **unit tests** prove vs what **`v1.0-MILESTONE-AUDIT.md` tech_debt** still lists (e.g. real Demucs / Audacity pipe / distro LADSPA paths) — cite that section where appropriate without claiming E2E coverage the repo does not run.

### Evidence anchors (for the verification author)

- **D-07:** Ground claims in **`orderedSteps` / Demucs preset** (`src/domain/audio-pipeline-plan.ts`); **`buildLogicalStepCommand`** (`src/domain/audio-pipeline-argv.ts`); **`runSequentialPipeline`**, **`resolveDemucsInvocation`** (`src/app/clean.ts`); **`src/adapters/audacity-pipe.ts`**; **`src/adapters/tool-discovery.ts`**; doctor surfaces (`src/app/doctor.ts`, `src/domain/doctor-report.ts`); CLI flags (`src/cli/command.ts`, `src/domain/cli-request.ts`). Tests: **`test/domain/audio-pipeline-argv.test.ts`**, **`test/app/clean.test.ts`**, **`test/adapters/audacity-pipe.test.ts`**, **`test/adapters/tool-discovery.test.ts`**, and any batch/manifest files tied to TOOL-04 manifest persistence per **08-02** / Phase 7 contracts.

### Behavioral gate

- **D-08:** Set **`status: passed`** on **`08-VERIFICATION.md`** only after **`bun run verify`** exits **0**. Describe the suite qualitatively (Biome, `tsc`, tests) **without** brittle hard-coded test counts.

### Claude's Discretion

- Exact test cases added under **D-05** exception.
- Wording of evidence cells and ordering of REQ rows.
- Depth of “residual real-machine risk” prose in **Gaps**.

### Folded Todos

_None — `todo match-phase` returned no matches._

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and audit

- `.planning/ROADMAP.md` — Phase 8 success criteria; Phase 12 goal (verification + execution-path confidence).
- `.planning/v1.0-MILESTONE-AUDIT.md` — **TOOL-03** partial / missing **`08-VERIFICATION.md`**; integration notes for optional heavy tools.

### Phase 8 implementation context and plans

- `.planning/phases/08-optional-heavy-editor-integrations/08-CONTEXT.md` — Locked product decisions (Demucs, Audacity, LADSPA/melt).
- `.planning/phases/08-optional-heavy-editor-integrations/08-01-PLAN.md` through **`08-04-PLAN.md`** — **`requirements:`** source of truth for summaries.
- `.planning/phases/08-optional-heavy-editor-integrations/08-RESEARCH.md` — Research backdrop if planners need CLI/tool specifics.

### Verification templates and gap pattern

- `.planning/phases/04-core-audio-pipeline-sox-cleanup/04-VERIFICATION.md` — Frontmatter + structure reference.
- `.planning/phases/05-final-media-output-reporting/05-VERIFICATION.md` — Multi-REQ table + spot-check pattern.
- `.planning/phases/11-milestone-gap-phase-05-verification/11-CONTEXT.md` / **`11-01-PLAN.md`** — Recent gap-phase verifier + **`bun run verify`** gate pattern.

### Requirements

- `.planning/REQUIREMENTS.md` — **TOOL-03**–**TOOL-08** acceptance text.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Demucs path:** `speech-vocals-demucs` preset, **`two-stems-vocals`** step, TOOL-04 warning ids in **`audio-pipeline-plan.ts`**; argv construction in **`audio-pipeline-argv.ts`**.
- **Audacity:** **`audacity-pipe`** adapter with diagnostic kinds for TOOL-06.
- **Discovery / doctor:** **`tool-discovery.ts`** Demucs **`python3 -m demucs`** fallback; doctor reporting extensions in **`doctor-report.ts`** / **`doctor.ts`** for TOOL-07/08 signals.

### Established Patterns

- Gap phases **9–11:** **`NN-VERIFICATION.md`** in the **original** phase directory + SUMMARY **`requirements-completed`** repair + verify gate.

### Integration Points

- **`runCleanRequest`** sequential pipeline is the main execution spine for optional steps; batch manifest may carry heavy-step warnings per Phase 7/8 contracts.

</code_context>

<specifics>

## Specific Ideas

- Verification should explicitly map each ROADMAP Phase 8 success criterion to **test or module evidence**, and call out **audit** residual **real-machine** items instead of overstating CI coverage.

</specifics>

<deferred>

## Deferred Ideas

- Full guided-mode parity with optional-heavy CLI flags belongs to **Phase 14** / **UX-02** track — note in **`08-VERIFICATION.md`** only if it affects TOOL REQ satisfaction statements.

### Reviewed Todos (not folded)

_None._

</deferred>

---

_Phase: 12-milestone-gap-phase-08-verification_  
_Context gathered: 2026-05-02_
