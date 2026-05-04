---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 08-2026-05-04T11-14-07
generated_at: 2026-05-04T11:14:07.081Z
---

# Phase 08: gap-closure-phase-03-remux-pipeline-trust - Context

**Gathered:** 2026-05-04  
**Status:** Ready for planning  
**Mode:** Yolo

<domain>

## Phase Boundary

Close the v1.1 audit gap on **Phase 03** (**MULTI-06**, **MULTI-07**): add **`.planning/phases/03-ffmpeg-remux-muxers-audio-policy/03-VERIFICATION.md`** with requirement ↔ evidence, and align **on-disk intermediate pipeline audio** filenames with the **mux/audio policy** actually used by **`encodeDeliverableArgs`** — today **`runCleanRequest`** hardcodes **`pipeline-audio-out.mp4`** (`src/app/clean.ts`) while **`expandPreset` → encode-deliverable** may emit **`-f webm` / `-f matroska` / `-f mp4`** per **`plannedContainer`** and **`plannedAudioCodec`**, which confuses operators and contradicts [.planning/v1.1-MILESTONE-AUDIT.md](v1.1-MILESTONE-AUDIT.md) (**mux/filename mismatch**).

**Depends on:** Phase **07** (MULTI-03 truth stable).

**Non-goals:** Phase **09** verification files, **`verifyCleanOutput`** fallback video codec deepening, new matrix rows.

</domain>

<decisions>

## Implementation Decisions

### 03-VERIFICATION artifact (`MULTI-06` / `MULTI-07` closure)

- **D-01:** Add **`03-VERIFICATION.md`** beside Phase **03** plans, following **`01-VERIFICATION.md`** structure: YAML frontmatter (`status`, `phase`, `generated_at`), **Must-haves vs evidence** tables, **Requirement IDs** section mapping **MULTI-06** and **MULTI-07** to concrete file/test citations.
- **D-02:** Evidence MUST include **`buildRemuxVideoWithProcessedAudioCommand`** **`-f webm`** / **`-f matroska`** / MP4 omission policy, **`plannedAudioCodec`** argv branches, **`clean`** remux wiring, and **`test/domain/video-clean-argv.test.ts`** (extend if new helper surfaces).
- **D-03:** Set verification **`status: passed`** only when **`bun run verify`** is green **after** naming fix + doc land; interim **`gaps_found`** allowed only if blocking work spills (should not).

### Intermediate pipeline audio path (audit mux/filename alignment)

- **D-04:** Replace the hardcoded **`pipeline-audio-out.mp4`** intermediate with a basename **derived from the same `(plannedAudioCodec, plannedContainer)` rules** as **`encodeDeliverableArgs`** in **`src/domain/audio-pipeline-argv.ts`** — so a **WebM/Opus** plan writes a **`*.webm`** intermediate, **Matroska/AAC** → **`*.mkv`**, **MP4/AAC** → **`*.mp4`**, preserving FFmpeg **`-f`** semantics already chosen for that step (no behavioral change beyond path string).
- **D-05:** Implement derivation as a **single shared pure helper** (e.g. **`pipelineIntermediateAudioFilename`** or **`suffixForEncodeDeliverableContainer`**) exported from **`src/domain/audio-pipeline-argv.ts`** (or **`output-plan`** if planners already own mime/ext mapping — prefer co-location with **`encodeDeliverableArgs`** to avoid drift). **`clean.ts`** imports and uses **`join(tempRoot, basename)`**.
- **D-06:** For **Matroska** audio-only intermediate, use **`.mkv`** (matches **`plannedContainer: "matroska"`** default output extension narrative in **MULTI-02**) rather than **`.mka`**, unless FFmpeg acceptance tests prove otherwise — document in **03-VERIFICATION** if **`.mka`** is substituted.
- **D-07:** Dry-run previews that reference temp paths MUST stay consistent **if** they surface this filename anywhere; grep **`pipeline-audio`** / **`pipeline-audio-out`** during implementation.

### Requirements traceability bookkeeping

- **D-08:** When **03-VERIFICATION** reaches **`passed`**, update **[`.planning/REQUIREMENTS.md`](REQUIREMENTS.md)** checkboxes and **Traceability** row status for **MULTI-06** and **MULTI-07** from **Pending** → **Complete** (same MR / plan wave as Phase **08** execution).

### Claude's Discretion

- Intermediate **stem** (`pipeline-audio-out` vs `pipeline-intermediate`) — keep **`pipeline-audio-out`** unless a second temp file collides (unlikely); only extension changes unless grep finds multiple call sites needing clarity.
- Whether to add a **tiny unit test** only for the new filename helper (**recommended**, fast) vs inferring coverage from **`clean`/argv** integration tests alone.

### Folded Todos

None (**`todo match-phase 08`** returned **0** matches).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone audit & scope

- `.planning/ROADMAP.md` — Phase **08** goal, success criteria, **Depends on** Phase **07**.
- `.planning/v1.1-MILESTONE-AUDIT.md` — **MULTI-06** / **MULTI-07** missing **Phase 03** verification; intermediate **`.mp4`** vs mux mismatch evidence.
- `.planning/REQUIREMENTS.md` — **MULTI-06**, **MULTI-07**, traceability table (**Phase 8 (gap closure)**).

### Locked Phase 03 product decisions

- `.planning/phases/03-ffmpeg-remux-muxers-audio-policy/03-CONTEXT.md` — **`-f webm`** / **`-f matroska`**, MP4 no **`-f`**, AAC/Opus table (**D-01–D-08** therein).

### Prior gap-closure patterns

- `.planning/phases/01-multi-container-output-model-path-derivation/01-VERIFICATION.md` — template for **`03-VERIFICATION.md`** formatting.
- `.planning/phases/06-gap-closure-phase-01-verification-multi-01-02/06-CONTEXT.md` — gap-closure hygiene for verification + REQ checkboxes.

### Implementation touchpoints

- `src/app/clean.ts` — **`pipelineAudioPath`**, video **`runSequentialPipeline`** → **`buildRemuxVideoWithProcessedAudioCommand`** wiring.
- `src/domain/audio-pipeline-argv.ts` — **`encodeDeliverableArgs`**, **`encode-deliverable`** branch (authoritative **`(codec, container) → -f`** mapping).
- `src/domain/audio-pipeline-plan.ts` — **`expandPreset` / encode-deliverable** carries **`plannedAudioCodec`** / **`plannedContainer`**.
- `src/domain/video-clean-argv.ts` — **`buildRemuxVideoWithProcessedAudioCommand`** (**MULTI-06** mux args).
- `test/domain/video-clean-argv.test.ts` — remux argv regressions (`-f webm`/`-f matroska`).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable assets

- **`encodeDeliverableArgs`** already encodes the **mux/audio** matrix for intermediate encode; filename logic should reuse the same branching so **`-f`** and **extension** never disagree.
- **`buildRemuxVideoWithProcessedAudioCommand`** already applies **MULTI-06** mux flags on the **final** remux argv.

### Established patterns

- Temp workspace under **`mkdtemp("av-denoiser-clean-")`**; deterministic sibling names **`extracted.wav`**, **`step-${i}.wav`**.
- **Functional-core** preference: pathname derivation belongs in **`src/domain`** with **`clean.ts`** as shell.

### Integration points

- **`runCleanRequest`** video branch: **`extractPath`** (WAV) → pipeline steps → **`pipelineAudioPath`** → **`processedAudioPath`** in remux argv.

</code_context>

<specifics>

## Specific Ideas

No user-specific refs — recommendations come from roadmap + audit **`pipeline-audio-out.mp4`** mismatch against **`encode-deliverable`** behavior.

</specifics>

<deferred>

## Deferred Ideas

- **MULTI-08**–**MULTI-13** verification expansions → Phase **09** per roadmap.
- **VP9→Matroska** copy-safe pairing (deferred milestone) — untouched.

### Reviewed Todos (not folded)

None (`todo_count: 0`).

</deferred>

---

*Phase: 08-gap-closure-phase-03-remux-pipeline-trust*  
*Context gathered: 2026-05-04*
