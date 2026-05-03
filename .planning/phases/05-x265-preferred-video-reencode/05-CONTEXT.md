---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 05-2026-05-03T17-34-41
generated_at: 2026-05-03T17:34:41.791Z
---

# Phase 05: x265-preferred video re-encode - Context

**Gathered:** 2026-05-03  
**Status:** Ready for planning  
**Mode:** Yolo

<domain>

## Phase Boundary

When **`clean`** must **re-encode video** on the **`fallback-required`** path with **`--allow-video-fallback`** (matrix escape), replace today’s **`libx264`** recipe with **`libx265`** as the **default/first-choice** video encoder, with **MP4-appropriate tagging** and **sane FFmpeg defaults**, while keeping **Phase 03** **mux + per-container audio** policy and the invariant that **video-fallback remux targets `plannedContainer: "mp4"`** (no WebM/MKV video re-encode branch in this phase unless REQUIREMENTS explicitly expand).

**Non-goals:** User flag to **force x264** (defer to backlog / future requirement unless trivial), **Demucs**/track policy changes, **FUT-01** container override.

</domain>

<decisions>

## Implementation Decisions

### Fallback container & prelude (coordination with Phase 03)

- **D-01:** Preserve **Phase 03** invariant: **`fallback-required`** execute path that remuxes with **video re-encode** continues to use **`plannedContainer: "mp4"`** and **omits** **`-f webm`** / **`-f matroska`** on the final output — only the **video encoder block** swaps **x264 → x265**.
- **D-02:** **Audio remux argv** for that branch stays **`MULTI-07`** (**`-c:a aac -b:a 192k`** for MP4).

### FFmpeg `libx265` argv (replace `libx264` block in `buildRemuxVideoWithProcessedAudioCommand`)

- **D-03:** Use **`libx265`** with **`-pix_fmt yuv420p`** (unchanged pixel constraint).
- **D-04:** Use **`-crf 28`** as a practical **visually similar tier** to the existing **`libx264 -crf 23`** default; PLAN may adjust after spot-check encodes if tests show systematic quality/size issues.
- **D-05:** Use **`-preset slow`** as the default **quality-first** choice: noticeably more CPU time than **`medium`**, but **better compression efficiency at the same CRF** (fits “denoise once, keep the file” workflows). Document **longer fallback encodes** for operators vs **`x264 -preset fast`**.
- **D-06:** For **MP4** outputs, add **`-tag:v hvc1`** on the video stream for **broad player/MOV-brand compatibility** with HEVC-in-MP4; placement consistent with FFmpeg best practice near other **`-c:v`**/stream options.
- **D-07:** Do **not** introduce raw user-tunable x265 filtergraphs; extra x265-only knobs (**`--fallback-video-preset`**, etc.) stay **out of scope** unless REQUIREMENTS add an ID.

### Typing & internal mode naming

- **D-08:** Rename **`RemuxVideoStreamMode`** discriminant **`"reencode-h264"`** → **`"reencode-hevc"`** (and update **all** call sites, tests, comments) so code matches **inspect** truth and avoids stale **H.264** implications.
- **D-09:** **`clean.ts`** / planner wiring that selects re-encode mode MUST emit **`"reencode-hevc"`** for **`fallback-required`** with **`allowVideoFallback`**.

### Inspect, CLI text, and JSON truthfulness (**MULTI-08** / **MULTI-09** alignment)

- **D-10:** Any user-visible string that implies **“H.264 / libx264 video re-encode”** for **fallback** MUST be updated to **HEVC / H.265 / `libx265`** where it describes the **executed or planned** fallback recipe.
- **D-11:** **`--json`** fields that reference **video codec choice** for fallback MUST stay **consistent** with argv (**no claimed x264 while emitting x265**).

### Verification & tests

- **D-12:** Update **`test/domain/video-clean-argv.test.ts`** (and related) to assert **`libx265`**, **`-crf 28`**, **`-preset slow`**, **`hvc1`** (or argv order-safe checks), and **absence** of **`libx264`** on the fallback branch.
- **D-13:** Update **`test/app/clean.test.ts`** fallback execute test title + expectations from **x264** → **x265**.
- **D-14:** Extend **`verifyCleanOutput`** / canonical codec coverage per roadmap: **fixture or synthetic probe** proving **x265-encoded** outputs match **HEVC** canonical bucket (**`h265` / `hevc`** aliases per **Phase 04** verifier rules).

### Requirements traceability

- **D-15:** Add a **new `MULTI-*` row** (e.g. **`MULTI-13`**) in **`.planning/REQUIREMENTS.md`** + roadmap traceability for **x265-preferred fallback video re-encode** when **`/gsd-plan-phase`** runs — do not leave **“TBD”** through execution.

### Claude's Discretion

- **`slower`** / **`veryslow`** vs **`slow`** if benchmarks show **`slow`** is still not quality-competitive enough; **`medium`** only if a future requirement adds an explicit **speed-first** escape hatch.
- Whether a one-line **`doctor`** hint (“fallback uses HEVC — slower than AVC”) ships in **Phase 05** vs a follow-up micro-phase.
- Minimal **integration** encode sample (keep **deterministic** — prefer **mocked argv** + **targeted verify** over heavy binary round-trips unless PLAN finds a gap).

### Folded Todos

None (**`todo match-phase 05`** returned **0** matches).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone & scope

- `.planning/ROADMAP.md` — Phase **05** goal, success criteria, **codec preference** notes.
- `.planning/REQUIREMENTS.md` — **`MULTI-*`** table (add **fallback/x265** ID at plan time).
- `.planning/PROJECT.md` — v1.1 charter, **minimal recompression** / trust narrative.

### Prior phase locks (must not regress)

- `.planning/phases/03-ffmpeg-remux-muxers-audio-policy/03-CONTEXT.md` — mux **`-f`**, audio table, **MP4-only** fallback container.
- `.planning/phases/04-ux-verification-fixtures-regression/04-CONTEXT.md` — **`verifyCleanOutput`**, canonical codec aliases, **inspect** honesty.

### Implementation touchpoints

- `src/domain/video-clean-argv.ts` — **`buildRemuxVideoWithProcessedAudioCommand`**, **`RemuxVideoStreamMode`**.
- `src/app/clean.ts` — **`videoStreamMode`** selection for **`fallback-required`**.
- `src/domain/inspect-summary.ts`, `src/cli/render.ts` — preservation / summary strings.
- `src/domain/clean-output-verify.ts`, `src/domain/stream-copy-feasibility.ts` — codec canonicalization + verify.
- `test/domain/video-clean-argv.test.ts`, `test/app/clean.test.ts`, `test/domain/clean-output-verify.test.ts`

### External

- No external product spec — behavior is **repo requirements + FFmpeg** docs; cite **FFmpeg `libx265`** / **MP4 HEVC tagging** in **RESEARCH.md** if planner needs citations.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`buildRemuxVideoWithProcessedAudioCommand`** in `src/domain/video-clean-argv.ts` centralizes **copy vs re-encode** argv; single swap point for **`libx264` → `libx265`** + tags.

### Established Patterns

- **`RemuxVideoStreamMode`** discriminated union consumed from **`clean.ts`**; rename requires **mechanical** grep + test updates.
- **Phase 04** **`verifyCleanOutput`** / **`stream-copy-feasibility`** own **canonical codec names** — extend rather than duplicating alias tables.

### Integration Points

- **`runCleanRequest`** remux path (~lines 816–982 in `src/app/clean.ts`) sets **`videoStreamMode`** for **fallback-required**; must align with renamed mode and new argv.

</code_context>

<specifics>

## Specific Ideas

- Roadmap calls out **operator documentation** of **slower/heavier** fallback vs **x264** — surface briefly in **preserve notes** or **help** text if there is an obvious single insertion point.

</specifics>

<deferred>

## Deferred Ideas

- **Explicit `--fallback-video-codec` (x264 vs x265)** or **config file preference** — new capability; backlog unless REQUIREments add.
- **Non-MP4 video re-encode targets** (e.g. **VP9-in-WebM** fallback) — out of scope; matrix today funnels fallback to **MP4**.

### Reviewed Todos (not folded)

None.

</deferred>

---

*Phase: 05-x265-preferred-video-reencode*  
*Context gathered: 2026-05-03*
