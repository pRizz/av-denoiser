---
phase: 09-gap-closure-output-verify-trust
plan: "01"
subsystem: clean-output-verify
tags: MULTI-10, MULTI-13, gap-closure, GSD

requires: []
provides:
  - **`CleanVerifyFailureReason`** includes **`video-reencode-codec-mismatch`**
  - **`verifyCleanOutput`** branch for **`plannedModality === "fallback-required"`** and **`claimedVideoCopied === false`** requiring output video **`canonicalVideoCodecForVerify(codec)` === `"hevc"`**
  - Unit coverage for fallback HEVC paths (**MULTI-10**, **MULTI-13** truthfulness)

key-files:
  created: []
  modified:
    - src/domain/clean-output-verify.ts
    - test/domain/clean-output-verify.test.ts

requirements-completed:
  - MULTI-10
  - MULTI-13

generated_by: gsd-execute-plan
lifecycle_mode: yolo
phase_lifecycle_id: 09-2026-05-04T11-21-22
generated_at: "2026-05-04T11:25:29.000Z"
completed: "2026-05-04"
---

# Phase 09 Plan 01 — Summary

Extended **`verifyCleanOutput`** so **`fallback-required`** video runs (**`claimedVideoCopied: false`**) verify the **output** probe’s primary video codec canonicalizes to **HEVC** after **`libx265`** remux (new **`video-reencode-codec-mismatch`** / **`missing-video-stream`** outcomes). **`finalizeCleanSuccess`** wiring unchanged — modality flags already match **`clean.ts`**.

## Verification

- **`bun run verify`** — exit **0** (**226** tests pass)

## New tests

- **`fallback-required re-encode: input h264 output hevc => ok`**
- **`fallback-required re-encode: output h264 => video-reencode-codec-mismatch`**
- **`fallback-required re-encode: output hev1 probe string => ok`**
- **`fallback-required re-encode: missing output video stream => missing-video-stream`**
