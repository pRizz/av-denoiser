# Roadmap: av-denoiser

## Milestones

- ✅ **[v1.0 — CLI & v1 requirements](milestones/v1.0-ROADMAP.md)** — shipped **2026-05-03** — frozen checklist + reqs + audit artifacts. Phase execution workspace snapshot: [.planning/milestones/v1.0-phases/](.planning/milestones/v1.0-phases/)
- 🚧 **v1.1 — Multi-container stream copy** — **active** ([REQUIREMENTS.md](REQUIREMENTS.md)); core delivery **01–05**; **06–09** [gap closure](v1.1-MILESTONE-AUDIT.md) after `/gsd-audit-milestone`.

---

## Milestone v1.1 phases

Requirements traceability tabulated in [.planning/REQUIREMENTS.md](REQUIREMENTS.md) § Traceability.

### Phase 01: Multi-container output model & path derivation

**Goal:** Introduce typed **planned output container** (MP4 \| Matroska \| WebM) and wire **basename / extension derivation** (**MULTI-01**, **MULTI-02**) without widening feasibility beyond current MP4 row yet.

**Success criteria**

1. `PlannedContainer` (or successor) distinguishes **Matroska** /**WebM** in domain types surfaced to **`planMediaOutput`** consumers.
2. **`resolveOutputPath`** / default **`.avdn.*`** suffix picks **`.mkv`** / **`.webm`** when plan demands; existing **MP4** behavior unchanged in tests.
3. **Reason-code taxonomy** draft documents how future rows will name **container+codec** pairs.

**Depends on:** —  
**Requirements:** MULTI-01, MULTI-02

---

### Phase 02: Feasibility matrix — VP9, Theora, extras

**Goal:** **Delivered (v1.1):** **`planVideoStreamCopyFeasibility`** wired through **`planMediaOutputPrelude`** so **VP9** → WebM (**MULTI-03**), **Theora** → Matroska (**MULTI-04**), and extras such as explicit **VP8** fallback (**MULTI-05**) map to **copy-safe** vs **`fallback-required`** with stable tokens.

**Success criteria**

1. VP9 probe fixtures → **`video-copy-safe`** for at least one allowed container pairing; vp9+MP4 remains **conservatively disallowed** unless explicitly documented **and** tested.
2. Theora probe fixtures → **`video-copy-safe`** for **Matroska** path per matrix.
3. **`inspect`** text/JSON shows new success tokens (full UX polish can land in Phase 4 but modality must be correct).

**Depends on:** Phase 01  
**Requirements:** MULTI-03, MULTI-04, MULTI-05

---

### Phase 03: FFmpeg remux — muxers & audio policy

**Goal:** **`buildRemuxVideoWithProcessedAudioCommand`** (and **`clean`**) honor **mux format** + **per-container audio codec** policy (**MULTI-06**, **MULTI-07**).

**Success criteria**

1. **Dry-run** summaries show **`-f matroska`** / **`-f webm`** (or equivalent explicit mux selection) when required.
2. Opus / AAC selection follows documented policy table; no raw user filtergraphs.
3. **`fallback-required`** execute path used **libx264** through Phase **04**; **Phase 05 / MULTI-13** replaces fallback **video** with **`libx265`** (HEVC).

**Depends on:** Phase 02  
**Requirements:** MULTI-06, MULTI-07

---

### Phase 04: UX, verification, fixtures, regression

**Goal:** Ship operator-grade messaging + output verification + tests (**MULTI-08**–**MULTI-12**).

**Status:** Implemented (see [.planning/phases/04-ux-verification-fixtures-regression/](.planning/phases/04-ux-verification-fixtures-regression/)).

**Success criteria**

1. Preservation notes / JSON mention container + HDR caveats coherently.
2. **`verifyCleanOutput`** covers new modalities / canonical codec checks.
3. **`bun run verify`** green with new fixtures + **MP4 H.264/HEVC/AV1** regressions.

**Depends on:** Phase 03  
**Requirements:** MULTI-08, MULTI-09, MULTI-10, MULTI-11, MULTI-12

---

### Phase 05: x265-preferred video re-encode

**Goal:** When **`clean`** **must** **re‑encode video** (**`fallback-required`** with **`--allow-video-fallback`**, matrix escapes), implement **libx265** FFmpeg paths and **prefer x265 over x264** as the **default/first-choice** re‑encode (**HEVC**/H.265), subject to **`PlannedContainer`** and Phase **03** mux/format policy.

**Status:** Implemented (**MULTI-13**); see [.planning/phases/05-x265-preferred-video-reencode/](.planning/phases/05-x265-preferred-video-reencode/).

**Success criteria**

1. argv builders (**`video-clean-argv`** / successors) emit **`libx265`** (**and sane defaults**: e.g. **`-pix_fmt yuv420p`**, **`hvc1`** tagging for MP4 as needed) where **`libx264`** applies today for video re‑encode.
2. **`inspect`** / summaries / **`--json`** stay truthful on **planned re‑encode codec** (HEVC/x265 naming consistent with probes).
3. Tests cover **verifyCleanOutput**/codec canonicalization for **x265-encoded** fallback outputs (**`h265`** / **`hevc`** probe synonyms).
4. Document performance trade-offs (slower/heavier than x264) for operators; optional **`doctor`** hint can be phased.

**Depends on:** Phase **04** (verification harness); coordination with Phase **03** when **`fallback-required`** still references **libx264** inline — PLAN **Phase **03**/ **Phase **05** order** clarified at **`/gsd-plan-phase`** time.

**Requirements:** MULTI-13

**Artifacts:** [.planning/phases/05-x265-preferred-video-reencode/](.planning/phases/05-x265-preferred-video-reencode/)

---

### Phase 06: Gap closure — Phase 01 verification & MULTI-01/02 traceability

**Goal:** Add **Phase 01** `*-VERIFICATION.md`, reconcile **MULTI-01** / **MULTI-02** in [REQUIREMENTS.md](REQUIREMENTS.md) (checkboxes + traceability) with evidence from existing implementation and **`bun run verify`**.

**Gap closure:** [v1.1-MILESTONE-AUDIT.md](v1.1-MILESTONE-AUDIT.md) — missing **01** verification; integration/doc drift **MULTI-01**, **MULTI-02**.

**Success criteria**

1. **01-VERIFICATION.md** exists with `status: passed | gaps_found` and requirement evidence table.
2. **MULTI-01** / **MULTI-02** checkboxes and traceability reflect verified state (no “implemented but Pending” drift).

**Depends on:** Phase 05 (original delivery)  
**Requirements:** MULTI-01, MULTI-02 (closure)

**Artifacts:** [.planning/phases/06-gap-closure-phase-01-verification-multi-01-02/](.planning/phases/06-gap-closure-phase-01-verification-multi-01-02/)

---

### Phase 07: Gap closure — MULTI-03 feasibility vs requirements

**Goal:** Close audit **unsatisfied** gap: **MULTI-03** text allows **VP9** copy-safe for **WebM and/or Matroska**; code is **WebM-only** for VP9 today. Either narrow **REQUIREMENTS.md** / docs to match shipped matrix **or** implement and test a **Matroska** pairing — no silent optimism.

**Gap closure:** Audit **gaps.requirements** (MULTI-03); **tech_debt** Phase 02 Matroska-for-VP9 decision.

**Success criteria**

1. **MULTI-03** requirement text, **02-VERIFICATION.md** (or addendum), and **`planVideoStreamCopyFeasibility`** behavior are mutually consistent.
2. **`bun run verify`** green after any code change.

**Depends on:** Phase 06 (recommended — traceability hygiene first)  
**Requirements:** MULTI-03 (closure)

**Artifacts:** [.planning/phases/07-gap-closure-multi-03-feasibility-alignment/](.planning/phases/07-gap-closure-multi-03-feasibility-alignment/)

---

### Phase 08: Gap closure — Phase 03 remux pipeline trust

**Goal:** Add **03-VERIFICATION.md**; fix **intermediate pipeline artifact naming** where deliverable mux is **WebM/Matroska** but on-disk intermediate suggests **`.mp4`** (audit **MULTI-06** / **MULTI-07** integration).

**Status:** Closed **2026-05-04** — **`pipelineAudioOutIntermediateBasename`**, [**03-VERIFICATION.md**](phases/03-ffmpeg-remux-muxers-audio-policy/03-VERIFICATION.md); summaries [**08-01**](phases/08-gap-closure-phase-03-remux-pipeline-trust/08-01-SUMMARY.md), [**08-02**](phases/08-gap-closure-phase-03-remux-pipeline-trust/08-02-SUMMARY.md).

**Gap closure:** Missing Phase **03** verification; mux/filename mismatch.

**Success criteria**

1. **03-VERIFICATION.md** with evidence for **MULTI-06**, **MULTI-07**.
2. Intermediate filenames (where applicable) align with mux policy or are documented if unchanged for FFmpeg-compat reasons.

**Depends on:** Phase 07 (recommended — MULTI-03 truth stable)  
**Requirements:** MULTI-06, MULTI-07 (closure)

**Artifacts:** [.planning/phases/08-gap-closure-phase-03-remux-pipeline-trust/](.planning/phases/08-gap-closure-phase-03-remux-pipeline-trust/)

---

### Phase 09: Gap closure — output verify & Phase 04/05 verification

**Goal:** Add **04-VERIFICATION.md** and **05-VERIFICATION.md**; extend **`verifyCleanOutput`** (or successor) so **fallback / re-encode** paths assert **canonical video codec** on output where **MULTI-10** / **MULTI-13** promise truthfulness — not only copy-safe **`claimedVideoCopied`** branch.

**Gap closure:** Orphan/partial **MULTI-08**–**MULTI-13** relative to phase **VERIFICATION** artifacts; E2E verify gap on fallback video.

**Success criteria**

1. Verification files exist for phases **04** and **05** with requirement ↔ evidence mapping (**MULTI-08**–**MULTI-13**).
2. Tests cover post-fallback output video codec verification (or documented equivalent), **`bun run verify`** green.

**Depends on:** Phase 08 (recommended — remux naming/mux policy settled)  
**Requirements:** MULTI-08, MULTI-09, MULTI-10, MULTI-11, MULTI-12, MULTI-13 (closure)

**Artifacts:** [.planning/phases/09-gap-closure-output-verify-trust/](.planning/phases/09-gap-closure-output-verify-trust/)

---

## Next action

Phase **08** is complete: **03-VERIFICATION.md** documents **MULTI-06**/**MULTI-07**; **`clean`** uses **`pipelineAudioOutIntermediateBasename`** for execute + dry-run preview paths; **`bun run verify`** green (**222** tests). Continue with **`/gsd-plan-phase 09`** (output verify / **MULTI-08**–**MULTI-13** closure) then **`/gsd-execute-phase 09`**.

**Audit:** [.planning/v1.1-MILESTONE-AUDIT.md](v1.1-MILESTONE-AUDIT.md)
