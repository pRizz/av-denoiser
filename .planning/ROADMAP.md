# Roadmap: av-denoiser

## Milestones

- ✅ **[v1.0 — CLI & v1 requirements](milestones/v1.0-ROADMAP.md)** — shipped **2026-05-03** — frozen checklist + reqs + audit artifacts. Phase execution workspace snapshot: [.planning/milestones/v1.0-phases/](.planning/milestones/v1.0-phases/)
- 🚧 **v1.1 — Multi-container stream copy** — **active** ([REQUIREMENTS.md](REQUIREMENTS.md)); phases **01–04** numbered **afresh**.

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

**Goal:** Expand **`evaluateStreamCopyFeasibility`** (and friends) so **VP9** + **Theora** (and **MULTI-05** extras) map to **copy-safe** vs **fallback** with stable tokens (**MULTI-03**–**MULTI-05**).

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
3. **`fallback-required`** execute path still uses existing **libx264** recipe when matrix demands re-encode.

**Depends on:** Phase 02  
**Requirements:** MULTI-06, MULTI-07

---

### Phase 04: UX, verification, fixtures, regression

**Goal:** Ship operator-grade messaging + output verification + tests (**MULTI-08**–**MULTI-12**).

**Success criteria**

1. Preservation notes / JSON mention container + HDR caveats coherently.
2. **`verifyCleanOutput`** covers new modalities / canonical codec checks.
3. **`bun run verify`** green with new fixtures + **MP4 H.264/HEVC/AV1** regressions.

**Depends on:** Phase 03  
**Requirements:** MULTI-08, MULTI-09, MULTI-10, MULTI-11, MULTI-12

---

## Next action

Phase **02** discuss complete — run **`/gsd-plan-phase 02`** (optional **`/gsd-research-phase 02`**) for the feasibility matrix (VP9, Theora, **MULTI-03**–**MULTI-05**). Context: [.planning/phases/02-feasibility-matrix-vp9-theora-extras/02-CONTEXT.md](.planning/phases/02-feasibility-matrix-vp9-theora-extras/02-CONTEXT.md).
