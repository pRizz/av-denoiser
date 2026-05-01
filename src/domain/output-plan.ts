import type { MediaProbe } from "./media-probe";
import type { OutputPathSuccess } from "./output-path";

export type PlannedAudioCodec = "aac" | "opus" | "pcm_s16le";
export type PlannedContainer = "mp4" | "matroska" | "wav";

export type OutputModality =
  | "audio-only"
  | "video-copy-safe"
  | "fallback-required"
  | "unsupported";

export type OutputPlan =
  | {
      readonly modality: "unsupported";
      readonly reasonCodes: readonly string[];
      readonly resolvedOutputPath: string;
      readonly resolvedInputPath: string;
      readonly selectedAudioStreamIndex?: undefined;
      readonly plannedAudioCodec?: undefined;
      readonly plannedContainer?: undefined;
    }
  | {
      readonly modality: Exclude<OutputModality, "unsupported">;
      readonly reasonCodes: readonly string[];
      readonly resolvedOutputPath: string;
      readonly resolvedInputPath: string;
      readonly selectedAudioStreamIndex: number;
      readonly plannedAudioCodec: PlannedAudioCodec;
      readonly plannedContainer: PlannedContainer;
    };

export type PlanMediaOutputInput = {
  readonly probe: MediaProbe;
  readonly pathOutcome: OutputPathSuccess;
};

/**
 * Phase 2 stub: when both audio and video exist we label `video-copy-safe`.
 * Detailed fallback matrix (container/codec incompatibilities) is Phase 3.
 */
export function planMediaOutput(input: PlanMediaOutputInput): OutputPlan {
  const audioStreams = input.probe.streams.filter(
    (stream) => stream.codec_type === "audio",
  );

  if (audioStreams.length === 0) {
    return {
      modality: "unsupported",
      reasonCodes: ["no-audio-stream"],
      resolvedOutputPath: input.pathOutcome.resolvedOutputPath,
      resolvedInputPath: input.pathOutcome.resolvedInputPath,
    };
  }

  const videoStreams = input.probe.streams.filter(
    (stream) => stream.codec_type === "video",
  );

  const selected = selectAudioStream(audioStreams);

  const modality: Exclude<OutputModality, "unsupported"> =
    videoStreams.length === 0 ? "audio-only" : "video-copy-safe";

  const reasonCodes =
    modality === "video-copy-safe"
      ? ["phase-2-stub-video-copy-safe"]
      : ["phase-2-stub-audio-only"];

  return {
    modality,
    reasonCodes,
    resolvedOutputPath: input.pathOutcome.resolvedOutputPath,
    resolvedInputPath: input.pathOutcome.resolvedInputPath,
    selectedAudioStreamIndex: selected.index,
    plannedAudioCodec: "aac",
    plannedContainer: "mp4",
  };
}

function streamChannelCount(stream: MediaProbe["streams"][number]): number {
  const channels = stream.channels;

  if (channels === undefined) {
    return 0;
  }

  if (typeof channels === "number") {
    return channels;
  }

  const parsed = Number.parseInt(channels, 10);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function selectAudioStream(
  audioStreams: MediaProbe["streams"],
): MediaProbe["streams"][number] {
  const sorted = [...audioStreams].sort((a, b) => {
    const aDefault = a.disposition?.default === 1 ? 0 : 1;
    const bDefault = b.disposition?.default === 1 ? 0 : 1;

    if (aDefault !== bDefault) {
      return aDefault - bDefault;
    }

    if (a.index !== b.index) {
      return a.index - b.index;
    }

    return streamChannelCount(b) - streamChannelCount(a);
  });

  const first = sorted[0];

  if (first === undefined) {
    throw new Error("selectAudioStream requires non-empty audioStreams");
  }

  return first;
}
