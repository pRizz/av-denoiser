---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 01-2026-05-03T15-39-17
generated_at: 2026-05-03T15:39:17.128Z
---

# Phase 01: Multi-container output model & path derivation - Context

**Gathered:** 2026-05-03  
**Status:** Ready for planning  
**Mode:** Yolo

<domain>

## Phase Boundary

Introduce typed **planned output container** surfaced through **`planMediaOutput`** (**MULTI-01**) and deterministic **basename / extension derivation** (**MULTI-02**) so defaults can end in **`.mp4`**, **`.mkv`**, or **`.webm`** when the plan says so - **without** expanding **`evaluateStreamCopyFeasibility`** beyond the current MP4 row (still **`fallback-required`** for non-MP4 video until Phase **02**). Clarify **`reasonCodes`** naming so later matrix work uses stable **`<role>-<container>-<codec?>-<variant>`** tokens.

Orchestration order today resolves **implicit** default paths **before** **`planMediaOutput`**, preserving the **input** extension only; Phase **01** must align path derivation with **`plannedContainer`** for the default-output branch.

</domain>

<decisions>

## Implementation Decisions

### Planned container type

- **D-01:** Extend **`PlannedContainer`** to **`"mp4" \| "matroska" \| "webm" \| "wav"`** - add **`webm`**; **`wav` stays** for the existing **`pcm_s16le` + WAV** deliverable FFmpeg path (**`audio-pipeline-argv`**) until a dedicated deliverable-vs-mux split is justified in a later milestone.
- **D-02:** **Video-bearing** plans keep **`plannedContainer: "mp4"`** for all probes in this phase (**same modality / reasonCodes / behavior as shipped**); non-MP4 containers appear in **tests and internal helpers** proving extension mapping, matching roadmap “don’t widen feasibility yet.”

### Path derivation (`resolveOutputPath` / `.avdn.*`)

- **D-03:** For **implicit default output** (**no `--output`** / no explicit path), **`resolvedOutputPath` must use extension derived from `plannedContainer`** once that value is chosen (collision-safe **`avdn`** segment unchanged - only the **suffix extension** reflects the plan): **`.mp4`**, **`.mkv`**, **`.webm`**, **`.wav`** as appropriate (**`.m4a` / `.aac` / `.ogg`**, etc.: keep preserving **non-Mux deliverable** input extensions where **`plannedContainer`** is still **mp4**/audio semantics - document exact table in PLAN when implementing; default rule: **`mp4`** container ⇒ **`.mp4`** default even from **`.mov`** inputs for **video**, matching current user expectation of MP4-ish default).
- **D-04:** **Explicit `-o`** remains **caller-chosen** path; **`resolveOutputPath` does not override** extension when `maybeExplicitOutput` is set (**MULTI-02** basename rules still apply - user owns extension mismatch risk; **`inspect`/warn** remains Phase **04** polish if needed).

### Feasibility vs planning

- **`evaluateStreamCopyFeasibility`:** **Phase 01** merely **consumes** the updated enum; **`plannedContainer !== "mp4"`** for real video probes still yields existing **`video-fallback-non-mp4-output-not-supported-for-video-v1`** (**or successor token** renamed in PLAN if we normalize wording - **don't change semantics**).
- **D-05:** **`planMediaOutput`** (and any small **pre-plan** helper) is the **single source of truth** for **`plannedContainer`** passed into path derivation for implicit defaults (**clean**/**inspect**/batch defaults follow the same rule).

### Reason-code taxonomy (draft for Phase 02+ matrix)

- **D-06:** New / future video matrix rows SHOULD use **`video-copy-<codec>-<container>-v<n>`** for success (**example:** **`video-copy-vp9-webm-v1`**); MP4 successes **stay** **`video-copy-h264-mp4-v1`** (and siblings) unless a PLAN documents a deliberate rename (**regression MULTI-12** forbids silent renames).
- **D-07:** **Fallback/disallow** gates keep **`video-fallback-*`** or **`unsupported-*`** prefixes already in use; when a gate is **container-specific**, encode container in slug (**e.g. `video-fallback-vp9-mp4-disallowed-v1`** in Phase **02**) - Phase **01** only documents this convention in code comment + PLAN, no matrix rows yet.

### Claude's Discretion

- Exact **stem when input is `.mov` / `.mkv`** and **`plannedContainer` is `mp4`**: planner may choose **`.mp4`** default extension vs **preserve original extension** - **bias to `.mp4`** for **`plannedContainer mp4`** (matches **MULTI-02** alignment with plan, not naive extension copy).

### Folded Todos

None (**`todo match-phase`** returned **0** matches).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope

- `.planning/ROADMAP.md` - **Phase 01** goal, success criteria, depends / requirements (**MULTI-01**, **MULTI-02**).
- `.planning/REQUIREMENTS.md` - **MULTI-01**, **MULTI-02**, traceability table, **out-of-scope** / defer table.
- `.planning/PROJECT.md` - **v1.1** milestone narrative, video integrity principles.

### Shipped planner / feasibility (implement against)

- `src/domain/output-plan.ts` - **`PlannedContainer`**, **`planMediaOutput`**, current **`mp4`** default.
- `src/domain/output-path.ts` - **`resolveOutputPath`**, **`defaultOutputPathBesideInput`**, **`DEFAULT_OUTPUT_SUFFIX_SEGMENT`** (**`avdn`**).
- `src/domain/stream-copy-feasibility.ts` - **MP4-only** video copy row; non-MP4 branch.
- `src/app/inspect.ts` - order of **path** then **plan** (integration touchpoint).
- `src/app/clean.ts` - same pattern for **clean** default output (integration touchpoint).
- `src/domain/batch-output-path.ts` - batch path allocation must inherit **plannedContainer** derivation policy.

### Prior phase intent (frozen v1 - context only)

- `.planning/milestones/v1.0-phases/02-media-probing-output-planning/02-CONTEXT.md` - original **`PlannedContainer`** / **`D-09`** defaults narrative (**wav** rationale).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`planMediaOutput`**: central place to set **`plannedContainer`** and modality; Phase **01** extends types and callers that depend on **`OutputPlan`** (**`inspect-summary`**, **argv** builders).

### Established Patterns

- **Suffix**: **`${stem}.${"avdn"}${ext}`** in **`output-path.ts`** - keep collision-safe pattern; Phase **01** adjusts **which `ext`** is paired with **`plannedContainer`** when defaulting next to input.
- **Functional core**: keep container + path rules **pure** (domain module), **`Bun.spawn` off** - unchanged shell vs core split.

### Integration Points

- **`runInspectRequest` / `runCleanRequest`** (and **`allocateBatchOutputPaths`**): reorder or thread **planned extension** - path resolution for implicit outputs must occur **after** or **during** planning when **`plannedContainer`** is locked for that branch (**ARCHITECTURAL** Phase **01** deliverable).

</code_context>

<specifics>

## Specific Ideas

No user interaction in yolo mode - recommendations favor **minimal behavior change** for live **`video-copy-safe` / `fallback-required`** paths, **typed WebM** addition, and **honest reorder** of implicit default path derivation vs **`planMediaOutput`**.

</specifics>

<deferred>

## Deferred Ideas

- **Separate type** **`PlannedMuxContainer`** (**mp4**|matroska|webm) vs **`wav` deliverable** - optional refactor if enums become confusing (**post-Phase 03** consideration).
- **User-selectable `--output-container`** (**FUT-01**) - backlog only.

### Reviewed Todos (not folded)

None.

**None - discussion stayed within phase scope.**

</deferred>

---

_Phase: 01-multi-container-output-model-path-derivation_  
_Context gathered: 2026-05-03_
