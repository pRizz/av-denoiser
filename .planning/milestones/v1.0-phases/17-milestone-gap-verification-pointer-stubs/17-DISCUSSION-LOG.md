# Phase 17: Milestone Gap — Verification pointer stubs — Discussion Log

> **Audit trail only.** Decisions live in **`17-CONTEXT.md`**.

**Date:** 2026-05-03T13:58:40.000Z
**Phase:** 17-milestone-gap-verification-pointer-stubs
**Mode:** Yolo
**Areas discussed:** Stub naming, Canonical target per gap dir, Gap 14 dual links, Frontmatter richness, Relative vs absolute URLs

---

## Stub filename convention

| Option | Description | Selected |
|--------|-------------|----------|
| **`NN-VERIFICATION.md`** | Matches gap phase id; greppable pattern | ✓ |
| **`VERIFICATION-Pointers.md`** | Single shared name in every dir |  |
| **`README.md`** | Idiomatic but collides with other README uses |  |

**User's choice:** **`NN-VERIFICATION.md`** (recommended default).

---

## Canonical mapping (09–14)

| Option | Description | Selected |
|--------|-------------|----------|
| One-to-one to retrofitted feature phase | 09→03, 10→04, 11→05, 12→08, 13→07, 14→06+07 | ✓ |
| Always link all 03–08 | Noisy, wrong for scanners |  |
| Link only ROADMAP | Loses deep tables |  |

**User's choice:** **One-to-one (+ dual for 14)**.

---

## Gap **14** shape

| Option | Description | Selected |
|--------|-------------|----------|
| One stub, two prominent links | Matches split **06**/**07** verification | ✓ |
| Two tiny files | Extra files without roadmap ask |  |
| Link **07** only | Under-represents guided **06** work |  |

**User's choice:** **One stub, two links**.

---

## Frontmatter

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal `stub: true` | Honest “not a full verification” | ✓ |
| Clone feature `verified: passed` | Misleading duplicate |  |

**User's choice:** **Minimal** (recommended).

---

## Claude's Discretion

- Heading text and optional ascii table summarizing mapping — cosmetic.

## Deferred Ideas

- Auto-generated symlink farms or CI link-check of every bullet — optional hardening phases.
