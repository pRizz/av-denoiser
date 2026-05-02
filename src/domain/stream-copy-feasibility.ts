import type { MediaProbe } from "./media-probe";
import type { PlannedAudioCodec, PlannedContainer } from "./output-plan";

export type EvaluateStreamCopyFeasibilityArgs = {
  readonly probe: MediaProbe;
  readonly plannedContainer: PlannedContainer;
  readonly plannedAudioCodec: PlannedAudioCodec;
};

/** Video stream copy assessment for Phase 3 narrow MP4 + H.264 v1 matrix. */
export type StreamCopyFeasibilityResult =
  | {
      readonly kind: "video-copy-safe";
      readonly reasonCodes: readonly ["video-copy-h264-mp4-v1"];
    }
  | {
      readonly kind: "fallback-required";
      readonly reasonCodes: readonly string[];
    };

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

  const codecNormalized = firstVideo.codec_name.trim().toLowerCase();
  if (codecNormalized !== "h264") {
    return {
      kind: "fallback-required",
      reasonCodes: ["video-fallback-non-h264-video"],
    };
  }

  return {
    kind: "video-copy-safe",
    reasonCodes: ["video-copy-h264-mp4-v1"],
  };
}
