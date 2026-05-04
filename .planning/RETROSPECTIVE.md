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

## Milestone: v1.1 — Multi-container stream copy

**Shipped:** 2026-05-04  
**Scale:** **9** phase directories · **16** executed plans (**01–05** delivery + **06–09** gap closure)

### What shipped

- Typed **planned output containers** (**MP4** / **Matroska** / **WebM**) with aligned default output paths (**MULTI-01**, **MULTI-02**).
- **Feasibility matrix** in prelude: VP9/WebM copy-safe pairing, Theora/Matroska, explicit fallback tokens (**MULTI-03**–**MULTI-05**); requirements reconciled so **VP9+Matroska** stays explicitly deferred.
- Remux argv builders with mux **`‑f`**, AAC/Opus policy, consistent intermediate audio basenames (**MULTI-06**, **MULTI-07**).
- Inspect / JSON honesty, **`verifyCleanOutput`** (including **HEVC** check after **`libx265`** fallback), fixtures, MULTI-12 regressions (**MULTI-08**–**MULTI-13**).

### What worked

- **Dedicated gap phases 06–09** mirrored audit findings into verification markdown and traceability without renumbering shipped feature phases.
- **Pure domain tests** (`argv` snapshots, ffprobe fixtures) kept WebM/Matroska coverage offline.

### What was inefficient

- First **milestone audit** surfaced missing **VERIFICATION** artifacts for phases **04/05** and a verifier gap on fallback video — corrected in Phase **09**, but earlier co-location of verification with feature phases would reduce audit churn.

### Patterns to keep

- **Stable reason tokens** on every feasibility branch — prevents silent optimism when matrix and docs disagree.

### Key lessons

1. When requirements allow **either** widening code **or** narrowing text, prefer **narrowing + tests** unless the wider behavior is explicitly product-critical.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Approx. phases | Note |
|-----------|----------------|------|
| v1.0 | 17 | First archive under `.planning/milestones/` |
| v1.1 | 9 | Numbering reset **01–05** + closure **06–09** |

### Cumulative quality

| Milestone | Verification gate |
|-----------|-------------------|
| v1.0 | `bun run verify` (Biome + `tsc --noEmit` + `bun test`) green at archive |
| v1.1 | Same — **226** tests green at archive; formal **`*-VERIFICATION.md`** per primary phase + Phase **09** rollup |
