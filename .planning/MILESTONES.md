# Milestones

## v1.1 — Multi-container stream copy (Shipped: 2026-05-04)

**Phases completed:** 9 phases, 16 plans.

**Key accomplishments:**

- Typed **PlannedContainer** (MP4 / Matroska / WebM) and collision-safe output path derivation (**MULTI-01**, **MULTI-02**).
- **planVideoStreamCopyFeasibility** integrated into prelude: VP9→WebM copy-safe, Theora→Matroska, explicit VP8 fallback tokens (**MULTI-03**–**MULTI-05**); requirements narrowed so VP9+Matroska stays explicitly deferred.
- FFmpeg remux argv honors mux format (**`-f webm` / `-f matroska`**) and per-container audio policy; intermediate pipeline basenames aligned with encode matrix (**MULTI-06**, **MULTI-07**).
- Inspect / JSON surfaces, **`verifyCleanOutput`** canonical codec checks, ffprobe fixtures, and MULTI-12 MP4 regression literals (**MULTI-08**–**MULTI-12**).
- Video fallback re-encode uses **libx265** with truthful inspect/run-report/verify paths, including HEVC assertion after re-encode (**MULTI-13**).
- Gap phases **06–09** closed milestone audit items (verification artifacts, traceability, **`bun run verify`** **226** tests green at ship).

**Archives:** [v1.1-ROADMAP](milestones/v1.1-ROADMAP.md) · [v1.1-REQUIREMENTS](milestones/v1.1-REQUIREMENTS.md) · [v1.1-MILESTONE-AUDIT](milestones/v1.1-MILESTONE-AUDIT.md)

---

## v1.0 — CLI & v1 requirements (Shipped: 2026-05-03)

**Phases completed:** 17 phases, 37 plans (task counts unevenly recorded in summaries).

**Key accomplishments:**

- **Shipped Bun/TS CLI surface** (`doctor`, `inspect`, `clean`, `guided-clean`, `batch`, `install-tools`) with typed outcomes, documented exit codes, and **`bun run verify`** aggregate gate (~175 tests at ship date).
- **Media planning parity** shared by **`inspect`** and **`clean`** via **`planMediaOutput`** — video stream-copy-first with explicit **`fallback-required`** guardrails (**VIDEO-***).
- **Sequential pipeline presets** (**FFmpeg** core, optional **SoX**, **Demucs**, **Audacity** macro/Risk, **LADSPA**/TOOL-07 **ladspa** path; doctor **`melt`** probe visibility without melt orchestration).
- **Guided ↔ non-interactive equivalence** (**CLI-04**, **`argvTokensForEquivalentClean`**) plus **batch** collision-safe outputs and manifests with **`maybeDoctorFacts`** (**BATCH-05** closure).
- **42/42 v1 requirement IDs** satisfied with prose + trace archived in [.planning/milestones/v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md); audit **passed**: [.planning/milestones/v1.0-MILESTONE-AUDIT.md](milestones/v1.0-MILESTONE-AUDIT.md).
- **Milestone-gap phases 9–17** authored feature **`NN-VERIFICATION.md`** evidence, retrospective docs (**15–16**), and **09–14** verification **pointer stubs** for planning ergonomics.

**Archives:**

- Roadmap snapshot: [.planning/milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

---
