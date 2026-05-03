# Phase 12: milestone-gap-phase-08-verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in **12-CONTEXT.md** — this log preserves the alternatives considered.

**Date:** 2026-05-02  
**Phase:** 12 — Milestone Gap — Phase 8 verification  
**Mode:** Yolo  
**Areas discussed:** Verification placement & shape, SUMMARY requirements-completed hygiene, docs vs targeted tests, real-machine scope honesty

---

## Verification artifact location

| Option | Description | Selected |
|--------|-------------|----------|
| Co-locate with Phase 8 | `08-optional-heavy-editor-integrations/08-VERIFICATION.md` | ✓ |
| Phase 12 directory only | Breaks parity with phases 9–11 and ROADMAP naming | |
| Repo root | Non-standard | |

**User's choice:** Co-locate with Phase 8 (matches gap-phase pattern).  
**Notes:** `[auto] [Verification placement] — Q: "Where should 08-VERIFICATION live?" → Selected: "Under 08-optional-heavy-editor-integrations" (recommended default)`

---

## Verification document structure

| Option | Description | Selected |
|--------|-------------|----------|
| Full parity (goal table + TOOL REQ table + anti-patterns + verify row + gaps) | Milestone gate strength | ✓ |
| REQ table only | Weak vs five ROADMAP success criteria | |
| Narrative only | Hard to audit | |

**User's choice:** Full parity with prior **`*-VERIFICATION.md`** gap artifacts.  
**Notes:** `[auto] [Structure] — Q: "Template strictness?" → Selected: "Full parity" (recommended default)`

---

## SUMMARY frontmatter (`requirements-completed`)

| Option | Description | Selected |
|--------|-------------|----------|
| Match each `08-0X-PLAN.md` `requirements:` exactly | Restores audit hygiene | ✓ |
| Omit frontmatter | Leaves milestone debt | |
| One merged list | Loses per-plan traceability | |

**User's choice:** Per-plan **`requirements-completed`** lists per **D-04** in context.  
**Notes:** `[auto] [SUMMARY hygiene] — Q: "How restore requirements-completed?" → Selected: "Match 08-01..04 PLANs" (recommended default)`

---

## Docs-only vs targeted tests (ROADMAP Phase 12)

| Option | Description | Selected |
|--------|-------------|----------|
| Documentation + verify only | Ignores ROADMAP “add or extend app-layer tests…” | |
| Documentation + optional minimal tests when audit thin-coverage applies | Aligns ROADMAP + **TOOL-03** audit note | ✓ |
| Broad integration suite with real optional tools in CI | Out of scope / brittle | |

**User's choice:** **`08-VERIFICATION.md`** + summaries always; **add or extend tests only** when verification shows a **concrete** gap vs shipped promises or audit “thin app-layer” wording — **mocked/deterministic**, no mandatory real Demucs/Audacity in CI.  
**Notes:** `[auto] [Change policy] — Q: "Allow src/ test edits?" → Selected: "Yes, narrowly per ROADMAP Phase 12 + audit" (recommended default)`

---

## Real-machine vs CI-evidence wording

| Option | Description | Selected |
|--------|-------------|----------|
| Verification prose distinguishes unit-test proof from residual real-machine risk | Honest gate + matches audit tech_debt | ✓ |
| Imply full optional-tool E2E is proven in CI | False confidence | |

**User's choice:** **`08-VERIFICATION.md`** includes a short **gaps / residual risk** stance referencing what tests do **not** cover (e.g. live Demucs/Audacity/LADSPA paths).  
**Notes:** `[auto] [Evidence scope] — Q: "Claim real-machine coverage?" → Selected: "No — separate CI vs manual" (recommended default)`

---

## Behavioral spot-check wording

| Option | Description | Selected |
|--------|-------------|----------|
| `bun run verify` + exit 0; no hard-coded test count | Stable across suite growth | ✓ |
| Pin numeric test count | Brittle | |

**User's choice:** Same convention as Phase **11** context (**D-08**).  
**Notes:** `[auto] [Behavioral verify] — Q: "Include fixed test count?" → Selected: "No" (recommended default)`

---

## Claude's Discretion

- Which specific tests to add under the thin-coverage exception.
- Exact citations in REQ table cells.

## Deferred Ideas

- Guided UX parity for optional-heavy presets (**Phase 14** / **UX-02**) — mention only if relevant to TOOL REQ wording.
