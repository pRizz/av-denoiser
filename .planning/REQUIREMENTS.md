# Requirements — av-denoiser milestone v1.1

**Defined:** 2026-05-03  
**Core value:** Users can pass media through the denoise pipeline **while minimizing unnecessary video recompression** — extended to honest **multi-container** stream-copy paths.

## v1.1 Requirements

Each item maps one-to-one into the live roadmap phases.

### Output container expansion

- [ ] **MULTI-01**: Planner emits a **planned output container** of **MP4**, **Matroska**, or **WebM** (typed domain value), derived deterministically from **ffprobe** facts plus the feasibility matrix—not from raw user FFmpeg strings alone.
- [ ] **MULTI-02**: Default **output path derivation** (**`resolveOutputPath`** / **`avdn`**) produces a correct extension (**`.mkv`**, **`.webm`**, **`.mp4`**) aligned with **`plannedContainer`**, keeping collision‑safe basename rules from v1.

### Stream-copy feasibility (VP9 / Theora)

- [ ] **MULTI-03**: Lone **VP9** video + eligible audio qualifies for **`video-copy-safe`** against **WebM** and/or **Matroska** per matrix rows (`reasonCodes`, no silent optimism when gates fail).
- [ ] **MULTI-04**: Lone **theora** video + eligible audio qualifies for **`video-copy-safe`** against **Matroska** (and optionally **WebM**) per documented matrix constraints.
- [ ] **MULTI-05**: **Additional popular codecs** (e.g. **VP8**) get explicit matrix rows (**allow**, **fallback**, or **`unsupported`**) — every observation must carry a stable **reason token**; defaults remain conservative when uncertain.

### Remux execution

- [x] **MULTI-06**: Typed **FFmpeg argv** builders select **mux-specific** defaults (e.g. **`-f webm`** / **`matroska`** when required) alongside **`-map`** / **`c:v`** / planned audio codec policy.
- [x] **MULTI-07**: **Per-container planned audio codec** documented and implemented (**AAC**, **opus**, **`pcm_*`** subsets as allowed—for example WebM‑first **Opus** where required by policy—with **AAC** continuity where FFmpeg/muxer accepts it reliably).

### Surfaces & trust

- [x] **MULTI-08**: **`inspect`** preservation bullets and **`--json`** payloads describe **planned container**, **success/fallback tokens**, and **HDR / side‑data caveats** where copy applies.
- [x] **MULTI-09**: **`fallback-required`** + **`allowVideoFallback`** semantics remain truthful when the matrix demands **video re‑encode** (unchanged acknowledgment story).
- [x] **MULTI-10**: **`verifyCleanOutput`** (or successor) validates **canonical codec equality** compatible with mux output probes for new containers.

### Tests & fixtures

- [x] **MULTI-11**: **Ffprobe-style fixtures** (VP9/WebM‑ish, **Theora**/Ogg‑ish minimally) unlock planning + argv tests without mandating heavyweight binaries beyond existing harness.
- [x] **MULTI-12**: **Regression locks** preserve **MP4** **H.264/HEVC/AV1** **video-copy-safe** behaviors from shipped v1.1 codebase.

## Future (post‑v1.1)

Defer unless explicitly scheduled:

| ID | Capability |
|----|-------------|
| FUT‑01 | User‑selectable preferred output container override flag |
| FUT‑02 | Optional bounded **ffmpeg copy dry‑run** probe before **`video-copy-safe`** |
| FUT‑03 | Full **multi‑track**/subtitle passthrough (**MEDIA2‑***) |

## Out of Scope (v1.1)

| Item | Reason |
|------|--------|
| Hosted / cloud renders | CLI stays local‑FOSS default |
| Proprietary codecs / SDKs | Product charter unchanged |
| NLE timelines / `.mlt` execution | Observation only (**TOOL‑07**) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MULTI-01 | Phase 1 | Pending |
| MULTI-02 | Phase 1 | Pending |
| MULTI-03 | Phase 2 | Pending |
| MULTI-04 | Phase 2 | Pending |
| MULTI-05 | Phase 2 | Pending |
| MULTI-06 | Phase 3 | Done |
| MULTI-07 | Phase 3 | Done |
| MULTI-08 | Phase 4 | Done |
| MULTI-09 | Phase 4 | Done |
| MULTI-10 | Phase 4 | Done |
| MULTI-11 | Phase 4 | Done |
| MULTI-12 | Phase 4 | Done |

**Coverage:** **12**/12 v1.1 IDs mapped (**4** phases).

---

*Requirements defined: 2026-05-03 (milestone **`/gsd-new-milestone` bootstrap)*
