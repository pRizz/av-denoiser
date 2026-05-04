---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 09-2026-05-04T11-21-22
generated_at: 2026-05-04T11:21:22.382Z
---

# Phase 09: gap-closure-output-verify-trust - Context

**Gathered:** 2026-05-04  
**Status:** Ready for planning  
**Mode:** Yolo

<domain>
## Phase Boundary

Close the milestone audit gap for **MULTI-08**–**MULTI-13** by adding **Phase 04** and **Phase 05** verification artifacts (**`*-VERIFICATION.md`**), and by extending **`verifyCleanOutput`** (or a thin successor) so **fallback / video re-encode** outputs assert **canonical video codec** truthfulness — not only the **`video-copy-safe`** + **`claimedVideoCopied`** branch. **`bun run verify`** must stay green.

Scope does **not** widen container/matrix behavior beyond documenting evidence and tightening verification alignment with existing **`inspect`** / run-report contracts.

</domain>

<decisions>
## Implementation Decisions

### Verification documents

- **D-01:** Add **`04-VERIFICATION.md`** under `.planning/phases/04-ux-verification-fixtures-regression/` and **`05-VERIFICATION.md`** under `.planning/phases/05-x265-preferred-video-reencode/`, structured like **`03-VERIFICATION.md`**: YAML frontmatter (**`status`**, **`phase`**, **`generated_at`**), **`bun run verify`** baseline note, **must-have ↔ evidence** tables, mapped requirement IDs (**MULTI-08**–**MULTI-12** vs **MULTI-13** split by phase folder).

### Post-run verification (`verifyCleanOutput`)

- **D-02:** Extend verification so **`plannedModality === "fallback-required"`** paths that produced **re-encoded video** check output **`codec_name`** against the **planned / advertised** canonical codec ( **`canonicalVideoCodecForVerify`** ), principally **HEVC** (**`h265`** / **`hevc`** synonyms per Phase **05**), matching **`inspect`** / JSON honesty (**MULTI-10**, **MULTI-13**). Do **not** require output codec to match **input** when re-encode was intended — mismatch-with-input is valid when fallback fired.

- **D-03:** Thread **expected canonical codec** from the executable plan / clean success metadata already surfaced to **`finalizeCleanSuccess`** (avoid duplicate probing logic — single source of truth from planning argv or modality outcome). If an edge case has ambiguous codec expectation, fail closed with a clear **`processing-failure`** / verify reason rather than skipping checks (**MULTI-09** acknowledgment semantics stay unchanged; verification reflects actual FFmpeg outcome).

### Tests & fixtures

- **D-04:** Prefer **unit-level** **`verifyCleanOutput`** tests with **synthetic `MediaProbe` stubs** (existing harness style) for fallback + **HEVC** expectations; keep costly integration minimal unless already patterned in **`clean`** tests.

- **D-05:** **MULTI-11**: Verification docs cite existing **Ffprobe-style fixtures** from Phase **04** where they satisfy acceptance; add fixtures **only** if an inventory during execution proves a referenced scenario lacks locked coverage.

### Inspect / JSON scope (**MULTI-08**, **MULTI-09**)

- **D-06:** Treat **MULTI-08**/**MULTI-09** closure primarily as **evidence rows + checklist/traceability updates** in **REQUIREMENTS.md** tied to **`inspect`** / **`CleanRunReport`** / **`--json`** modules — no speculative UX expansion beyond roadmap wording.

### Claude's Discretion

- Exact **`CleanVerifyParams`** field naming and whether auxiliary helpers split **`fallback-required`** “copied vs re-encoded” subcases.
- Wording inside verification Markdown tables (verbosity).
- Minor fixture naming if new JSON stubs are required.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase intent & audit

- `.planning/ROADMAP.md` — Phase **09** goal, success criteria, artifact folder.
- `.planning/v1.1-MILESTONE-AUDIT.md` — **MULTI-08**–**MULTI-13** gap rationale (**orphaned / partial verification**, **`verifyCleanOutput`** fallback gap).

### Requirements

- `.planning/REQUIREMENTS.md` — **MULTI-08**–**MULTI-13** acceptance lines and traceability table.

### Prior verification pattern

- `.planning/phases/03-ffmpeg-remux-muxers-audio-policy/03-VERIFICATION.md` — template for **`*-VERIFICATION.md`** tables and evidence style.

### Implementation anchors

- `src/domain/clean-output-verify.ts` — current **`verifyCleanOutput`** (**video-copy-safe** + **`claimedVideoCopied`** gate).
- `src/app/clean.ts` — **`finalizeCleanSuccess`** wires **`verifyCleanOutput`**.
- `.planning/phases/05-x265-preferred-video-reencode/05-CONTEXT.md` — **MULTI-13** / **libx265** defaults and naming expectations.

### Prior phase context (carry-forward)

- `.planning/phases/04-ux-verification-fixtures-regression/04-CONTEXT.md` — UX / verification / fixtures intent for **MULTI-08**–**MULTI-12**.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`verifyCleanOutput`** + **`canonicalVideoCodecForVerify`** — extend modality branches rather than forking a second verifier.
- **`finalizeCleanSuccess`** — single injection point for post-run probes + verification params.

### Established Patterns

- Verification Markdown mirrors **03** closure (**automated verify** fingerprint + requirement tables).
- Phase **04**/**05** already shipped behavior; Phase **09** is **documentation + verifier completeness**, not new matrix rows.

### Integration Points

- **`CleanRunReport`** / **`inspect`** text and **`--json`** payloads must remain consistent with any new verification fields or failure reasons (**MULTI-08**, **MULTI-09**).

</code_context>

<specifics>
## Specific Ideas

No user specifics — **yolo** defaults: align with milestone audit, **03-VERIFICATION** shape, and existing Phase **04**/**05** summaries.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase **09** scope.

</deferred>

---

*Phase: 09-gap-closure-output-verify-trust*  
*Context gathered: 2026-05-04*
