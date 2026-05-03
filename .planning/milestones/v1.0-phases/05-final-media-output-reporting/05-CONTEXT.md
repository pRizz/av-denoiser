---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 05-2026-05-02T00-46-42
generated_at: 2026-05-02T00:46:42.585Z
---

# Phase 5: Final Media Output & Reporting - Context

**Gathered:** 2026-05-02
**Status:** Completed on roadmap (2026-05-01); context refreshed via yolo reopen — decisions unchanged, code pointers aligned to landed implementation
**Mode:** Yolo

<domain>
## Phase Boundary

Phase 5 delivers **MEDIA-02**, **VIDEO-04**, **TOOL-01**, **TRUST-02**, and **TRUST-03**: users can pass a **single video (or audio)** file through the **FFmpeg/FFprobe core path** and receive a **final output** whose **video stream is copied when the plan says it is safe**, with **cleaned or processed audio**, plus a **human-readable final report** and **post-run verification** (existence, probe validity, duration sanity, video-copy confirmation).

Scope stays **single-file**, **sequential pipeline** consistent with Phase 4 — no batch manifests (**Phase 7**), no guided wizard parity (**Phase 6**), no Demucs/Audacity/Kdenlive execution (**Phase 8**). Phase 5 **implements** the remux and reporting that Phase 4 explicitly deferred for non–audio-only modalities.

</domain>

<decisions>
## Implementation Decisions

### Video + audio orchestration (MEDIA-02, TOOL-01)

- **D-01:** **Reuse** the existing **probe → `planMediaOutput` → preset expansion → sequential step runner** model from Phase 4. For **`video-copy-safe`** (and **`fallback-required`** only when user policy allows, mirroring **`inspect` / `--allow-video-fallback`**), orchestrate: **extract chosen primary audio** to a **PCM-oriented intermediate** (same default bias as Phase 4: WAV / s16le family), **run the same logical pipeline steps** as audio-only clean, then **remux** with **`-c:v copy`** when the plan guarantees stream-copy-first behavior; **encode/replace audio** per **`OutputPlan` planned audio codec/container** (aligned with Phase 2/4 — no silent FFmpeg defaults contradicting the plan).
- **D-02:** **`clean`** **accepts modalities that Phase 4 rejected**: lift the hard **`audio-only`** gate while preserving **explicit errors** for **`unsupported`** inputs — **single entry point** with modality-driven branching (no mandatory sibling subcommand).
- **D-03:** **Temp workspace** for intermediates follows Phase 4 bias: **cleanup on success**, **retain on failure** optional later; paths must not collide with user output rules from **`resolveOutputPath`**.

### Final report (VIDEO-04, TRUST-02)

- **D-04:** Introduce a **typed run report** in the functional core (fields for **video copied vs re-encoded**, **audio codec**, **container**, **fallback reasons applied**, **non-primary streams omitted or preserved**, **effective preset**, **ordered steps executed**, **warnings**) and **render it to human-readable text** as the default CLI outcome for successful runs (and a concise failure summary on errors).
- **D-05:** **Machine-readable JSON report** for the full run (**AUTO-01**) stays **out of Phase 5** unless implementation cost is trivial — prefer **parity with existing `--json` plan summaries** where already present, but **do not block** Phase 5 on a new JSON schema; Phase 2 **`inspect --json`** remains the contract for **pre-run** modality.

### Logging and errors (TRUST-02)

- **D-06:** **Structured outcome + short message first**; attach **capped stderr excerpts** from the **failing step** (reuse **`MAX_CLEAN_STDERR_SNIPPET`-style** limits from Phase 4) so raw FFmpeg noise is **never** the only signal.
- **D-07:** **Verbosity** tiers: default summary-only on success; **`--verbose`** (or equivalent existing flag) may expand per-step diagnostics without dumping full tool logs by default.

### Post-run verification (TRUST-03)

- **D-08:** After successful write, **verify**: output file **exists** and is **non-empty**; **ffprobe JSON** parses; **duration** within tolerance **max(0.5% of input duration, 0.5 s)** — constants live in **`clean-output-verify.ts`** for planner/tests; for **stream-copy-safe** outcomes, **assert video stream semantics match copy intent** when copy is claimed (compare probe fields before/after as feasible).
- **D-09:** Verification failure maps to a **distinct processing-failure outcome** with **actionable text**, not a generic crash.

### Streams policy (narrow v1)

- **D-10:** **Primary video + single cleaned audio** mapping for Phase 5: **do not** promise full multi-track **MEDIA2-01** behavior — **additional audio tracks, subtitles, attachments** are **dropped by default** with **explicit report lines** listing what was omitted; defer richer stream matrices to v2.

### Claude's Discretion

- Exact **ffmpeg argv** for extract/remux edge cases (PCM conversion, `-shortest`, timestamp discontinuities) — **narrowed** where builders now encode the happy path; remaining edge cases stay adapter-local.
- Precise **which ffprobe fields** prove copy beyond baseline codec/index checks — lock in fixtures as regressions appear.

### Folded Todos

_None — `todo match-phase` returned no matches on this reopen._

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements

- `.planning/ROADMAP.md` — Phase 5 goal and success criteria (**MEDIA-02**, **VIDEO-04**, **TOOL-01**, **TRUST-02**, **TRUST-03**).
- `.planning/REQUIREMENTS.md` — Acceptance IDs above; **Out of Scope** (no raw filtergraph UX); **AUTO-01** deferred to v2 for full machine run reports.

### Prior phase contracts

- `.planning/phases/04-core-audio-pipeline-sox-cleanup/04-CONTEXT.md` — audio-only clean path, PCM intermediates, preset expansion, modality gate lifted in Phase 5.
- `.planning/phases/03-video-preservation-fallback-control/03-CONTEXT.md` — stream-copy vs fallback-required semantics and user approval flags.
- `.planning/phases/02-media-probing-output-planning/02-CONTEXT.md` — `MediaProbe`, `OutputPlan`, planned codec/container.
- `.planning/phases/01-bun-cli-foundation-trust-model/01-CONTEXT.md` — argv-only execution, exit taxonomy.

### Stack intent

- `.planning/research/STACK.md` — FFmpeg extraction/remux, probe JSON, stream copy posture.

### Implemented artifacts (Phase 5 reference)

- `src/domain/clean-run-report.ts` — `CleanRunReport`, dropped-stream labels, human-readable checklist renderer.
- `src/domain/clean-output-verify.ts` — duration tolerance constants, verification result taxonomy.
- `src/app/clean.ts` — orchestration wiring for video path, report assembly, verification hooks.

### Deferred / adjacent

- `.planning/REQUIREMENTS.md` — **CLI-04**, **UX-***, **BATCH-***, **TOOL-03+**, **MEDIA2-01** multi-track policies — not Phase 5 exit criteria unless explicitly pulled in above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/app/clean.ts` — `runCleanRequest`, modality handling, step execution, stderr mapping; **video path + report + verify** integrate here.
- `src/domain/clean-run-report.ts` — typed final report and **`renderCleanRunReportText`**.
- `src/domain/clean-output-verify.ts` — **`durationVerificationToleranceSeconds`** and **`CleanVerifyResult`** outcomes.
- `src/domain/output-plan.ts`, `src/domain/output-path.ts` — planned outputs and collision-safe paths.
- `src/domain/audio-pipeline-plan.ts`, `src/domain/audio-pipeline-argv.ts` — preset expansion and argv builders for sequential steps.
- `src/adapters/ffprobe.ts`, `src/domain/media-probe.ts` — probe for pre/post verification.
- `src/adapters/process-runner.ts`, `src/domain/process-command.ts` — argv-only spawning.
- `src/app/inspect.ts` — probe/plan orchestration and **`allowVideoFallback`** policy mirrored for execute.

### Established Patterns

- **Functional core** emits summaries and commands; adapters run tools.
- **Phase 4** caps stderr snippets and separates **plan vs execute** — Phase 5 adds **remux + verify + richer report**.

### Integration Points

- CLI: `src/cli/command.ts`, `src/domain/cli-request.ts`, `src/cli/render.ts` — **`clean --allow-video-fallback`** and checklist-style terminal output aligned with **`VIDEO-04` / `TRUST-02`**.

</code_context>

<specifics>
## Specific Ideas

- Final report should read like a **flight checklist**: **Video: copied (h264)** · **Audio: AAC** · **Fallbacks: none** · **Dropped: subtitle stream #2** · **Verified: duration OK**.
- **Honest companion** tone from Phase 4 warnings carries into reporting — no green checkmarks that verification cannot support.

</specifics>

<deferred>
## Deferred Ideas

- **Batch manifests** and per-file JSONL (**Phase 7**, **AUTO-01** full schema).
- **Interactive guided flow** and copied equivalent flags (**Phase 6**).
- **Demucs / Audacity / MLT** paths (**Phase 8**).
- **Rich multi-track** remux policies (**MEDIA2-01**).

### Reviewed Todos (not folded)

_None._

</deferred>

---
*Phase: 05-final-media-output-reporting*
*Context gathered: 2026-05-02*
