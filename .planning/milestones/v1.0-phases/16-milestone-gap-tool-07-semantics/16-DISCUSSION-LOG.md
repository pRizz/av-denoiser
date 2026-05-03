# Phase 16: Milestone Gap — TOOL-07 semantics & verification — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in **CONTEXT.md** — this log preserves the alternatives considered.

**Date:** 2026-05-03T13:55:45.000Z
**Phase:** 16-milestone-gap-tool-07-semantics
**Mode:** Yolo
**Areas discussed:** REQ wording strictness, Future melt bridge, Verification artifact placement, Audit narrative depth

---

## REQ wording strictness (**TOOL-07**)

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal legal line | One sentence; max deferral to **TOOL-08** |  |
| Explanatory (matches shipped) | Names **ladspa** triple + **doctor `melt`** + **without orchestrating melt** | ✓ |
| Expand v2 feature list | Broader Kdenlive UX promises |  |

**User's choice:** **Explanatory (recommended default)** — aligns checklist with **FFmpeg `ladspa`** implementation and audit closure.
**Notes:** Yolo auto-select per recommendation engine.

---

## Future **melt** / MLT bridge

| Option | Description | Selected |
|--------|-------------|----------|
| Defer explicitly | Roadmap backlog / future phase only | ✓ |
| Spike in Phase 16 | Out of scope — phase already executed |  |
| Doc-only “maybe later” | Weaker than explicit defer |  |

**User's choice:** **Defer explicitly** (recommended).
**Notes:** Matches **STACK** FFmpeg-first and prior **08-CONTEXT** **D-11**.

---

## Verification evidence placement

| Option | Description | Selected |
|--------|-------------|----------|
| Update **08-VERIFICATION** only | Single canonical Phase **8** artifact | ✓ |
| Add **16-VERIFICATION.md** | Extra file for gap dir scanners |  |
| Both | Risk duplicate narrative |  |

**User's choice:** **08-VERIFICATION** only (recommended) — phase **12** already established **`08-VERIFICATION.md`** as authority.

---

## Audit file change depth

| Option | Description | Selected |
|--------|-------------|----------|
| Appendix + strikethrough next steps | Low churn, human-readable closure | ✓ |
| Rewrite YAML `gaps.*` | Higher risk to audit tooling |  |
| No audit touch | Leaves **Residual** stale |  |

**User's choice:** **Appendix + strikethrough** (recommended).

---

## Claude's Discretion

- Table formatting and cross-link phrasing in **CONTEXT** `<canonical_refs>` where paths stay repo-relative.

## Deferred Ideas

- Opt-in **headless `melt`** audio/render bridge — future phase.
- Deeper **LADSPA** distro matrix / real-machine **E2E** — existing **08-VERIFICATION** “CI vs real machine” caveat remains.
