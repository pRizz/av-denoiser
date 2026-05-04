# Phase 09: gap-closure-output-verify-trust - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in **09-CONTEXT.md** — this log preserves alternatives considered.

**Date:** 2026-05-04  
**Phase:** 09-gap-closure-output-verify-trust  
**Mode:** Yolo  
**Areas discussed:** Verification doc placement, verifyCleanOutput fallback codec truthfulness, tests/fixtures, MULTI-08/09 evidence scope, MULTI-11 fixture inventory

---

## Verification artifact placement & shape

| Option | Description | Selected |
|--------|-------------|----------|
| Single combined VERIFICATION in Phase 09 folder only | One doc referencing both Phase 04 and 05 code | |
| Per-phase VERIFICATION next to delivered phases | **04-VERIFICATION.md** and **05-VERIFICATION.md** beside their artifacts (mirror **03**) | ✓ |
| REQUIREMENTS-only checkbox updates | No standalone verification files | |

**User's choice:** Per-phase **`*-VERIFICATION.md`** mirroring **03-VERIFICATION.md**.  
**Notes:** Matches roadmap **Artifacts** expectation and audit “orphaned requirement” framing.

---

## Fallback / re-encode video codec checks

| Option | Description | Selected |
|--------|-------------|----------|
| Leave verify copy-only | Only **`video-copy-safe`** + **`claimedVideoCopied`** checks codec | |
| Assert output matches input always | Would wrongly fail legitimate re-encode | |
| Assert output matches planned canonical codec for fallback path | **HEVC**/synonyms when **MULTI-13** path applies; uses **`canonicalVideoCodecForVerify`** | ✓ |

**User's choice:** Planned-canonical output codec assertion for fallback/re-encode outcomes.  
**Notes:** Aligns with **MULTI-10** / **MULTI-13** and **`v1.1-MILESTONE-AUDIT.md`** partial-on-**MULTI-10**.

---

## Test depth

| Option | Description | Selected |
|--------|-------------|----------|
| Large integration-only suite | Full FFmpeg matrix per container | |
| Unit-first with probe stubs | Fast regression on **`verifyCleanOutput`** branches | ✓ |
| Documentation-only | No code changes | |

**User's choice:** Unit-first with existing synthetic probe patterns; integration only if already conventional.

---

## MULTI-08 / MULTI-09 closure style

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence-only closure | Trace inspect/JSON/report modules in VERIFICATION tables | ✓ |
| Expand CLI messaging | New user-facing copy beyond requirements | |

**User's choice:** Evidence rows + traceability — avoid scope creep.

---

## MULTI-11 fixtures

| Option | Description | Selected |
|--------|-------------|----------|
| Mandatory new fixtures in Phase 09 | Always add VP9/Ogg-ish stubs | |
| Inventory-driven | Cite Phase **04** fixtures; add only if gap found during execution | ✓ |

**User's choice:** Inventory-driven minimal additions.

---

## Claude's Discretion

- Parameter naming / helper decomposition for **`CleanVerifyParams`** extensions.

## Deferred Ideas

None recorded.
