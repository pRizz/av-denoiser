# Exit Codes

`av-denoiser` maps command outcomes to stable exit-code names so shell scripts can distinguish user-fixable input, missing tools, planning failures, processing failures, and fallback decisions.

| Name | Value | Meaning |
| --- | ---: | --- |
| success | 0 | The command completed successfully. |
| internalError | 1 | The CLI hit an unexpected internal error. |
| invalidInput | 2 | CLI syntax, flags, config, or request input was invalid. |
| missingTools | 3 | A required external tool or required capability is missing. |
| planningFailure | 4 | Valid inputs could not produce a safe processing plan. |
| processingFailure | 5 | External processing or local filesystem work failed. |
| fallbackRequired | 6 | The plan needs video re-encoding or another step that requires explicit approval (e.g. pass `--allow-video-fallback` when stream-copy is not possible). |

## Current Phase Behavior

- `bun run cli` prints default guidance and exits with `success` (`0`).
- `bun run doctor` exits with `success` (`0`) when required tools are available.
- `bun run doctor` exits with `missingTools` (`3`) when required tools such as `ffmpeg` or `ffprobe` are missing or fail their lightweight version checks.
- `bun run src/cli/main.ts --unknown` exits with `invalidInput` (`2`).

Future media phases will reuse the same names for planning, processing, and fallback outcomes instead of introducing ad hoc numeric exits.
