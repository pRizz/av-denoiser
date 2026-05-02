---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 06-2026-05-02T00-47-46
generated_at: 2026-05-02T01:00:00.000Z
---

# Phase 6: Guided & Repeatable Workflows - Context

**Gathered:** 2026-05-02
**Status:** Ready for execution (retroactive context aligned with Phase 6 plans)
**Mode:** Yolo

<domain>
## Phase Boundary

Phase 6 delivers **CLI-04** and **UX-01–UX-05**: a **guided** terminal workflow for **`clean`** using **`@clack/prompts`**, **dry-run preview** matching flag-driven **`clean --dry-run`**, **equivalent non-interactive argv** for copy/paste, **confirmed execute**, and **concise progress** during real runs — without changing batch (Phase 7) or optional integrations (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Entry and routing

- **D-01:** Add **`av-denoiser guided`** subcommand; **`CliRequest`** includes **`guided-clean`** dispatched to **`runGuidedCleanRequest`**.
- **D-02:** **TTY guard**: non-interactive stdin → **`failure`** **`planning-failure`** with message containing **`TTY`** (or **`interactive`**).

### Wizard content (UX-01, UX-02)

- **D-03:** Prompt for **input path**, optional **output path**, **preset** (`speech-light` | `speech-soft-sox`), **noise strength** 0–1, **`force`**, **`allow-video-fallback`** — map to **`GuidedCleanSelections`** / **`CleanRunInput`**.

### Preview and equivalence (UX-03, UX-04, CLI-04)

- **D-04:** After prompts, run **`runCleanRequest`** with **`dryRun: true`**, **`json: false`** — same **`CleanCliSuccess`** / **`renderCleanPlanText`** path as **`clean --dry-run`**.
- **D-05:** Show **`Equivalent command:`** line from **`argvTokensForEquivalentClean`** (replay uses **`dryRun: false`** in argv).
- **D-06:** Pure-domain **`argvTokensForEquivalentClean`** in **`guided-clean-equivalent.ts`** with unit tests; round-trip **`parseCliRequest`** covered in **`test/cli/command.test.ts`**.

### Execute and feedback (UX-05)

- **D-07:** Confirm before **`dryRun: false`**; cancel → **`success`** with **cancel** messaging in **`guidedHumanSummary`** / render path.
- **D-08:** **`CleanDeps.reportProgress`** optional hook (labels: **`probe`**, **`step:N`**, **`verify`**) drives **`@clack/spinner`** during real guided clean only.

### Rendering

- **D-09:** **`CliCommandOutcome.guidedHumanSummary`** holds full transcript; **`renderCommandOutcome`** handles **`guided-clean`** — **no** **`console.log`** in **`guided-clean.ts`** for user-facing output.

### Claude's Discretion

- Exact **`@clack`** control flow ( **`text` vs `select`**) and spinner copy — keep accessible and cancellable (`isCancel`).

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 6 goal and success criteria.
- `.planning/REQUIREMENTS.md` — **CLI-04**, **UX-01–UX-05**.
- `.planning/phases/06-guided-repeatable-workflows/06-RESEARCH.md`
- `.planning/phases/05-final-media-output-reporting/05-CONTEXT.md` — clean/report contracts.

</canonical_refs>

<code_context>
## Existing Code Insights

- `src/cli/command.ts`, `src/cli/main.ts` — Commander wiring.
- `src/app/clean.ts` — **`runCleanRequest`**, **`CleanDeps`**.
- `src/cli/render.ts` — **`renderCleanPlanText`**, outcomes.

</code_context>

<specifics>
## Specific Ideas

- Default guidance line: **`Run "av-denoiser guided"`** for discoverability.

</specifics>

<deferred>
## Deferred Ideas

- Guided flows for **`inspect`** / **`doctor`** — out of Phase 6 scope unless roadmap extends.

</deferred>

---
*Phase: 06-guided-repeatable-workflows*
