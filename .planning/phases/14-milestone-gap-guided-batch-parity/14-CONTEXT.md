---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 14-2026-05-02T12-29-42
generated_at: 2026-05-02T12:29:42.728Z
---

# Phase 14: Milestone Gap — Guided optional-tool parity & Phase 6/7 verification - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning
**Mode:** Yolo

<domain>
## Phase Boundary

Close the v1.0 milestone audit gaps for **guided → optional heavy parity** and **missing Phase 6 / Phase 7 verification artifacts**:

1. **Product:** Guided **`clean`** must expose the same **opt-in surfaces** as **`clean`** / **`batch`** for **Demucs-capable presets**, **Audacity automation** (macro + pipe-risk acknowledgement), and **FFmpeg LADSPA** selections, including **warnings** and **confirmations** consistent with Phase 8 semantics — without inventing new integration behaviors beyond what flags already express.

2. **Documentation / audit:** Author **`.planning/phases/06-guided-repeatable-workflows/06-VERIFICATION.md`** and **`.planning/phases/07-batch-processing-manifests/07-VERIFICATION.md`** that map **CLI-04**, **UX-01–UX-05**, and **BATCH-01–BATCH-04** to **code paths + tests + `bun run verify`**, explicitly referencing **Phase 13** for **BATCH-05** / **`maybeDoctorFacts`** closure.

Phase boundary is **parity + verification**, not new presets, batch UX redesign, or Demucs/Audacity implementation beyond guided wiring and argv equivalence.

</domain>

<decisions>
## Implementation Decisions

### Guided optional-tool parity (audit integration cluster)

- **D-01:** Extend **`GuidedCleanSelections`** (and **`selectionsToCleanRunInput`**) so guided runs can produce the same **`CleanRunInput`** fields **`clean`** already accepts: **`presetId`** including **`speech-vocals-demucs`** where applicable; **`acceptAudacityPipeRisk`**; **`maybeAudacityMacro`**; **`maybeLadspa`** (same shapes as **`CliRequest`** / **`clean`** command options).

- **D-02:** **Prompt sequencing:** After baseline prompts (input, output, preset, noise, force, allow-video-fallback), **conditionally** branch only when the chosen preset or user choices require optional tooling — mirror **`clean`** validation order (plan-time failures surface before execute). Use **`@clack`** patterns already established in **`guided-clean.ts`** (cancellable, no raw **`console.log`** for primary UX).

- **D-03:** **Risk & warnings:** Surface **TOOL-04 class messaging** and **Audacity pipe-risk** copy **before** confirming execution — reuse **`pipelineWarnings`** / plan text from **`runCleanRequest`** **`dryRun: true`** preview so guided preview matches **`clean --dry-run`** for the same selections.

- **D-04:** **Argv equivalence:** Extend **`argvTokensForEquivalentClean`** so **`Equivalent command:`** replay tokens round-trip through **`parseCliRequest`** for combinations that include **`--preset speech-vocals-demucs`** (and other Phase 8-related flags the CLI already exposes). Add/adjust unit tests beside existing **`guided-clean-equivalent`** / **`command`** tests.

- **D-05:** **Batch:** No requirement to add guided multi-file batch in this phase; **parity** means **`batch`** remains flag-driven while guided stays single-file — audit closure is **guided ↔ clean**, not guided ↔ batch feature parity.

### Verification artifacts

- **D-06:** **`06-VERIFICATION.md`:** Structure aligned with **`03-VERIFICATION.md`** / **`08-VERIFICATION.md`** — roadmap success criteria table + **`REQUIREMENTS.md`** rows for **CLI-04**, **UX-01–UX-05**, each with **file pointers** and **test names**. Explicitly cite **`guided-clean`**, **`argvTokensForEquivalentClean`**, **`runGuidedCleanRequest`**, **`renderCleanPlanText`** equivalence path, and **new** optional-tool guided wiring once implemented.

- **D-07:** **`07-VERIFICATION.md`:** Cover **BATCH-01–BATCH-04** only in detail; **BATCH-05** row points to **Phase 13** evidence (**`runCliRequest`** default **`discoverTools`** for **`batch`**, **`maybeDoctorFacts`** tests) to avoid duplicate claims.

- **D-08:** Both verification files include a **goal-backward** section, **requirements table**, **`bun run verify`** spot-check row, and a short **CI vs real-machine** caveat consistent with **`08-VERIFICATION.md`** where heavy tools are referenced indirectly through guided parity.

### Claude's Discretion

- Exact **`@clack`** control types (**`multiselect`** vs **`confirm`** vs **`text`**) for Audacity macro string and LADSPA triple (**library**, **plugin**, **controls**).
- Ordering of optional prompts when multiple integrations apply (must remain deterministic and documented in PLAN).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit & roadmap

- `.planning/v1.0-MILESTONE-AUDIT.md` — Guided ↔ optional heavy parity gap (**CLI-04**, **UX-02**, integration **`guided → clean`**); verification orphans for Phase 6/7 REQ IDs.
- `.planning/ROADMAP.md` — Phase 14 goal, requirement list (**CLI-04**, **UX-*** , **BATCH-01–BATCH-04**).

### Requirements

- `.planning/REQUIREMENTS.md` — **CLI-04**, **UX-01–UX-05**, **BATCH-01–BATCH-04** acceptance lines and traceability.

### Prior phase contracts

- `.planning/phases/06-guided-repeatable-workflows/06-CONTEXT.md` — baseline guided scope; extend with Phase 8 parity (**D-03–D-06** Phase 6 original decisions).
- `.planning/phases/07-batch-processing-manifests/07-CONTEXT.md` — batch semantics; **BATCH-05** doctor snapshot delegated to Phase 13.
- `.planning/phases/08-optional-heavy-editor-integrations/08-CONTEXT.md` — optional tool behaviors and warnings to mirror in guided.
- `.planning/phases/13-milestone-gap-batch-manifest-doctor/13-CONTEXT.md` — **BATCH-05** closure — cite from **`07-VERIFICATION.md`** only.

### Verification templates / examples

- `.planning/phases/08-optional-heavy-editor-integrations/08-VERIFICATION.md` — table layout and evidence style for gap phases.
- `.planning/phases/03-video-preservation-fallback-control/03-VERIFICATION.md` — milestone-gap verification tone.

### Implementation touchpoints (scout)

- `src/app/guided-clean.ts` — guided orchestration.
- `src/domain/guided-clean-equivalent.ts` — argv equivalence (**extend**).
- `src/domain/cli-request.ts`, `src/cli/command.ts` — **`clean`** flags to mirror.
- `src/app/run-command.ts` — **`guided-clean`** → **`runCleanRequest`** deps.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`argvTokensForEquivalentClean`** (`src/domain/guided-clean-equivalent.ts`) — extend tokens for optional-heavy flags.
- **`runGuidedCleanRequest`** (`src/app/guided-clean.ts`) — preview uses **`runCleanRequest`** **`dryRun: true`**; inject **`collectSelections`** for tests.
- **`runCliRequest`** (`src/app/run-command.ts`) — **`clean`** already forwards **`acceptAudacityPipeRisk`**, **`maybeAudacityMacro`**, **`maybeLadspa`**.

### Established Patterns

- **CliRequest argv-only** / **parseCliRequest** round-trips (**`test/cli/command.test.ts`** or successor) — add guided equivalence cases matching **`clean`** optional flags.

### Integration Points

- **`CleanRunInput`** / **`GuidedCleanSelections`** domain types — extend together to avoid drift between guided and **`clean`**.

</code_context>

<specifics>
## Specific Ideas

- Prefer **one consolidated “Optional tools”** sub-flow after preset selection when preset **`speech-vocals-demucs`** or user-enabled Audacity/LADSPA toggles demand it — keeps baseline wizard short for **`speech-light`** users.

</specifics>

<deferred>
## Deferred Ideas

- Guided **multi-file** or **`batch`** wizard — explicitly deferred in Phase 7 context; remains out of scope.
- New optional integrations beyond Phase 8 (**TOOL-03–TOOL-08**) — separate roadmap/backlog items only.

</deferred>

---

_Phase: 14-milestone-gap-guided-batch-parity_
_Context gathered: 2026-05-02_
