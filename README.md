# av-denoiser

<!-- bright-builds-rules-readme-badges:begin -->

<!-- Managed upstream by bright-builds-rules. If this badge block needs a fix, open an upstream PR or issue instead of editing the downstream managed block. Keep repo-local README content outside this managed badge block. -->

[![GitHub Stars](https://img.shields.io/github/stars/pRizz/av-denoiser)](https://github.com/pRizz/av-denoiser)
[![License](https://img.shields.io/github/license/pRizz/av-denoiser?style=flat-square)](./LICENSE)
[![TypeScript 6.0.3](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bright Builds: Rules](https://raw.githubusercontent.com/bright-builds-llc/bright-builds-rules/main/public/badges/bright-builds-rules-flat.svg)](https://github.com/bright-builds-llc/bright-builds-rules)
[![OpenLinks profile](https://img.shields.io/badge/OpenLinks-profile-0F172A)](https://openlinks.us/)

<!-- bright-builds-rules-readme-badges:end -->

## Exit codes

The CLI maps outcomes to stable integers (see `src/domain/exit-codes.ts`):

| Name | Code | Meaning |
|------|------|---------|
| `success` | 0 | Command completed successfully. |
| `internalError` | 1 | Unexpected failure inside the CLI (bug or environment). |
| `invalidInput` | 2 | CLI usage error: unknown flags, bad arguments, or parse failures. |
| `missingTools` | 3 | Required external tools (for example FFmpeg/FFprobe) are absent or unusable. |
| `planningFailure` | 4 | The media plan could not be built from valid input. |
| `processingFailure` | 5 | A processing step failed after planning. |
| `fallbackRequired` | 6 | Continuing would need re-encoding or another fallback the user must approve. |

## Test fixtures

Short **audio** WAVs live under [`test/fixtures/audio/`](./test/fixtures/audio/). Short **video** samples (Commons sourced Theora/Vorbis **OGV** plus an **H.264** MP4 derivative) live under [`test/fixtures/video/`](./test/fixtures/video/); under the current stream-copy matrix the OGV probes as **video-copy-safe** **Matroska** output (AAC audio, copied video)—see [`test/fixtures/video/README.md`](./test/fixtures/video/README.md). Each folder has a README with licenses and regeneration commands.

When **`ffmpeg`** and **`ffprobe`** are on `PATH`, the suite runs [`test/app/clean-fixture-audio-integration.test.ts`](./test/app/clean-fixture-audio-integration.test.ts), which drives **`speech-hush-with-brown-noise-cc0.wav`** through a `speech-light` dry-run and a full encode; those tests **`skip`** if the binaries are absent.

Run **`bun run verify`** locally or in CI as the aggregate gate: Biome checks, TypeScript `tsc --noEmit`, and the full `bun test` suite (including parser, domain, CLI, adapter, and optional integration tests above).
