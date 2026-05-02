---
phase: 02
slug: media-probing-output-planning
status: verified
threats_open: 0
asvs_level: 1
created: "2026-05-02"
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| User media path → ffprobe argv | Path is one subprocess argv token (no shell interpolation). | Local filesystem paths |
| FFprobe stdout → Zod | Untrusted JSON → `MediaProbe` or typed parse errors. | Probe JSON |
| stderr / diagnostics | Diagnostic text only; local CLI stderr (no shared telemetry). | Error snippets |
| Path strings → canonical compare | `resolve`/`normalize` before equality checks for output planning. | Paths |
| Planned output → future writers | Phase 2 plans only; execution phases re-validate destinations. | Planned paths |
| argv → probe/plan | Paths flow through typed CLI → app layer only. | Paths |
| inspect `--json` stdout | Serialized inspect summary DTO only (no raw ffprobe blob flag). | Structured summary JSON |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation / evidence | Status |
|-----------|----------|-----------|-------------|----------------------|--------|
| T-02-01-01 | Tampering | `createFfprobeJsonCommand` | mitigate | Fixed ffprobe argv literals; `inputPath` single arg via `createProcessCommand` (`src/adapters/ffprobe.ts`). | closed |
| T-02-01-02 | Spoofing | Parser | mitigate | `parseFfprobeJson` Zod boundary; failures become typed errors (`src/domain/media-probe.ts`, `src/adapters/ffprobe.ts`). | closed |
| T-02-01-03 | Information Disclosure | Error messages | mitigate | `describeFfprobeFailure` maps kinds; success path parses stdout without echoing blob (`src/app/inspect.ts`). | closed |
| T-02-01-04 | Denial of Service | External probe | accept | Bounded timeouts optional via `ProcessCommand.timeoutMs`; deferred hardening — see Accepted Risks. | closed |
| T-02-02-01 | Tampering | `resolveOutputPath` | mitigate | `canonicalPath` uses `normalize(resolve(...))`; rejects identical canonical input/output (`src/domain/output-path.ts`). | closed |
| T-02-02-02 | Repudiation | `force` flag | accept | Overwrite only when `force: true` / CLI `--force`; default blocks existing output — see Accepted Risks. | closed |
| T-02-02-03 | Elevation | Codec/container enums | mitigate | Closed unions `PlannedAudioCodec` / `PlannedContainer`; literals in planner (`src/domain/output-plan.ts`). | closed |
| T-02-03-01 | Tampering | Path injection | mitigate | Probe argv-only chain; JSON mode uses `JSON.stringify` on summary DTO (`src/cli/render.ts`). | closed |
| T-02-03-02 | Information Disclosure | Logs/stderr | mitigate | Inspect failures use `CommandOutcome` / `describeFfprobeFailure` concise strings (`src/cli/render.ts`, `src/app/inspect.ts`). | closed |
| T-02-03-03 | Denial of Service | Local probe | accept | Local CLI invocation; optional timeouts tied to runner — see Accepted Risks. | closed |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-01-04 | FFprobe runtime/size limits rely on OS/user environment; explicit `ProcessCommand` timeouts may be added later. | Phase threat model (`accept`) | 2026-05-02 |
| AR-02-02 | T-02-02-02 | Destructive overwrite is intentional when `--force` is passed; default denies collision. | Phase threat model (`accept`) | 2026-05-02 |
| AR-02-03 | T-02-03-03 | Local-only inspect; no network attack surface in Phase 2 scope. | Phase threat model (`accept`) | 2026-05-02 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-02 | 10 | 10 | 0 | Inline `/gsd-secure-phase 02` — PLAN threat models vs `src/` verification (no implementation edits). |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-02
