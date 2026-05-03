# Project Retrospective

*Living doc — append milestones as they ship. Cross-milestone metrics stay directional.*

## Milestone: v1.0 — CLI & v1 requirements

**Shipped:** 2026-05-03  
**Scale:** **17** phase directories · **37** executed plans (GSD `milestone complete` counters)

### What shipped

- **Single CLI spine** (`runCliRequest`) for inspect, clean, guided-clean, batch, tooling install, and doctor.
- **Planner-first semantics** (`planMediaOutput`) before spawning FFmpeg keeps the avoid–video-recompression promise grounded in probe facts.
- **Optional heavy stack** (Demucs, Audacity scripting, FFmpeg ladspa): failure modes surfaced via doctor/readiness facts and mocked integration tests.

### What worked

- **Pure domain + argv snapshots** unlocked fast iterative tests without local GPU Demucs installs.
- **Gap phases (9–17)** separated verification debt / requirements governance from core feature merges.
- **Pointer verification stubs** (Phase **17**) gave per-roadmap-row discoverability without symlinks.

### What was inefficient

- Late **verification artifact** authoring (**9–12**) clustered after implementation — earlier co-authoring reduces thrash.
- **REQUIREMENTS ↔ ROADMAP ↔ SUMMARY** drift required Phase **15–16** reconciliation passes.

### Patterns to keep

- **Parse-at-boundaries** (CLI → typed requests → typed FFmpeg plans).
- **Argv-only** `Bun.spawn` invariant via `ProcessRunner` test doubles.

### Key lessons

1. Lock **semantic integration contracts** early (TOOL-07: ladspa runnable vs melt diagnostics only).
2. **Batch manifest doctor facts** (**BATCH-05**) proved worth shipping in MVP for reproducibility.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Approx. phases | Note |
|-----------|----------------|------|
| v1.0 | 17 | First archive under `.planning/milestones/` |

### Cumulative quality

| Milestone | Verification gate |
|-----------|-------------------|
| v1.0 | `bun run verify` (Biome + `tsc --noEmit` + `bun test`) green at archive |
