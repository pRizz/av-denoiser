# Roadmap: av-denoiser

## Milestones

- ✅ **[v1.0 — CLI & v1 requirements](milestones/v1.0-ROADMAP.md)** — shipped **2026-05-03** — frozen checklist + reqs + audit artifacts. Phase execution workspace snapshot: [.planning/milestones/v1.0-phases/](.planning/milestones/v1.0-phases/)
- 🚧 **v1.1 — Multi-container stream copy** — **active** ([REQUIREMENTS.md](REQUIREMENTS.md)); phased roadmap **01–05** (**01–04** MULTI roadmap + **Phase 05** codec preference extension).

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

### Phase 05: x265-preferred video re-encode

**Goal:** When **`clean`** **must** **re‑encode video** (**`fallback-required`** with **`--allow-video-fallback`**, matrix escapes), implement **libx265** FFmpeg paths and **prefer x265 over x264** as the **default/first-choice** re‑encode (**HEVC**/H.265), subject to **`PlannedContainer`** and Phase **03** mux/format policy.

**Success criteria**

1. argv builders (**`video-clean-argv`** / successors) emit **`libx265`** (**and sane defaults**: e.g. **`-pix_fmt yuv420p`**, **`hvc1`** tagging for MP4 as needed) where **`libx264`** applies today for video re‑encode.
2. **`inspect`** / summaries / **`--json`** stay truthful on **planned re‑encode codec** (HEVC/x265 naming consistent with probes).
3. Tests cover **verifyCleanOutput**/codec canonicalization for **x265-encoded** fallback outputs (**`h265`** / **`hevc`** probe synonyms).
4. Document performance trade-offs (slower/heavier than x264) for operators; optional **`doctor`** hint can be phased.

**Depends on:** Phase **04** (verification harness); coordination with Phase **03** when **`fallback-required`** still references **libx264** inline — PLAN **Phase **03**/ **Phase **05** order** clarified at **`/gsd-plan-phase`** time.

**Requirements:** TBD (add requirement ID row in **`REQUIREMENTS.md`** when planning Phase **05**).

**Artifacts:** [.planning/phases/05-x265-preferred-video-reencode/](.planning/phases/05-x265-preferred-video-reencode/)

---

## Next action

Phase **02** plans ready — **`/gsd-execute-phase 02`** (Wave **1** then **2**) or **`/gsd-plan-phase`** refresh if CONTEXT changes.

- Context / research: [.planning/phases/02-feasibility-matrix-vp9-theora-extras/](.planning/phases/02-feasibility-matrix-vp9-theora-extras/)
