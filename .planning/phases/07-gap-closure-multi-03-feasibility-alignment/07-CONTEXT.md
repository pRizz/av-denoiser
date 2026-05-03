---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 07-2026-05-03T18-21-48Z
generated_at: "2026-05-03T18:21:48.004Z"
---

# Phase 07: Gap closure — MULTI-03 feasibility vs requirements — Context

**Gathered:** 2026-05-03  
**Status:** Ready for planning  
**Mode:** Yolo

<domain>

## Phase boundary

Close the **audit “unsatisfied” gap** on **MULTI-03**: **REQUIREMENTS.md** currently allows **VP9** **`video-copy-safe`** for **WebM and/or Matroska**, while **`planVideoStreamCopyFeasibility`** ships **VP9 → WebM only** with **`video-copy-vp9-webm-v1`**, and **Phase 02** explicitly documented a **deferred VP9+Matroska** row (**`02-VERIFICATION.md`**, comment in **`stream-copy-feasibility.ts`**). This phase **must** end with **no silent optimism** — requirement text, verification evidence, and code **mutually consistent**.

**Out of scope:** General matrix expansion beyond **MULTI-03** closure (e.g. **MULTI-06**/**07** filename/mux trust stays **Phase 08**).

</domain>

<decisions>

## Implementation decisions

### Alignment strategy (docs-first, matches shipped matrix)

- **D-01:** **Primary closure path — narrow requirements and traceability** so **MULTI-03** describes the **implemented** pairing: **lone VP9 + eligible audio → `video-copy-safe`** with **`plannedContainer: "webm"`** and **`video-copy-vp9-webm-v1`**. Remove **“and/or Matroska”** from **MULTI-03** unless the project simultaneously implements a **`video-copy-vp9-matroska-v1`** row (alternate path below).
- **D-02:** **Rationale:** **Phase 02** context (**D-03** / **D-04**) already treated **Matroska+VP9** as **optional** and accepted **WebM-only** unlock for **MULTI-03** (“at least one pairing”). Closing the audit by **documenting shipped truth** is **lower risk** than adding a second container row **without** a product driver.

### Alternate path (only if PLAN rejects docs-only closure)

- **D-03:** If stakeholders **require** VP9 stream-copy into **Matroska**, PLAN must **implement** **`video-copy-vp9-matroska-v1`** (or agreed token), **`plannedContainer: "matroska"`** branch in **`planVideoStreamCopyFeasibility`**, prelude **planned audio codec** aligned with **Phase 03** policy (**AAC** baseline for Matroska copy-safe mirror **Theora** path), **fixtures + tests**, and **then** widen **MULTI-03** text to cover **both** pairings explicitly. **Do not** leave **“and/or”** language without **both** behaviors tested.

### Verification & evidence

- **D-04:** Add a **short addendum subsection** to **`.planning/phases/02-feasibility-matrix-vp9-theora-extras/02-VERIFICATION.md`** (or a **linked `02-VERIFICATION-P07-ADDENDUM.md`** only if PLAN prefers isolation) stating that **MULTI-03** v1.1 scope is **VP9→WebM** copy-safe **per code + tests**, and that **VP9→Matroska** remains **deferred / out of stated requirement** after closure — so **Phase 02** tables stay the **engineering evidence**, **Phase 07** the **requirements reconciliation**.
- **D-05:** After closure, **`.planning/REQUIREMENTS.md`** traceability row for **MULTI-03** reads **Complete** (Phase **07** gap closure), consistent with **`bun run verify`** green.

### Code change policy

- **D-06:** **Default: documentation + verification addendum + REQUIREMENTS/traceability updates only.** **No code change** when following **D-01**. Code changes required **only** if **D-03** (Matroska implementation) wins in planning.

### Audit follow-up

- **D-07:** When work merges, **`v1.1-MILESTONE-AUDIT.md`** should be **updated or superseded** so **MULTI-03** is no longer **`unsatisfied`** for the **“REQ vs implementation”** integration gap (PLAN chooses exact wording — e.g. **satisfied** with note “docs aligned to WebM-only” vs **partial** until full milestone re-audit).

### Claude's discretion

- **D-08:** Prefer **single PLAN** (**docs-first**) over splitting unless **D-03** triggers a **research spike** on **FFmpeg Matroska+VP9** remux quirks.

### Folded todos

None (**`todo match-phase 07`** returned no matches).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / audit

- `.planning/v1.1-MILESTONE-AUDIT.md` — **MULTI-03** **`unsatisfied`**: REQ **WebM and/or Matroska** vs code **WebM-only**.
- `.planning/ROADMAP.md` — **Phase 07** goal and success criteria.
- `.planning/REQUIREMENTS.md` — **MULTI-03** wording and § Traceability table.

### Prior phase locks

- `.planning/phases/02-feasibility-matrix-vp9-theora-extras/02-CONTEXT.md` — **D-03** / **D-04** (**WebM primary**, **Matroska VP9 optional / defer**).
- `.planning/phases/06-gap-closure-phase-01-verification-multi-01-02/06-CONTEXT.md` — **MULTI-03** deferred to **Phase 07** boundary statement.

### Shipped feasibility + prelude

- `src/domain/stream-copy-feasibility.ts` — **`planVideoStreamCopyFeasibility`**, VP9 branch, deferred **Matroska** comment block.
- `src/domain/output-plan.ts` — **`planMediaOutputPrelude`**, **WebM → Opus** branch comment (**Phase 02** / **MULTI-03**).

### Verification template

- `.planning/phases/02-feasibility-matrix-vp9-theora-extras/02-VERIFICATION.md` — Phase **02** evidence tables; **`MULTI-03`** / deferred **VP9+Matroska** row row.

### Surfaces

- `src/domain/inspect-summary.ts` — VP9 / WebM preservation notes.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable assets

- **`planVideoStreamCopyFeasibility`** — single funnel for **`plannedContainer`** + **`reasonCodes`**; VP9 today returns **`webm`** + **`video-copy-vp9-webm-v1`** only.

### Established patterns

- **`planMediaOutputPrelude`** maps **copy-safe WebM → planned Opus**, other copy-safe branches default **AAC** until mux policy dictates otherwise (**Theora → Matroska + AAC** in place).

### Integration points

- Any new **VP9+Matroska** row must reconcile with **`plannedAudioCodec`**, **`buildRemuxVideoWithProcessedAudioCommand`**, **inspect** notes, and **domain tests** (**`stream-copy-feasibility.test.ts`**, **`output-plan.test.ts`**).

### Creative options enabled by architecture

- **Docs-only closure** aligns **REQUIREMENTS** with **typed matrix** without touching argv builders — **recommended** default for this gap phase.

</code_context>

<specifics>

## Specific Ideas

- None — Phase **06** deliberately left **MULTI-03** to **Phase 07**; no new product UX beyond feasibility truthfulness.

</specifics>

<deferred>

## Deferred Ideas

- **Implement `video-copy-vp9-matroska-v1`** — backlog / future milestone if operators need **MKV-native VP9** remux parity with **Theora**. Not part of **D-01** docs-first closure.

### Reviewed todos (not folded)

- None.

**None otherwise** — discussion stayed within Phase **07** boundary.

</deferred>

---

*Phase: 07-gap-closure-multi-03-feasibility-alignment*  
*Context gathered: 2026-05-03*
