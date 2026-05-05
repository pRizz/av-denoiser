# Changelog

## Unreleased

### Added

- Guided denoise spinner shows **live elapsed time** for the current phase (including long SoX/Demucs steps), with a periodic refresh.
- Successful **`denoise`** runs attach **`maybeExecutionTiming`** (per-phase durations and total wall time). Guided mode appends a **Timing** section to the session summary; **`denoise --json`** includes an **`executionTiming`** field when present.
- **`doctor`** reports a **`demucs.torchcodec`** capability by running **`import torchcodec`** in the Python used by Demucs (from the **`demucs`** shebang or **`python3 -m demucs`**).
- **`install-tools`** (macOS, full tier): after Demucs is on PATH, probes TorchCodec and, with **`--yes`** or an interactive confirm, can run **`uv pip install --python … torchcodec`** when the import fails.
- Guided **denoise** shows a short Demucs / TorchCodec note when **`speech-vocals-demucs`** is selected.

### Fixed

- **Demucs** invocations set **`TQDM_DISABLE=1`** so piped runs do not flood stderr with tqdm progress bars (which hid real errors in truncated CLI output). Failure messages use **`formatDemucsFailureSnippet`** to drop progress noise, prefer tracebacks, and include a **stdout** tail when useful.
- **`runProcessCommand`** merges **`command.env`** with the parent environment so tools keep **`PATH`** and other inherited variables when overrides are set.

### Breaking

- The CLI subcommand **`clean`** has been renamed to **`denoise`**. There is no compatibility alias; scripts and docs must use **`denoise`**.
- Request kinds **`"clean"`** / **`"guided-clean"`** are now **`"denoise"`** / **`"guided-denoise"`**. Programmatic integrations should update `CliRequest` discriminants and `CliCommandOutcome.denoise` (replacing the former `clean` field) accordingly.
