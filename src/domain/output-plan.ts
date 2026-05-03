import type { MediaProbe } from "./media-probe";
import type { OutputPathSuccess } from "./output-path";
import { evaluateStreamCopyFeasibility } from "./stream-copy-feasibility";

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
 * Computes output modality before any FFmpeg execution. Video + audio uses Phase 3
 * stream-copy feasibility (single video, MP4 plan, MP4-safe codec whitelist: H.264, HEVC, AV1).
 */
export function planMediaOutput(input: PlanMediaOutputInput): OutputPlan {
  const plannedAudioCodec: PlannedAudioCodec = "aac";
  const plannedContainer: PlannedContainer = "mp4";

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

  const hasIdentifiableAudioCodec = audioStreams.some(
    (stream) => (stream.codec_name?.trim() ?? "").length > 0,
  );

  if (!hasIdentifiableAudioCodec) {
    return {
      modality: "unsupported",
      reasonCodes: ["no-audio-codec-metadata"],
      resolvedOutputPath: input.pathOutcome.resolvedOutputPath,
      resolvedInputPath: input.pathOutcome.resolvedInputPath,
    };
  }

  const videoStreams = input.probe.streams.filter(
    (stream) => stream.codec_type === "video",
  );

  const selected = selectAudioStream(audioStreams);

  if (videoStreams.length === 0) {
    return {
      modality: "audio-only",
      reasonCodes: ["phase-2-stub-audio-only"],
      resolvedOutputPath: input.pathOutcome.resolvedOutputPath,
      resolvedInputPath: input.pathOutcome.resolvedInputPath,
      selectedAudioStreamIndex: selected.index,
      plannedAudioCodec,
      plannedContainer,
    };
  }

  const streamCopy = evaluateStreamCopyFeasibility({
    probe: input.probe,
    plannedContainer,
    plannedAudioCodec,
  });

  if (streamCopy.kind === "fallback-required") {
    return {
      modality: "fallback-required",
      reasonCodes: streamCopy.reasonCodes,
      resolvedOutputPath: input.pathOutcome.resolvedOutputPath,
      resolvedInputPath: input.pathOutcome.resolvedInputPath,
      selectedAudioStreamIndex: selected.index,
      plannedAudioCodec,
      plannedContainer,
    };
  }

  return {
    modality: "video-copy-safe",
    reasonCodes: [...streamCopy.reasonCodes],
    resolvedOutputPath: input.pathOutcome.resolvedOutputPath,
    resolvedInputPath: input.pathOutcome.resolvedInputPath,
    selectedAudioStreamIndex: selected.index,
    plannedAudioCodec,
    plannedContainer,
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

function streamHasIdentifiableAudioCodec(
  stream: MediaProbe["streams"][number],
): boolean {
  return (stream.codec_name?.trim() ?? "").length > 0;
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

    const aCodec = streamHasIdentifiableAudioCodec(a) ? 0 : 1;
    const bCodec = streamHasIdentifiableAudioCodec(b) ? 0 : 1;

    if (aCodec !== bCodec) {
      return aCodec - bCodec;
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
