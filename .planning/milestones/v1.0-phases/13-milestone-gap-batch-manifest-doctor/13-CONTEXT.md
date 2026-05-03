---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 13-2026-05-02T12-13-43
generated_at: 2026-05-02T12:13:43.000Z
---

# Phase 13: Milestone Gap — Batch manifest doctor snapshot - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning
**Mode:** Yolo

<domain>
## Phase Boundary

Close the v1.0 milestone audit gap for **BATCH-05**: the default **`batch`** CLI path must persist a **doctor/discovery snapshot** into **`manifest.maybeDoctorFacts`**, reusing the same discovery pathway as **`doctor`** / injectable **`deps.discoverTools`**, without changing Phase 7’s batch orchestration semantics for **explicit test doubles**. Regression coverage must guard **BATCH-05** and keep **BATCH-01–BATCH-04** behavior intact (manifest completeness, fail-fast, concurrency, collision-safe outputs).

</domain>

<decisions>
## Implementation Decisions

### Wiring default discovery (production CLI)

- **D-01:** Resolve **`discoverTools`** for **`batch`** at the **`runCliRequest`** boundary exactly like **`doctor`**: pass **`deps.discoverTools ?? createDoctorReport`** into **`runBatchRequest`**’s orchestrator deps so the **default invoked CLI** always runs one discovery pass before building the manifest. Do **not** change **`runBatchRequest`** to implicitly call **`createDoctorReport`** when **`discoverTools`** is omitted — callers that omit it (unit tests, future embedded callers) keep **hermetic** manifests with **`maybeDoctorFacts: null`** unless they inject discovery.

### Snapshot shape & audit intent

- **D-02:** Persist the full **`DoctorReport`** (or its JSON-serializable payload as today’s pipeline already treats **`unknown`**) returned by **`discoverTools`** — same facts users would see from **`doctor`**, satisfying **“tool versions, planned commands context, capability snapshot”** intent in **BATCH-05** without inventing a trimmed alternate schema.

### Discovery failures

- **D-03:** If **`discoverTools`** **throws** or rejects, treat it as a **batch-level failure** **before** per-file **`runClean`** work (clear error outcome; avoid writing a misleading manifest that omits doctor facts while implying a complete audit trail). Align messaging with existing invalid-input / failure rendering patterns used elsewhere in the CLI shell.

### Verification & regressions

- **D-04:** Add tests at the **`runCliRequest`** / **`batch`** integration seam (or equivalent **CLI-oriented** test) that asserts **`maybeDoctorFacts`** is **non-null** when the default **`deps`** are used and **`discoverTools`** is **not** overridden — typically by injecting a **stub** **`discoverTools`** in tests if real discovery is undesirable, and separately documenting that **production default** passes **`createDoctorReport`**. Extend or add assertions so **`BATCH-01–BATCH-04`** regressions remain covered (existing **`runBatchRequest`** tests stay valid with **`maybeDoctorFacts: null`**).

### Claude's Discretion

- Exact placement of try/catch around discovery vs inside **`runBatchRequest`**; manifest write ordering relative to discovery failure — planner chooses minimal diff consistent with **D-03**.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit & roadmap

- `.planning/v1.0-MILESTONE-AUDIT.md` — **BATCH-05** partial gap (`batch → manifest.maybeDoctorFacts`, default CLI omits **`discoverTools`**).
- `.planning/ROADMAP.md` — Phase 13 goal, **BATCH-05** gap closure wording.

### Requirements & prior phase contracts

- `.planning/REQUIREMENTS.md` — **BATCH-05** acceptance line and traceability.
- `.planning/phases/07-batch-processing-manifests/07-CONTEXT.md` — **D-10**, manifest audit intent; **`maybeDoctorFacts`** via **`deps.discoverTools`** when defined.
- `.planning/phases/07-batch-processing-manifests/07-03-PLAN.md` — **`runBatchRequest`** checklist item: **`maybeDoctorFacts`** from **`deps.discoverTools`** once when defined.

### Implementation touchpoints

- `src/app/run-command.ts` — **`batch`** branch wiring (**no default **`discoverTools`** today**).
- `src/app/batch.ts` — **`runBatchRequest`** discovery gate and manifest assembly.
- `src/app/doctor.ts` / `src/adapters/tool-discovery.ts` — **`createDoctorReport`** / **`discoverTools`**.
- `test/app/batch.test.ts` — direct **`runBatchRequest`** calls (expect **null** facts without injection).
- `test/cli/main.test.ts` (or sibling) — suitable home for **default-path** **`runCliRequest`** batch + doctor snapshot assertion.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`runCliRequest`** pattern for **`doctor`**: **`(deps.discoverTools ?? createDoctorReport)()`** — mirror for **`batch`** when building **`BatchOrchestratorDeps`**.
- **`runBatchRequest`** already invokes **`deps.discoverTools`** once and assigns **`maybeDoctorFacts`** when the function is provided (**`src/app/batch.ts`**).
- **`createDoctorReport`** (**`src/app/doctor.ts`**) — production-grade default discovery aligned with **`doctor`** command.

### Established Patterns

- **Dependency injection** at the app shell: **`CliRequestDeps`** exposes optional **`discoverTools`** for tests and embedding; production **`main`** uses defaults.
- **Manifest draft** via **`emptyBatchManifestDraft`** + per-item mutation; doctor facts belong at document root as today.

### Integration Points

- **`case "batch"`** in **`runCliRequest`** must pass through **`discoverTools` default** alongside existing **`deps.clean`** / **`deps.batch`** passthrough.

</code_context>

<specifics>
## Specific Ideas

No user-specific references — align with milestone audit remediation and Phase 7 manifest/doctor contract.

</specifics>

<deferred>
## Deferred Ideas

- **`--skip-doctor-snapshot`** (or similar) for faster batch runs — **new product surface**; not in Phase 13 scope unless raised in a later phase.

### Reviewed Todos (not folded)

- None — **`todo match-phase 13`** returned no matches.

</deferred>

---
*Phase: 13-milestone-gap-batch-manifest-doctor*
*Context gathered: 2026-05-02*
