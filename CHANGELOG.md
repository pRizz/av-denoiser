# Changelog

## Unreleased

### Breaking

- The CLI subcommand **`clean`** has been renamed to **`denoise`**. There is no compatibility alias; scripts and docs must use **`denoise`**.
- Request kinds **`"clean"`** / **`"guided-clean"`** are now **`"denoise"`** / **`"guided-denoise"`**. Programmatic integrations should update `CliRequest` discriminants and `CliCommandOutcome.denoise` (replacing the former `clean` field) accordingly.
