# Doctor Command

`bun run doctor` reports local tool readiness for the future media pipeline without claiming Phase 1 has full media-processing capability checks.

## Required Tools

- `ffmpeg` is required. Phase 1 checks whether it is on `PATH` and captures one concise version line.
- `ffprobe` is required. Phase 1 checks whether it is on `PATH` and captures one concise version line.

If a required tool is missing or its lightweight version probe fails, `doctor` exits with `missingTools` (`3`).

## macOS: `install-tools`

On macOS, `bun run src/cli/main.ts install-tools` runs Homebrew to install **FFmpeg** (provides both `ffmpeg` and `ffprobe` on PATH). Use **`--with-optional`** to also install **SoX_ng**, **MLT** (`melt`), and the **Audacity** cask; the command then prints a **manual** hint for installing **Demucs** via `pip` (Demucs is not installed automatically). **`--dry-run`** prints the `brew` commands without executing them.

## Optional Tools

The following tools are optional warnings in Phase 1:

- `sox_ng`
- `sox`
- `demucs` (also probed as `python3 -m demucs` when the `demucs` binary is absent)
- `audacity`
- `melt`

Missing optional tools do not fail Phase 1 doctor. They are reported as warnings because later phases may use them for SoX cleanup, Demucs isolation, Audacity automation, or Kdenlive/MLT compatibility.

## FFmpeg `ladspa` filter

When `ffmpeg` is available, doctor runs `ffmpeg -hide_banner -filters` and records a separate capability row for the **`ladspa`** audio filter (TOOL-07 readiness). A **missing** row means this build cannot load LADSPA plugins through FFmpeg; headless **`clean --ladspa-*`** planning will fail with a message to run doctor.

User-supplied plugin binaries are not auto-discovered: set **`LADSPA_PATH`** (and pass an explicit plugin file path on the CLI) per your platform and FFmpeg build.

## Kdenlive / MLT (`melt`)

Optional **`melt`** is listed for future MLT/Kdenlive-style workflows. **TOOL-08:** the supported headless path for Kdenlive-derived style effects in this CLI is **FFmpeg-first** (native filters and the **`ladspa`** filter when present). If **`melt`** is absent, core **FFmpeg / SoX / Demucs** presets still run; doctor reports **`melt`** as an optional gap only.

## Audacity automation (`mod-script-pipe`)

Optional **Audacity** integration uses **`mod-script-pipe`** (disabled by default in Audacity; see the [Audacity scripting manual](https://manual.audacityteam.org/man/scripting.html)). You must enable the module and know the named pipe paths; override defaults with **`AUDACITY_PIPE_TO`** and **`AUDACITY_PIPE_FROM`** if needed.

**Security / responsibility:** `clean` only runs an Audacity macro when you pass **`--audacity-macro`** and **`--accept-audacity-pipe-risk`**. See the same Audacity documentation for security implications of enabling the pipe.

## Runtime Information

Doctor output includes target and current Bun runtime information:

- Target Bun: `1.3.13`
- Current Bun: reported from the local runtime at command execution time.

The runtime line is informational. Phase 1 avoids requiring Bun 1.3.13-only behavior.

## Capability Rows

Capability rows such as `not-checked-yet` are intentionally unverified in Phase 1 for some dimensions. They are reminders that PATH and version checks are not proof of deeper media readiness.

Examples of intentionally deferred or partial checks:

- Many individual FFmpeg filters (`afftdn`, `anlmdn`, …) remain `not-checked-yet`; **`ladspa`** is an exception when `-filters` is probed successfully.
- FFprobe JSON probe behavior
- SoX effect availability
- Demucs model cache and runtime behavior
- Audacity `mod-script-pipe` reachability beyond file existence (pipe protocol is exercised only when you run a macro step)
- MLT/Kdenlive render presets

## Command Behavior

- `bun run doctor` exits `0` when `ffmpeg` and `ffprobe` are available.
- `bun run doctor` exits `3` when required tools are missing.
- Missing optional tools emit warnings but do not fail Phase 1 doctor.
- `bun run src/cli/main.ts --unknown` exits `2`.
