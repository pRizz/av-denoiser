# Phase 08: gap-closure-phase-03-remux-pipeline-trust - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in **08-CONTEXT.md** — this log preserves the alternatives considered.

**Date:** 2026-05-04  
**Phase:** 08-gap-closure-phase-03-remux-pipeline-trust  
**Mode:** Yolo  
**Areas discussed:** 03-VERIFICATION scope, Intermediate pipeline filename, Matroska extension choice, REQUIREMENTS checkbox follow-up, Naming/test discretion

---

## 03-VERIFICATION scope

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal stub | Add **03-VERIFICATION.md** with prose only, weak evidence links |  |
| Full evidence table | Mirror **01-VERIFICATION.md**: frontmatter, tables, requirement IDs, file/test citations | ✓ |
| Defer doc | Fix code only; skip verification file |  |

**User's choice:** Full evidence table (yolo recommended default)  
**Notes:** Satisfies roadmap success criterion **1** and audit **missing Phase 03 verification**.

---

## Intermediate pipeline filename

| Option | Description | Selected |
|--------|-------------|----------|
| Keep **`.mp4`** | Document as intentional in **03-VERIFICATION** only |  |
| Derive from **encode-deliverable** | Shared helper matching **`encodeDeliverableArgs`** branches; **`clean.ts`** uses it | ✓ |
| Always **`.m4a`** / neutral | Single extension for all plans |  |

**User's choice:** Derive from encode-deliverable (yolo recommended default)  
**Notes:** Resolves **v1.1-MILESTONE-AUDIT** “intermediate **`.mp4`** while deliverable mux is WebM/Matroska” confusion; FFmpeg already uses correct **`-f`** — extension alignment is operator trust + consistency.

---

## Matroska intermediate extension

| Option | Description | Selected |
|--------|-------------|----------|
| **`.mka`** | Audio-only Matroska convention |  |
| **`.mkv`** | Align with **MULTI-02** default **`.mkv`** deliverable story | ✓ |

**User's choice:** `.mkv` (yolo recommended default)  
**Notes:** If integration tests fail on a platform, **03-VERIFICATION** may document **`.mka`** substitution — **Claude's discretion** during execute.

---

## REQUIREMENTS traceability

| Option | Description | Selected |
|--------|-------------|----------|
| Leave **REQUIREMENTS.md** unchanged | Verification file only |  |
| Flip **MULTI-06** / **MULTI-07** when **passed** | Same closure wave as Phase **08** execute | ✓ |

**User's choice:** Update checkboxes + traceability when verification passes (yolo recommended default)  
**Notes:** Matches Phases **06** / **07** gap-closure hygiene.

---

## Testing / helper visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Helper unit test only | Fast, direct branch coverage | ✓ (recommended) |
| Integration-only | Rely on **clean** E2E |  |
| No new tests | Doc-only phase |  |

**User's choice:** Prefer small unit test for filename helper; **Claude's discretion** if redundant with existing tests after implementation.

---

## Claude's Discretion

- Intermediate path **stem** retention vs rename for clarity.
- **`.mka`** fallback if **`.mkv`** intermediate causes FFmpeg edge cases in CI.

## Deferred Ideas

- Phase **09** output verification / **MULTI-08**–**MULTI-13** closure.
- Future **VP9→Matroska** matrix work (explicitly out of v1.1 per Phase **07**).
