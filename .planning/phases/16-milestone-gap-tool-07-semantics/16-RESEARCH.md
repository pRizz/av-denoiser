---
generated_by: gsd-phase-researcher
phase_lifecycle_id: 16-2026-05-03T00-00-00Z
generated_at: "2026-05-03T15:00:00.000Z"
---

# Phase 16 Research — TOOL-07 semantics & verification

<objective>

Answer: What do we need to know to PLAN explicit closure of `gaps.integration` / REQ semantics for **TOOL-07**?

</objective>

## Findings

### Product reality (code)

| Surface | Behavior |
|---------|----------|
| **Runnable path** | **FFmpeg `ladspa`** step is implemented end-to-end: CLI flags **`--ladspa-plugin-path`** / **`--ladspa-label`** / **`--ladspa-controls`** (optional), **`parseLadspaCliTriple`** validation, **`ladspa-apply`** logical step → **`buildLogicalStepCommand`** in `src/domain/audio-pipeline-argv.ts`, **`runSequentialPipeline`** in `src/app/clean.ts`. Guided parity in `src/app/guided-clean.ts`, **`argvTokensForEquivalentClean`** in `src/domain/guided-clean-equivalent.ts`. |
| **`melt`** | **`tool-discovery`** + **doctor** run **`melt -version`** and surface optional facts (**no** orchestrated **`melt` cleanup** step in pipeline). Matches **STACK**/project guidance: FFmpeg-first; MLT/`melt` as optional ecosystem signal. |
| **Diagnostics** | **TOOL-08** covered by degraded paths when LADSPA triple incomplete or FFmpeg lacks `ladspa` filter (`docs/doctor.md`, planning failures per `clean`). |

### Document tension (audit)

[v1.0-MILESTONE-AUDIT](../../v1.0-MILESTONE-AUDIT.md) **`gaps.integration`**: REQ **TOOL-07** wording reads like users “run” a **Kdenlive/MLT** integration when practical; shipped code runs **FFmpeg LADSPA** + **melt diagnostics** only.

[08-VERIFICATION.md](../08-optional-heavy-editor-integrations/08-VERIFICATION.md) verifies success criterion **#5** and **TOOL-07** against **discovery + FFmpeg LADSPA** — materially correct for implementation, but the **quoted success-criterion prose** still uses the broader “run Kdenlive/MLT … integration” wording from historical ROADMAP text.

[Roadmap Phase 16](../../ROADMAP.md) scopes **narrowed REQ + verification/doc alignment** *or* a future **opt-in runnable `melt`/`ffmpeg` bridge**.

### Recommendation (plan default)

Choose **narrowed requirement + artifact alignment**:

1. **Rewrite `REQUIREMENTS.md` TOOL-07** one-liner so “run … integration” explicitly means **headless FFmpeg `ladspa`** with validated plugin triple **when **`ladspa`** is available**, plus **doctor** visibility for **`ladspa`** and **`melt` probe**, **without claiming `melt` orchestration**.
2. **Update `08-VERIFICATION.md`** success-criterion row **5** + **TOOL-07** proof row wording to mirror that semantics (symbols unchanged).
3. **Sync ROADMAP** Phase **8** success criterion **5** (canonical planning text), Phase **16** checklist + Progress table + overview bullet, Requirement Coverage notes for TOOL-07.
4. **Append resolution note** to `v1.0-MILESTONE-AUDIT.md` body linking Phase **16** (avoid silent stale “Residual TOOL-07” prose without follow-up marker).

**Defer** optional **`melt` render/cleanup bridge** unless product explicitly reallocates engineering (install friction, quoting, temporal workflow, HOMEbrew/sox conflicts per `docs/doctor.md`).

## Validation Architecture

Not applicable (`workflow.nyquist_validation` disabled for this project).

---

## RESEARCH COMPLETE
