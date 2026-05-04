---
status: passed
phase: 05-x265-preferred-video-reencode
generated_at: "2026-05-04T11:25:29Z"
---

# Phase 05 verification — x265-preferred video re-encode

Automated verification: **`bun run verify`** (`biome ci`, `tsc --noEmit`, `bun test`) — **226** pass, **0** fail, at Phase **09** closure (**2026-05-04**).

## Must-haves vs evidence

### MULTI-13 (`libx265` fallback + truthful surfaces)

| Must-have | Evidence |
|-----------|----------|
| **`buildRemuxVideoWithProcessedAudioCommand`** **`videoStreamMode: "reencode-hevc"`** emits **`libx265`**, **`-pix_fmt yuv420p`**, **`-crf 28`**, **`-preset slow`**, **`-tag:v hvc1`** | **`src/domain/video-clean-argv.ts`**; **`test/domain/video-clean-argv.test.ts`** — **`reencode-hevc argv uses libx265, yuv420p, crf 28, preset slow, hvc1`** |
| **`clean`** execute path invokes **`reencode-hevc`** remux when **`fallback-required`** + **`allowVideoFallback`** | **`src/app/clean.ts`** (**`videoStreamMode: executablePlan.modality === "fallback-required" ? "reencode-hevc" : "copy"`**); **`test/app/clean.test.ts`** — **`fallback-required execute remuxes video with libx265 when allowVideoFallback`** |
| **`renderCleanRunReportText`** labels re-encoded video as **HEVC / libx265** | **`src/domain/clean-run-report.ts`**; **`test/domain/clean-run-report.test.ts`** |
| **`verifyCleanOutput`** rejects outputs whose probe video codec does **not** canonicalize to **HEVC** after fallback (**truthfulness vs FFmpeg**) | **`src/domain/clean-output-verify.ts`** — **`plannedModality === "fallback-required"`** && **`!claimedVideoCopied`** branch (**`video-reencode-codec-mismatch`**); **`test/domain/clean-output-verify.test.ts`** (**fallback-required re-encode** tests — Phase **09** gap closure) |
| **`inspect`** JSON retains modality/container coherence with planner (**MULTI-13** “inspect/json truthful”) | **`test/app/inspect.test.ts`** (**preserves planned codec and container** + fallback acknowledgment rows) |

## Requirement IDs

- **MULTI-13**: **`libx265`** argv + post-run **HEVC** verifier — documented above.

## Human verification

None required (`status: passed`, automated-only).
