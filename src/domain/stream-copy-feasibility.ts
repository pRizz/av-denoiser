import type { MediaProbe } from "./media-probe";
import type { PlannedAudioCodec, PlannedContainer } from "./output-plan";

export type EvaluateStreamCopyFeasibilityArgs = {
  readonly probe: MediaProbe;
  readonly plannedContainer: PlannedContainer;
  readonly plannedAudioCodec: PlannedAudioCodec;
};

/** Stable success tokens appended to `video-copy-safe` plans when the lone video codec is on the MP4 stream-copy allowlist. */
export type Mp4VideoStreamCopySuccessReasonCode =
  | "video-copy-h264-mp4-v1"
  | "video-copy-hevc-mp4-v1"
  | "video-copy-av1-mp4-v1";

/** Video stream copy assessment: MP4 planned output + structural gates + codec allowlist (H.264 / HEVC / AV1). */
export type StreamCopyFeasibilityResult =
  | {
      readonly kind: "video-copy-safe";
      readonly reasonCodes: readonly [Mp4VideoStreamCopySuccessReasonCode];
    }
  | {
      readonly kind: "fallback-required";
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
 * Deterministic feasibility for copying the lone video stream into the planned MP4 container.
 */
export function evaluateStreamCopyFeasibility(
  args: EvaluateStreamCopyFeasibilityArgs,
): StreamCopyFeasibilityResult {
  void args.plannedAudioCodec;

  const plannedContainer = args.plannedContainer;
  const videoStreams = args.probe.streams.filter(
    (stream) => stream.codec_type === "video",
  );

  if (videoStreams.length !== 1) {
    return {
      kind: "fallback-required",
      reasonCodes: ["video-fallback-multi-video-streams"],
    };
  }

  if (plannedContainer !== "mp4") {
    return {
      kind: "fallback-required",
      reasonCodes: ["video-fallback-non-mp4-output-not-supported-for-video-v1"],
    };
  }

  const formatName = args.probe.format?.format_name?.trim() ?? "";
  if (formatName.length === 0) {
    return {
      kind: "fallback-required",
      reasonCodes: ["video-fallback-missing-format-metadata"],
    };
  }

  const firstVideo = videoStreams[0];
  if (firstVideo === undefined) {
    throw new Error("evaluateStreamCopyFeasibility requires one video stream");
  }

  const rawVideoCodec = firstVideo.codec_name?.trim() ?? "";
  if (rawVideoCodec.length === 0) {
    return {
      kind: "fallback-required",
      reasonCodes: ["video-fallback-missing-video-codec-name"],
    };
  }

  const bucket = canonicalMp4CopyVideoCodec(rawVideoCodec);
  if (bucket !== "h264" && bucket !== "hevc" && bucket !== "av1") {
    return {
      kind: "fallback-required",
      reasonCodes: ["video-fallback-non-h264-video"],
    };
  }

  const successToken = MP4_STREAM_COPY_SUCCESS[bucket];

  return {
    kind: "video-copy-safe",
    reasonCodes: [successToken],
  };
}
