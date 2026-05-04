# Changelog

## Unreleased

### Added

- Guided denoise spinner shows **live elapsed time** for the current phase (including long SoX/Demucs steps), with a periodic refresh.
- Successful **`denoise`** runs attach **`maybeExecutionTiming`** (per-phase durations and total wall time). Guided mode appends a **Timing** section to the session summary; **`denoise --json`** includes an **`executionTiming`** field when present.

### Breaking

- The CLI subcommand **`clean`** has been renamed to **`denoise`**. There is no compatibility alias; scripts and docs must use **`denoise`**.
- Request kinds **`"clean"`** / **`"guided-clean"`** are now **`"denoise"`** / **`"guided-denoise"`**. Programmatic integrations should update `CliRequest` discriminants and `CliCommandOutcome.denoise` (replacing the former `clean` field) accordingly.
