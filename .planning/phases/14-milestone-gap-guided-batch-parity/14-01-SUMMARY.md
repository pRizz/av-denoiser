---
phase: 14-milestone-gap-guided-batch-parity
plan: "01"
subsystem: cli
tags:
  - guided
  - clean
  - ladspa
  - audacity
  - demucs

requirements-completed:
  - CLI-04
  - UX-01
  - UX-02
  - UX-03
  - UX-04
  - UX-05

generated_by: gsd-execute-plan
lifecycle_mode: yolo
phase_lifecycle_id: 14-2026-05-02T12-29-42
generated_at: "2026-05-02T19:15:00.000Z"

completed: "2026-05-02"
---

# Phase 14 Summary — Plan 01

Guided **`clean`** now mirrors **`clean`** optional integrations: **`speech-vocals-demucs`** preset option, Audacity macro + **`mod-script-pipe`** risk **`confirm`**, LADSPA triple prompts validated via **`parseLadspaCliTriple`**, **`argvTokensForEquivalentClean`** emits matching **`--accept-audacity-pipe-risk`** / **`--audacity-macro`** / **`--ladspa-*`** tokens, and **`parseCliRequest`** round-trip tests cover the integration bundle.

## Files

- **`src/domain/guided-clean-selection.ts`** — **`acceptAudacityPipeRisk`**, **`maybeAudacityMacro`**, **`maybeLadspa`**.
- **`src/domain/guided-clean-equivalent.ts`** — argv tokens after **`--noise-strength`**.
- **`src/app/guided-clean.ts`** — **`selectionsToCleanRunInput`** parity + **`defaultCollectSelections`** optional-tool flow.
- **`test/domain/guided-clean-equivalent.test.ts`**, **`test/cli/command.test.ts`**, **`test/app/guided-clean.test.ts`**.

## Self-check

- **`bun run verify`** exited **0**.
