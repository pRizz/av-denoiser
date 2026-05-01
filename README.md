# av-denoiser

<!-- bright-builds-rules-readme-badges:begin -->

<!-- Managed upstream by bright-builds-rules. If this badge block needs a fix, open an upstream PR or issue instead of editing the downstream managed block. Keep repo-local README content outside this managed badge block. -->

[![GitHub Stars](https://img.shields.io/github/stars/pRizz/av-denoiser)](https://github.com/pRizz/av-denoiser)
[![License](https://img.shields.io/github/license/pRizz/av-denoiser?style=flat-square)](./LICENSE)
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

Run **`bun run verify`** locally or in CI as the aggregate gate: Biome checks, TypeScript `tsc --noEmit`, and the full `bun test` suite (including parser, domain, CLI, and adapter tests).
