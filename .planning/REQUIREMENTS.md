# Requirements — av-denoiser milestone v1.1

**Defined:** 2026-05-03  
**Core value:** Users can pass media through the denoise pipeline **while minimizing unnecessary video recompression** — extended to honest **multi-container** stream-copy paths.

## v1.1 Requirements

Each item maps one-to-one into the live roadmap phases.

### Output container expansion

- [x] **MULTI-01**: Planner emits a **planned output container** of **MP4**, **Matroska**, or **WebM** (typed domain value), derived deterministically from **ffprobe** facts plus the feasibility matrix—not from raw user FFmpeg strings alone.
- [x] **MULTI-02**: Default **output path derivation** (**`resolveOutputPath`** / **`avdn`**) produces a correct extension (**`.mkv`**, **`.webm`**, **`.mp4`**) aligned with **`plannedContainer`**, keeping collision‑safe basename rules from v1.

### Stream-copy feasibility (VP9 / Theora)

- [x] **MULTI-03**: Lone **VP9** video + eligible audio qualifies for **`video-copy-safe`** with **`plannedContainer: "webm"`** and **`video-copy-vp9-webm-v1`** (**reasonCodes**) when structural gates pass; **VP9** stream-copy into **Matroska** is **explicitly deferred** out of v1.1 (**no** **`video-copy-vp9-matroska-v1`** unless a future milestone implements/tests it). Gates that fail remain **`fallback-required`** with stable tokens (**no silent optimism**).
- [x] **MULTI-04**: Lone **theora** video + eligible audio qualifies for **`video-copy-safe`** against **Matroska** (and optionally **WebM**) per documented matrix constraints.
- [x] **MULTI-05**: **Additional popular codecs** (e.g. **VP8**) get explicit matrix rows (**allow**, **fallback**, or **`unsupported`**) — every observation must carry a stable **reason token**; defaults remain conservative when uncertain.

### Remux execution

- [ ] **MULTI-06**: Typed **FFmpeg argv** builders select **mux-specific** defaults (e.g. **`-f webm`** / **`matroska`** when required) alongside **`-map`** / **`c:v`** / planned audio codec policy.
- [ ] **MULTI-07**: **Per-container planned audio codec** documented and implemented (**AAC**, **opus**, **`pcm_*`** subsets as allowed—for example WebM‑first **Opus** where required by policy—with **AAC** continuity where FFmpeg/muxer accepts it reliably).

### Surfaces & trust

- [ ] **MULTI-08**: **`inspect`** preservation bullets and **`--json`** payloads describe **planned container**, **success/fallback tokens**, and **HDR / side‑data caveats** where copy applies.
- [ ] **MULTI-09**: **`fallback-required`** + **`allowVideoFallback`** semantics remain truthful when the matrix demands **video re‑encode** (unchanged acknowledgment story).
- [ ] **MULTI-10**: **`verifyCleanOutput`** (or successor) validates **canonical codec equality** compatible with mux output probes for new containers.

### Tests & fixtures

- [ ] **MULTI-11**: **Ffprobe-style fixtures** (VP9/WebM‑ish, **Theora**/Ogg‑ish minimally) unlock planning + argv tests without mandating heavyweight binaries beyond existing harness.
- [ ] **MULTI-12**: **Regression locks** preserve **MP4** **H.264/HEVC/AV1** **video-copy-safe** behaviors from shipped v1.1 codebase.

### Video fallback re-encode

- [ ] **MULTI-13**: When **`clean`** runs **`fallback-required`** with **`--allow-video-fallback`**, FFmpeg **video** re-encode uses **`libx265`** with **MP4-appropriate defaults** (**`-pix_fmt yuv420p`**, **`-crf 28`**, **`-preset slow`**, **`-tag:v hvc1`** per **Phase 05** context), replacing **`libx264`**; **inspect** / **JSON** / **`verifyCleanOutput`** / tests remain truthful.

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
| MULTI-01 | Phase 1 (verified Phase 6 gap closure) | Complete |
| MULTI-02 | Phase 1 (verified Phase 6 gap closure) | Complete |
| MULTI-03 | Phase 2 (verified Phase 7 gap closure) | Complete |
| MULTI-04 | Phase 2 | Complete |
| MULTI-05 | Phase 2 | Complete |
| MULTI-06 | Phase 8 (gap closure) | Pending |
| MULTI-07 | Phase 8 (gap closure) | Pending |
| MULTI-08 | Phase 9 (gap closure) | Pending |
| MULTI-09 | Phase 9 (gap closure) | Pending |
| MULTI-10 | Phase 9 (gap closure) | Pending |
| MULTI-11 | Phase 9 (gap closure) | Pending |
| MULTI-12 | Phase 9 (gap closure) | Pending |
| MULTI-13 | Phase 9 (gap closure) | Pending |

**Coverage:** **13**/13 v1.1 IDs mapped — **5** **Complete** (**MULTI-01**, **MULTI-02** via [01-VERIFICATION.md](phases/01-multi-container-output-model-path-derivation/01-VERIFICATION.md); **MULTI-03** via Phase **07** docs closure anchored in [**02-VERIFICATION.md** — MULTI-03 alignment](phases/02-feasibility-matrix-vp9-theora-extras/02-VERIFICATION.md); **MULTI-04**, **MULTI-05** via Phase **02**); **8** **Pending** in gap-closure Phases **08–09** (**MULTI-06**–**MULTI-13**) (see [v1.1-MILESTONE-AUDIT.md](v1.1-MILESTONE-AUDIT.md)).

---

*Requirements defined: 2026-05-03 (milestone **`/gsd-new-milestone` bootstrap)*
