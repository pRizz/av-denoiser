# av-denoiser

## What This Is

`av-denoiser` is a simple TypeScript/Bun-based CLI for cleaning noisy audio in audio or video files. It accepts a media file, runs the source audio through a configurable sequence of free and open source denoise/cleanup tools, and writes a cleaned output file while preserving the video stream whenever possible.

The first version should feel friendly and guided: users can run an interactive workflow without learning flags, while power users can still use CLI options and batch processing for repeatable jobs. It is intended for general-purpose local media cleanup, creator workflows such as podcasts, videos, lectures, and interviews, and optional batch processing across many recordings.

## Core Value

Users can pass an audio or video file through a guided denoise pipeline and get a cleaned output while avoiding video recompression whenever possible.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] User can install and run a Bun-based TypeScript CLI locally.
- [ ] User can pass an audio file as input and receive a cleaned audio output file.
- [ ] User can pass a video file as input and receive a video output with cleaned audio.
- [ ] User can use a friendly guided interactive workflow without memorizing CLI flags.
- [ ] Power user can use CLI flags for non-interactive and repeatable workflows.
- [ ] User can process multiple files in a batch mode.
- [ ] User can choose from simple recommended cleanup presets.
- [ ] User can enable, disable, and configure pipeline steps behind those presets at a practical v1 level.
- [ ] Pipeline can run sequential processing steps over extracted source audio and feed each step into the next.
- [ ] Pipeline supports FFmpeg as the core media extraction/remuxing engine and filter surface.
- [ ] Pipeline supports SoX for baseline scripted cleanup.
- [ ] Pipeline supports Demucs for voice/source isolation.
- [ ] Pipeline supports Audacity automation for workflows that benefit from its noise reduction and macro ecosystem.
- [ ] Pipeline accounts for Kdenlive/FFmpeg/LADSPA-style cleanup options without making Kdenlive a mandatory runtime dependency unless research confirms a practical CLI integration path.
- [ ] Video outputs preserve the original video stream without recompression whenever the input container and output format allow it.
- [ ] Tool reports clearly when a requested no-video-recompression path is impossible and explains the fallback.

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- GUI application — the product is a CLI-first workflow.
- Cloud processing service — local processing keeps the tool simple, private, and dependency-light for v1.
- Proprietary or paid denoise engines — the initial pipeline should use free and open source tools.
- Full video editing timeline — the tool modifies or replaces audio tracks, not arbitrary video edits.
- Perfect one-size-fits-all cleanup — different recordings need different tradeoffs, so v1 should expose guided presets and clear fallbacks.

## Context

The user wants a simple TypeScript/Bun CLI that can accept a video or audio file and output the same kind of media with cleaned audio. The denoise process should be a configurable sequential pipeline of free and open source tools that users can enable, disable, and tune.

Important background tools and likely roles:

- **FFmpeg**: Core media engine for probing, extracting audio, applying built-in filters, preserving video streams, and remuxing cleaned audio back into video containers.
- **SoX**: Classic efficient command-line audio processor for baseline noise reduction, normalization, and scripted batch cleanup.
- **Demucs**: AI-based source separation tool from the Meta AI ecosystem. The original repository was archived in 2025, but it remains usable and has active community forks and ports. Useful for voice isolation in noisy environments.
- **Audacity**: Long-standing open source audio editor with noise reduction, spectral editing, batch macros, and possible automation through mod-script-pipe. Useful for compatibility with existing cleanup workflows, but integration complexity needs research.
- **Kdenlive**: Open source video editor with access to FFmpeg/LADSPA-style audio filters. It may inform filter choices or workflows, but direct CLI integration should be validated before becoming a required v1 dependency.

The desired "best of both worlds" direction is a pipeline such as SoX or Audacity baseline noise reduction followed by Demucs voice isolation for stronger cleanup in noisy conference, lecture, or interview recordings.

The product should be approachable for non-flag users. The ideal first-run experience is guided and interactive, with recommended presets/options. Flags still matter for automation, repeatability, and batch jobs.

## Constraints

- **Tech stack**: TypeScript on Bun — this is the preferred runtime and package/script surface for the CLI.
- **Tooling**: Use free and open source processing tools — no proprietary or paid denoise engines for v1.
- **Media integrity**: Avoid video recompression whenever possible — video streams should usually be copied/remuxed while only the audio track changes.
- **UX**: Friendly guided workflow first — users should not need to learn flags before getting value.
- **Power users**: CLI flags and batch mode are still required — automation and repeatability are part of the product.
- **Pipeline model**: Sequential processing — each enabled tool step consumes the previous step's output and produces the next intermediate artifact.
- **Dependency risk**: Demucs and Audacity/Kdenlive integrations need research — availability, install friction, and scriptability may vary by platform.
- **Cross-platform expectations**: v1 should avoid unnecessary OS-specific assumptions where practical, but exact platform support needs research.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build as a Bun-based TypeScript CLI | Matches the user's requested stack and Bright Builds TypeScript guidance for new standalone TS projects. | — Pending |
| Treat audio and video inputs as v1 table stakes | The tool should be useful for both media types from the start. | — Pending |
| Optimize video/container integrity first | The user explicitly prioritized avoiding video recompression and only modifying the audio track when possible. | — Pending |
| Provide guided interactive flows plus flags | Friendly defaults help casual users; flags preserve power-user and batch workflows. | — Pending |
| Start with recommended presets rather than a fully open-ended config language | Keeps v1 approachable while leaving room for deeper pipeline configuration later. | — Pending |
| Research Kdenlive as optional/informational before requiring it | Kdenlive may not be a clean CLI dependency for this use case; FFmpeg/LADSPA capabilities may cover the same value. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-01 after initialization*
