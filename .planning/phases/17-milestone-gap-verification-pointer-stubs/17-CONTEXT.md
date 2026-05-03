---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 17-2026-05-03T13-58-40Z
generated_at: "2026-05-03T13:58:40.000Z"
---

# Phase 17: Milestone Gap — Verification pointer stubs — Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Mode:** Yolo

<domain>

## Phase Boundary

Deliver **one small discoverable Markdown file per gap-phase directory `09`–`14`** (each directory already tied to retrofit verification work). Each stub **does not replace** authoritative **`03`–`08`** `*-VERIFICATION.md`** files under **feature-phase** dirs; it **hyperlinks** to the correct canonical file(s) so scripts or humans browsing gap dirs quickly reach real evidence tables.

No product **`src/`** changes; roadmap lists **no mapped REQ IDs** for this phase.

</domain>

<decisions>

## Implementation Decisions

### Naming & placement

- **D-01:** Stub files live **inside** each gap directory **`.planning/phases/<gap-dir>/`** beside existing plans/context.
- **D-02:** Filename pattern **`NN-VERIFICATION.md`** where **`NN`** matches gap phase (**`09`**…**`14`**) — e.g. **`.planning/phases/09-milestone-gap-phase-03-verification/09-VERIFICATION.md`**.
- **D-03:** Do **not** introduce a repo-root index instead of per-dir stubs (roadmap calls for one artifact **per** gap-phase directory).

### Pointer targets (canonical)

- **D-04:** **Gap 09** → **[`../03-video-preservation-fallback-control/03-VERIFICATION.md`](../03-video-preservation-fallback-control/03-VERIFICATION.md)** (VIDEO-\* closure narrative).
- **D-05:** **Gap 10** → **[`../04-core-audio-pipeline-sox-cleanup/04-VERIFICATION.md`](../04-core-audio-pipeline-sox-cleanup/04-VERIFICATION.md)**.
- **D-06:** **Gap 11** → **[`../05-final-media-output-reporting/05-VERIFICATION.md`](../05-final-media-output-reporting/05-VERIFICATION.md)**.
- **D-07:** **Gap 12** → **[`../08-optional-heavy-editor-integrations/08-VERIFICATION.md`](../08-optional-heavy-editor-integrations/08-VERIFICATION.md)**.
- **D-08:** **Gap 13** → **[`../07-batch-processing-manifests/07-VERIFICATION.md`](../07-batch-processing-manifests/07-VERIFICATION.md)** (batch manifest / **BATCH-05** story).
- **D-09:** **Gap 14** → **two** canonical links in one stub: **[`../06-guided-repeatable-workflows/06-VERIFICATION.md`](../06-guided-repeatable-workflows/06-VERIFICATION.md)** **and** **[`../07-batch-processing-manifests/07-VERIFICATION.md`](../07-batch-processing-manifests/07-VERIFICATION.md)** (guided + batch parity verification split across **06**/**07**).

### Stub body & frontmatter

- **D-10:** Body is **short**: title, 1–2 sentences stating “pointer only”, bullet list of links, optional one-line “REQ coverage lives in canonical file(s)”.
- **D-11:** YAML frontmatter **minimal** — at least `phase` (gap slug or number), `stub: true` (boolean), `generated_by` / `generated_at` when touched in execution; **do not** copy **`status: passed`** scores from real verification (avoids implying a second full verification pass).

### Tooling / Biome

- **D-12:** Plain Markdown only; **`bun run verify`** must stay green (no broken JSON, no odd extensions).

### Claude's Discretion

- Exact markdown heading text and whether to add a tiny “Phase **N** retrofit” table — as long as links stay **relative** and resolve from each gap directory.

### Folded Todos

- None identified in this yolo pass.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & audit

- `.planning/ROADMAP.md` — **Phase **17**** goal / plan line (**planning-layout** closure)
- `.planning/v1.0-MILESTONE-AUDIT.md` — **planning-layout** tech debt (gap dirs vs feature verification)

### Already-passed verification (targets of pointers)

- `.planning/phases/03-video-preservation-fallback-control/03-VERIFICATION.md`
- `.planning/phases/04-core-audio-pipeline-sox-cleanup/04-VERIFICATION.md`
- `.planning/phases/05-final-media-output-reporting/05-VERIFICATION.md`
- `.planning/phases/06-guided-repeatable-workflows/06-VERIFICATION.md`
- `.planning/phases/07-batch-processing-manifests/07-VERIFICATION.md`
- `.planning/phases/08-optional-heavy-editor-integrations/08-VERIFICATION.md`

### Gap directories receiving stubs (**09–14**)

- `.planning/phases/09-milestone-gap-phase-03-verification/`
- `.planning/phases/10-milestone-gap-phase-04-verification/`
- `.planning/phases/11-milestone-gap-phase-05-verification/`
- `.planning/phases/12-milestone-gap-phase-08-verification/`
- `.planning/phases/13-milestone-gap-batch-manifest-doctor/`
- `.planning/phases/14-milestone-gap-guided-batch-parity/`

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable assets

- Established **verification artifact** tone and tables under feature phases **`01`–`08`** — stubs only **route** readers there.

### Established patterns

- Gap phases **`09`–`14`** already store **PLAN** / **SUMMARY** / **CONTEXT**; adding **`NN-VERIFICATION.md`** completes discoverability without duplicating evidence.

### Integration points

- Optional future automation grepping **`*-VERIFICATION.md`** under **`.planning/phases`** will now find gap dirs without false negatives.

</code_context>

<specifics>

## Specific Ideas

- Relative links keep clones and CI checkouts portable (no hard-coded `https://`).

</specifics>

<deferred>

## Deferred Ideas

- Symlink stubs to canonical files — **rejected**: symlinks behave poorly cross-OS/Git clients; Markdown links suffice.

### Reviewed Todos (not folded)

- None.

</deferred>

---

*Phase: 17-milestone-gap-verification-pointer-stubs*
*Context gathered: 2026-05-03 (yolo)*
