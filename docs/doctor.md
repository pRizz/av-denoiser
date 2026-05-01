# Doctor Command

`bun run doctor` reports local tool readiness for the future media pipeline without claiming Phase 1 has full media-processing capability checks.

## Required Tools

- `ffmpeg` is required. Phase 1 checks whether it is on `PATH` and captures one concise version line.
- `ffprobe` is required. Phase 1 checks whether it is on `PATH` and captures one concise version line.

If a required tool is missing or its lightweight version probe fails, `doctor` exits with `missingTools` (`3`).

## Optional Tools

The following tools are optional warnings in Phase 1:

- `sox_ng`
- `sox`
- `demucs`
- `audacity`
- `melt`

Missing optional tools do not fail Phase 1 doctor. They are reported as warnings because later phases may use them for SoX cleanup, Demucs isolation, Audacity automation, or Kdenlive/MLT compatibility.

## Runtime Information

Doctor output includes target and current Bun runtime information:

- Target Bun: `1.3.13`
- Current Bun: reported from the local runtime at command execution time.

The runtime line is informational. Phase 1 avoids requiring Bun 1.3.13-only behavior.

## Capability Rows

Capability rows such as `not-checked-yet` are intentionally unverified in Phase 1. They are reminders that PATH and version checks are not proof of deeper media readiness.

Examples of intentionally deferred checks:

- FFmpeg filters such as `afftdn`, `anlmdn`, `arnndn`, and `ladspa`
- FFprobe JSON probe behavior
- SoX effect availability
- Demucs model cache and runtime behavior
- Audacity `mod-script-pipe` availability
- MLT/Kdenlive render presets

## Command Behavior

- `bun run doctor` exits `0` when `ffmpeg` and `ffprobe` are available.
- `bun run doctor` exits `3` when required tools are missing.
- Missing optional tools emit warnings but do not fail Phase 1 doctor.
- `bun run src/cli/main.ts --unknown` exits `2`.
