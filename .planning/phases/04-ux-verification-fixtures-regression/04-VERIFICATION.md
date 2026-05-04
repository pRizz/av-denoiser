---
status: passed
phase: 04-ux-verification-fixtures-regression
generated_at: "2026-05-04T11:25:29Z"
---

# Phase 04 verification — UX, verification surfaces & fixtures

Automated verification: **`bun run verify`** (`biome ci`, `tsc --noEmit`, `bun test`) — **226** pass, **0** fail, at Phase **09** closure (**2026-05-04**).

## Must-haves vs evidence

### MULTI-08 (`inspect` preservation + `--json`)

| Must-have | Evidence |
|-----------|----------|
| **`inspect`** builds summaries from **`outputPlanToInspectSummary`** / **`buildPreservationNotesFromPlan`** (planned container, modality phrases, pairing caveats) | `src/domain/inspect-summary.ts`; **`runInspectRequest`** in **`src/app/inspect.ts`** |
| **`--json`** preserves planned codec + container in serialized summary | **`test/app/inspect.test.ts`** — **`json flag preserves planned codec and container`** |

### MULTI-09 (`fallback-required` + `allowVideoFallback` honesty)

| Must-have | Evidence |
|-----------|----------|
| **`inspect`** denies **`fallback-required`** execution posture until **`allowVideoFallback`** acknowledged | **`test/app/inspect.test.ts`** — **`denies fallback-required without allowVideoFallback flag`** / **`allows fallback-required when acknowledged`** |
| **`clean`** surfaces modality fidelity consistent with inspect/planning (`fallback-required` without flag exits **`fallback-required`**) | **`test/app/clean.test.ts`** — **`fallback-required without allow flag returns fallback-required`** |

### MULTI-10 (`verifyCleanOutput` canonical codec truthfulness)

| Must-have | Evidence |
|-----------|----------|
| Stream-copy path compares input/output **`codec_name`** via **`canonicalVideoCodecForVerify`** | **`src/domain/clean-output-verify.ts`** (**`video-copy-safe`** + **`claimedVideoCopied`**) |
| Alias normalization (**VP9** **`vp09`**, **AV1** **`av01`**, **HEVC** **`h265`/`hev1`**) | **`test/domain/clean-output-verify.test.ts`** existing rows |
| **Fallback / re-encode** path asserts **output** canonical **HEVC** when **`plannedModality: fallback-required`** and **`claimedVideoCopied: false`** (aligned with **`libx265`** remux) | **`src/domain/clean-output-verify.ts`** (`fallback-required` branch); **`test/domain/clean-output-verify.test.ts`** (**`fallback-required re-encode: …`** tests — Phase **09-01**) |

### MULTI-11 (Ffprobe-style fixtures)

| Must-have | Evidence |
|-----------|----------|
| VP9/WebM-ish probe fixture drives matrix planning tests | **`test/fixtures/ffprobe/minimal-video-vp9-webm-matrix.json`**; **`test/domain/output-plan.fixture.test.ts`** (**VP9 WebM copy-safe**) |
| Theora/Matroska-ish probe fixture | **`test/fixtures/ffprobe/minimal-video-theora-matroska-matrix.json`**; **`test/domain/output-plan.fixture.test.ts`** (**Theora MKV copy-safe**) |
| Representative minimal video+audio + audio-only probes | **`test/fixtures/ffprobe/minimal-video-audio.json`**, **`minimal-audio.json`** |

### MULTI-12 (MP4 H.264 / HEVC / AV1 regression locks)

| Must-have | Evidence |
|-----------|----------|
| Frozen **`video-copy-*-mp4-v1`** reason literals | **`test/domain/multiregression-multi12-literals.test.ts`** |
| Inspect summary exposes whitelist literals deterministically | **`test/domain/inspect-summary.test.ts`** — **`outputPlanToInspectSummary MP4 whitelist reason codes are frozen literals`** |
| Copy-feasibility + **`verifyCleanOutput`** synonym paths | **`test/domain/stream-copy-feasibility.test.ts`**; **`test/domain/clean-output-verify.test.ts`** (**h265**/ **`hev1`** / **`av01`** rows) |

## Requirement IDs

- **MULTI-08**–**MULTI-12**: Closure documented above; **MULTI-13** supplemental verifier narrative lives in **[05-VERIFICATION.md](../05-x265-preferred-video-reencode/05-VERIFICATION.md)** alongside **`libx265`** argv evidence.

## Human verification

None required (`status: passed`, automated-only).
