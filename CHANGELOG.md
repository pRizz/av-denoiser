# Changelog

## Unreleased

### Added

- Guided denoise spinner shows **live elapsed time** for the current phase (including long SoX/Demucs steps), with a periodic refresh.
- Successful **`denoise`** runs attach **`maybeExecutionTiming`** (per-phase durations and total wall time). Guided mode appends a **Timing** section to the session summary; **`denoise --json`** includes an **`executionTiming`** field when present.

### Fixed

- **Demucs** invocations set **`TQDM_DISABLE=1`** so piped runs do not flood stderr with tqdm progress bars (which hid real errors in truncated CLI output). Failure messages use **`formatDemucsFailureSnippet`** to drop progress noise, prefer tracebacks, and include a **stdout** tail when useful.
- **`runProcessCommand`** merges **`command.env`** with the parent environment so tools keep **`PATH`** and other inherited variables when overrides are set.

### Breaking

- The CLI subcommand **`clean`** has been renamed to **`denoise`**. There is no compatibility alias; scripts and docs must use **`denoise`**.
- Request kinds **`"clean"`** / **`"guided-clean"`** are now **`"denoise"`** / **`"guided-denoise"`**. Programmatic integrations should update `CliRequest` discriminants and `CliCommandOutcome.denoise` (replacing the former `clean` field) accordingly.
