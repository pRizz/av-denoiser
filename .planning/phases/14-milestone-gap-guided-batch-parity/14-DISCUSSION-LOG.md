# Phase 14: Milestone Gap — Guided optional-tool parity & Phase 6/7 verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 14-milestone-gap-guided-batch-parity
**Mode:** Yolo
**Areas discussed:** Guided optional-tool parity scope, Prompts & warnings vs dry-run preview, Argv equivalence & testing, Verification artifact split (06 vs 07)

---

## Guided optional-tool parity scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full `clean` flag parity for Demucs/Audacity/LADSPA in guided | Extend selections + prompts so guided can configure every optional-heavy path `clean` already supports | ✓ |
| Document-only parity | Claim parity in docs without guided prompts | |
| Partial parity (Demucs only) | Skip Audacity/LADSPA in wizard | |

**User's choice:** Full `clean` flag parity for Demucs/Audacity/LADSPA in guided (recommended default — closes **`v1.0-MILESTONE-AUDIT`** integration gap).
**Notes:** Yolo auto-select per **`discuss_areas`** recommendation-engine rule.

---

## Prompts, confirmations, and warnings

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse dry-run plan output | Let **`runCleanRequest`** **`dryRun: true`** carry TOOL-04 / pipe-risk messaging in **`renderCleanPlanText`**; add targeted confirms only where CLI requires explicit opt-in | ✓ |
| Duplicate warning strings only in guided | Separate copy from `clean` dry-run | |
| Minimal confirms | Single umbrella confirm before execute | |

**User's choice:** Reuse dry-run plan output + explicit opt-in prompts where **`clean`** requires acknowledgement (**Audacity pipe risk**, etc.).
**Notes:** Keeps **`CLI-04`** equivalence: same planning artifact drives UX.

---

## Argv equivalence & testing

| Option | Description | Selected |
|--------|-------------|----------|
| Extend `argvTokensForEquivalentClean` + parse round-trip tests | Matches Phase 6 **`D-06`** pattern for optional-heavy tokens | ✓ |
| Snapshot-only tests | Compare strings without **`parseCliRequest`** | |
| E2E-only | Manual verification | |

**User's choice:** Extend **`argvTokensForEquivalentClean`** + **`parseCliRequest`** round-trip coverage for optional-heavy combinations.
**Notes:** Aligns with **`06-CONTEXT`** **`D-05`–`D-06`**.

---

## Verification artifact responsibilities

| Option | Description | Selected |
|--------|-------------|----------|
| Split **`06-VERIFICATION.md`** / **`07-VERIFICATION.md`**; BATCH-05 cites Phase 13 | Phase 14 verifies CLI-04 + UX + BATCH-01–04; BATCH-05 evidence delegated | ✓ |
| Single merged verification doc | One file for phases 6+7 | |
| BATCH-05 reproved inside `07-VERIFICATION.md` | Duplicate Phase 13 evidence | |

**User's choice:** Split artifacts; **`07-VERIFICATION.md`** references Phase 13 for **BATCH-05**.
**Notes:** Avoids contradictory duplicate verification claims.

---

## Claude's Discretion

- **`@clack`** control selection for optional-tool fields.

## Deferred Ideas

- Guided batch / multi-select inputs — backlog (Phase 7 scope explicitly separate).
