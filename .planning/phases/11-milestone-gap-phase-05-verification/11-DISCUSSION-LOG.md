# Phase 11: milestone-gap-phase-05-verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in **11-CONTEXT.md** — this log preserves the alternatives considered.

**Date:** 2026-05-02  
**Phase:** 11 — Milestone Gap — Phase 5 verification  
**Mode:** Yolo  
**Areas discussed:** Verification placement & shape, SUMMARY requirements-completed hygiene, evidence bar, change policy

---

## Verification artifact location

| Option | Description | Selected |
|--------|-------------|----------|
| Co-locate with Phase 5 | `05-final-media-output-reporting/05-VERIFICATION.md` | ✓ |
| Phase 11 directory only | Easier for gap phases but breaks ROADMAP “Phase 5 verification” naming | |
| Single root `VERIFICATION-05.md` | Non-standard vs 03/04 | |

**User's choice:** Co-locate with Phase 5 (recommended default — matches Phase 9/10 pattern).  
**Notes:** `[auto] [Verification placement] — Q: "Where should 05-VERIFICATION live?" → Selected: "Co-locate with Phase 5" (recommended default)`

---

## Verification document structure

| Option | Description | Selected |
|--------|-------------|----------|
| Full parity with 03/04 | Goal table + REQ table + anti-patterns + `bun run verify` row + gaps | ✓ |
| REQ table only | Faster but weak audit story | |
| Freeform narrative | Harder for milestone gate | |

**User's choice:** Full parity with **03-VERIFICATION** / **04-VERIFICATION**.  
**Notes:** `[auto] [Structure] — Q: "How strict should the template be?" → Selected: "Full parity" (recommended default)`

---

## SUMMARY frontmatter (`requirements-completed`)

| Option | Description | Selected |
|--------|-------------|----------|
| Match each PLAN `requirements:` exactly | Restores audit hygiene per Phase 10 | ✓ |
| Single merged list on one SUMMARY | Loses per-plan traceability | |
| Defer to REQUIREMENTS.md only | Leaves SUMMARY gap open | |

**User's choice:** Match **05-0X-PLAN.md** `requirements:` on **05-0X-SUMMARY.md** respectively.  
**Notes:** `[auto] [SUMMARY hygiene] — Q: "How to restore requirements-completed?" → Selected: "Per-plan match" (recommended default)`

---

## Code change policy

| Option | Description | Selected |
|--------|-------------|----------|
| Docs-only unless regression | Same as **10-CONTEXT** | ✓ |
| Allow small refactors while verifying | Out of scope for gap phase | |
| Mandatory test additions | Only if verification proves a hole | |

**User's choice:** Documentation and summary hygiene only unless verification exposes a regression.  
**Notes:** `[auto] [Scope] — Q: "Allow src/ edits?" → Selected: "Docs-only unless regression" (recommended default)`

---

## Claude's Discretion

- Wording of evidence citations and optional extra frontmatter on **05-0X-SUMMARY.md** beyond **`requirements-completed`**.

## Deferred Ideas

- Bulk **REQUIREMENTS.md** traceability refresh—track during plan/execute if not covered by a single verification table update.
