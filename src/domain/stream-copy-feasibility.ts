import type { MediaProbe } from "./media-probe";
import type { PlannedContainer } from "./output-plan";

/** Stable success tokens for MP4 stream-copy rows (MULTI-12 — no silent renames). */
export type Mp4VideoStreamCopySuccessReasonCode =
  | "video-copy-h264-mp4-v1"
  | "video-copy-hevc-mp4-v1"
  | "video-copy-av1-mp4-v1";

/** All copy-safe success tokens (MP4 whitelist + VP9/WebM + Theora/Matroska). */
export type VideoStreamCopySuccessReasonCode =
  | Mp4VideoStreamCopySuccessReasonCode
  | "video-copy-vp9-webm-v1"
  | "video-copy-theora-matroska-v1";

export type StreamCopyFeasibilityPlanningResult =
  | {
      readonly kind: "video-copy-safe";
      readonly plannedContainer: PlannedContainer;
      readonly reasonCodes: readonly [VideoStreamCopySuccessReasonCode];
    }
  | {
      readonly kind: "fallback-required";
      readonly plannedContainer: PlannedContainer;
      readonly reasonCodes: readonly string[];
    };

const MP4_STREAM_COPY_SUCCESS: Readonly<
  Record<"h264" | "hevc" | "av1", Mp4VideoStreamCopySuccessReasonCode>
> = {
  h264: "video-copy-h264-mp4-v1",
  hevc: "video-copy-hevc-mp4-v1",
  av1: "video-copy-av1-mp4-v1",
};

/**
 * Canonical video codec tag for comparing input vs output probes after copy.
 * Treats `h265` as equivalent to `hevc` when ffprobe differs between files.
 */
export function canonicalMp4CopyVideoCodec(codecName: string): string {
  const n = codecName.trim().toLowerCase();
  if (n === "h265") {
    return "hevc";
  }

  return n;
}

/**
 * Narrow alias table for verifying post-remux video stream-copy probes (`ffprobe`).
 * See `canonicalVideoCodecForMatrix` for feasibility routing; aliases here are verifier-only.
 */
export function canonicalVideoCodecForVerify(codecName: string): string {
  const n = codecName.trim().toLowerCase();

  if (n === "vp09") {
    return "vp9";
  }

  if (n === "av01") {
    return "av1";
  }

  return canonicalVideoCodecForMatrix(n);
}

/**
 * Canonical codec bucket for feasibility matrix branching (aliases shared with MP4 rows).
 */
export function canonicalVideoCodecForMatrix(codecName: string): string {
  return canonicalMp4CopyVideoCodec(codecName);
}

/*
 * Reason-code naming (MULTI roadmap):
 * - Success rows: `video-copy-<canonicalCodec>-<container>-v<n>` (MULTI-12 literals for MP4 unchanged).
 *   Deferred backlog: optional `video-copy-vp9-matroska-v1` (CONTEXT D-04) — not implemented in Phase 02.
 * - Fallback/disallow: `video-fallback-*` or `unsupported-*`; encode container/particular denial in slug when meaningful.
 */

/**
 * Probe-only feasibility: lone structural video stream + codec → copy-safe pairing or deterministic fallback.
 */
export function planVideoStreamCopyFeasibility(
  probe: MediaProbe,
): StreamCopyFeasibilityPlanningResult {
  const videoStreams = probe.streams.filter(
    (stream) => stream.codec_type === "video",
  );

  if (videoStreams.length !== 1) {
    return {
      kind: "fallback-required",
      plannedContainer: "mp4",
      reasonCodes: ["video-fallback-multi-video-streams"],
    };
  }

  const formatName = probe.format?.format_name?.trim() ?? "";
  if (formatName.length === 0) {
    return {
      kind: "fallback-required",
      plannedContainer: "mp4",
      reasonCodes: ["video-fallback-missing-format-metadata"],
    };
  }

  const firstVideo = videoStreams[0];
  if (firstVideo === undefined) {
    throw new Error("planVideoStreamCopyFeasibility requires one video stream");
  }

  const rawVideoCodec = firstVideo.codec_name?.trim() ?? "";
  if (rawVideoCodec.length === 0) {
    return {
      kind: "fallback-required",
      plannedContainer: "mp4",
      reasonCodes: ["video-fallback-missing-video-codec-name"],
    };
  }

  const bucket = canonicalVideoCodecForMatrix(rawVideoCodec);

  if (bucket === "h264" || bucket === "hevc" || bucket === "av1") {
    return {
      kind: "video-copy-safe",
      plannedContainer: "mp4",
      reasonCodes: [MP4_STREAM_COPY_SUCCESS[bucket]],
    };
  }

  if (bucket === "vp9") {
    return {
      kind: "video-copy-safe",
      plannedContainer: "webm",
      reasonCodes: ["video-copy-vp9-webm-v1"],
    };
  }

  if (bucket === "theora") {
    return {
      kind: "video-copy-safe",
      plannedContainer: "matroska",
      reasonCodes: ["video-copy-theora-matroska-v1"],
    };
  }

  if (bucket === "vp8") {
    return {
      kind: "fallback-required",
      plannedContainer: "mp4",
      reasonCodes: ["video-fallback-vp8-matrix-explicit-v1"],
    };
  }

  return {
    kind: "fallback-required",
    plannedContainer: "mp4",
    reasonCodes: ["video-fallback-non-h264-video"],
  };
}
