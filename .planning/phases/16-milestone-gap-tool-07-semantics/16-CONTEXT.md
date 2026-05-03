---
generated_by: gsd-discuss-phase
lifecycle_mode: yolo
phase_lifecycle_id: 16-2026-05-03T13-55-45Z
generated_at: "2026-05-03T13:55:45.000Z"
---

# Phase 16: Milestone Gap — TOOL-07 semantics & verification — Context

**Gathered:** 2026-05-03
**Status:** Complete (execution landed); this yolo discuss retro-documents decisions for audit trail
**Mode:** Yolo

<domain>

## Phase Boundary

Close **`gaps.integration`** / **REQ semantics** for **TOOL-07** without adding new runnable **`melt`** orchestration: align human requirements, **Phase 08** verification prose, roadmap success language, and milestone audit narrative with the shipped **FFmpeg `ladspa`** path and **doctor-only `melt`** visibility.

</domain>

<decisions>

## Implementation Decisions

### Requirement semantics (**TOOL-07**)

- **D-01:** **TOOL-07** satisfies user value through a **Runnable FFmpeg `ladspa` filter step** (`--ladspa-plugin-path`, `--ladspa-label`, optional `--ladspa-controls`) when FFmpeg exposes **`ladspa`**; this is the **Kdenlive/MLT–derived headless** path for v1.
- **D-02:** **`melt`** remains **discovery / doctor diagnostics only** (`melt -version` probe); **no** sequential **`melt` cleanup step** in the CLI pipeline unless a **future phase** explicitly adds one.
- **D-03:** **TOOL-08** remains the graceful-degradation umbrella when **`ladspa`**, plugins, or **`melt`** facts are insufficient.

### Documentation & verification

- **D-04:** Authoritative alignment lives in **`.planning/REQUIREMENTS.md`**, **`.planning/phases/08-optional-heavy-editor-integrations/08-VERIFICATION.md`** (roadmap success row **#5** + **TOOL-07** row), **`.planning/ROADMAP.md`**, and **`.planning/v1.0-MILESTONE-AUDIT.md`** appendix — not a separate phase-local **`*-VERIFICATION.md`** for gap dir **16**.

### Future work

- **D-05:** Any **opt-in `melt`/`ffmpeg` bridge** or **MLT project render** path is **explicitly deferred** — new roadmap phase + plan if product revives it.

### Claude's Discretion

- Wording polish inside tables (bold vs plain) as long as **FFmpeg ladspa** + **without orchestrating melt** semantics stay verbatim-traceable to **REQUIREMENTS.md**.
- **`08-VERIFICATION`** frontmatter **`verified`** timestamps when re-audit touch-ups occur — use executor wall-clock ISO.

### Folded Todos

- None — discuss-only capture after execution.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning & requirements

- `.planning/ROADMAP.md` — Phase **8** goal / success **#5**; Phase **16** gap closure scope
- `.planning/REQUIREMENTS.md` — **TOOL-07**, **TOOL-08** checklist lines
- `.planning/v1.0-MILESTONE-AUDIT.md` — Historical **`gaps.integration`** framing + Phase **16** resolution

### Verification artifact

- `.planning/phases/08-optional-heavy-editor-integrations/08-VERIFICATION.md` — Canonical Phase **8** evidence tables for **TOOL-03**–**TOOL-08**

### Product / operator docs

- `docs/doctor.md` — **`melt`/`ladspa`** install friction and **TOOL-08** posture

### Code (reference — no Phase **16** code changes by default)

- `src/domain/audio-pipeline-argv.ts` — **`ladspa-apply`** argv construction
- `src/domain/audio-pipeline-plan.ts` — **`parseLadspaCliTriple`**, integration ordering
- `src/adapters/tool-discovery.ts` — **`melt`** + **`probeFfmpegLadspaFilter`**
- `src/app/doctor.ts` — optional facts surfacing

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable assets

- **FFmpeg `ladspa` pipeline step** (`ladspa-apply`) is already the integration surface matching narrowed **TOOL-07**.

### Established patterns

- **FFmpeg-first** optional heavy tools (**STACK**): **`melt`** informative only at v1.

### Integration points

- CLI **`clean`** / **`guided-clean`** **`--ladspa-*`** wiring; **`doctor`** reports feed planning and **TOOL-08** diagnostics.

</code_context>

<specifics>

## Specific Ideas

- None beyond audit closure — execution already matched **narrowed-requirement** path documented in **`16-RESEARCH.md`** and **`16-01-SUMMARY.md`**.

</specifics>

<deferred>

## Deferred Ideas

- **Runnable `melt`** (`.mlt` render or **MLT**-native cleanup step) as an explicit opt-in phase.
- **Homebrew / `sox_ng` vs `melt`** packaging conflicts — document-only in **`docs/doctor.md`** until a bridge phase exists.

### Reviewed Todos (not folded)

- None

</deferred>

---

*Phase: 16-milestone-gap-tool-07-semantics*
*Context gathered: 2026-05-03 (yolo)*
