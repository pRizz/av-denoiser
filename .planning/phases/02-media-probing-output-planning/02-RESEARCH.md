# Phase 2 Research: Media Probing & Output Planning

**Phase:** 2 — Media Probing & Output Planning  
**Question:** What do we need to know to plan structured FFprobe ingestion and deterministic output planning in a Bun/Zod CLI?

## FFprobe JSON contract

- **Invocation:** `ffprobe -v error -print_format json -show_format -show_streams <input>` (argv array; path as single argument). Matches Phase 1 `ProcessCommand` model (D-03).
- **Stability:** Top-level keys are typically `format` and `streams` (array). Individual streams expose `index`, `codec_type`, `codec_name`, `disposition`, optional `channels`, `sample_rate`, `tags`, etc. Some fields are absent depending on container and FFmpeg build.
- **Parsing strategy:** Model only fields required for Phase 2 decisions (audio stream selection, video presence, duration hints). Use Zod `.strict()` or explicit pick pipelines on subtrees to avoid silently accepting garbage, while marking genuinely optional FFmpeg fields optional in schema — aligns with CONTEXT D-01/D-02.

## Domain layering

- **Functional core:** `parseFfprobeJson(string): Result<MediaProbe, ParseError>` and pure `planOutput(probe, pathPlan, defaults): OutputPlan` with tagged unions for modality (D-07).
- **Imperative shell:** Adapter that builds `ProcessCommand`, runs process runner, feeds stdout into parser. Keeps Bun.spawn out of domain.

## Output path safety

- Resolve paths with `path.resolve` from cwd for consistency; compare canonical paths to detect “output equals input” (D-05).
- Collision detection: `Bun.file(outputPath).exists()` or Node `fs` equivalent before accepting plan; require `force` flag on CLI for overwrite (D-04).
- Default naming: `<stem>.avdn.<ext>` or `<stem>.clean.<ext>` — document one convention in domain constants for predictability (D-06).

## Modality classification (preview before Phase 3)

Phase 2 only needs **planning-time** labels that Phase 3 will refine with fallback UX:

- **audio-only:** Input has no video stream and user targets audio container / extraction semantics.
- **video-copy-safe:** At least one video stream exists and planned operation intends copy-first remux (actual FFmpeg graph deferred).
- **fallback-required:** Container/codec combination implies video cannot be copied as-is (stub rules acceptable if documented as minimal v1 heuristics).
- **unsupported:** No audio stream, probe parse failure, or explicit unsupported container.

CONTEXT allows minimal heuristics for Phase 2 as long as reasons are machine-readable.

## Default audio stream selection

- Prefer stream with `disposition.default === 1`; else first audio stream; tie-breaker: highest `channels` if multiple (D-10). Document order in pure function comments.

## Explicit codec / container defaults (VIDEO-05)

- Represent planned delivery codec as small closed enums (e.g. `aac` | `opus` | `pcm_s16le` for intermediates later) plus container enum (`mp4` | `matroska` | `wav` …) with documented defaults independent of FFmpeg CLI defaults text (D-09).

## Doctor integration

- Optional follow-up: mark `ffprobe.json-output` capability as checked when probe succeeds once; not blocking for Phase 2 plan execution if CONTEXT defers doctor polish.

## Validation Architecture

**Dimension 8 — Plan-time verification hooks**

- Fixture JSON files under `test/fixtures/ffprobe/` for minimal audio-only and video+audio containers.
- Tests must assert parser + planner outputs without requiring real FFmpeg in CI (inject `runProcess` stubs).
- One optional integration test marked skipped or behind env flag if maintainers want local FFmpeg smoke — not required for Nyquist-off config.

---

## RESEARCH COMPLETE

Research covers FFprobe invocation shape, Zod boundary parsing, path safety, modality unions, stream selection, and test strategy consistent with Phase 1 trust boundaries.
