import { basename, extname } from "node:path";

import type { MediaProbe } from "./media-probe";
import type { OutputPathSuccess } from "./output-path";
import { evaluateStreamCopyFeasibility } from "./stream-copy-feasibility";

export type PlannedAudioCodec = "aac" | "opus" | "pcm_s16le";
export type PlannedContainer = "mp4" | "matroska" | "webm" | "wav";

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

export type PlanMediaOutputPrelude =
  | { readonly kind: "unsupported"; readonly reasonCodes: readonly string[] }
  | {
      readonly kind: "ok";
      readonly modality: Exclude<OutputModality, "unsupported">;
      readonly plannedAudioCodec: PlannedAudioCodec;
      readonly plannedContainer: PlannedContainer;
      readonly reasonCodes: readonly string[];
      readonly selectedAudioStreamIndex: number;
    };

export type ImplicitDefaultExtInput = {
  readonly modality: Exclude<OutputModality, "unsupported">;
  readonly plannedContainer: PlannedContainer;
  readonly resolvedInputPath: string;
};

/**
 * Maps a planned container + modality to the default **implicit** output extension
 * (leading dot) beside the input stem with the `avdn` segment.
 *
 * - **Video** (`video-copy-safe`, `fallback-required`): extension follows **`plannedContainer`**
 *   (e.g. MP4 plan → `.mp4` even when the input is `.mov`).
 * - **Audio-only + `mp4`** container: preserves the input extension when present, else **`.m4a`**.
 */
export function implicitDefaultOutputExtWithDot(
  input: ImplicitDefaultExtInput,
): string {
  if (input.modality === "audio-only" && input.plannedContainer === "mp4") {
    const fromInput = extname(basename(input.resolvedInputPath));

    return fromInput.length > 0 ? fromInput : ".m4a";
  }

  switch (input.plannedContainer) {
    case "mp4":
      return ".mp4";
    case "matroska":
      return ".mkv";
    case "webm":
      return ".webm";
    case "wav":
      return ".wav";
  }
}

/**
 * Probe-only planning (no output paths). Used to derive implicit extensions before
 * `resolveOutputPath` while keeping `planMediaOutput` as the canonical full `OutputPlan` builder.
 */
export function planMediaOutputPrelude(
  probe: MediaProbe,
): PlanMediaOutputPrelude {
  const plannedAudioCodec: PlannedAudioCodec = "aac";
  /** PHASE 02: derive from feasibility matrix (VP9/Theora → matroska/webm rows). */
  const plannedContainer: PlannedContainer = "mp4";

  const audioStreams = probe.streams.filter(
    (stream) => stream.codec_type === "audio",
  );

  if (audioStreams.length === 0) {
    return { kind: "unsupported", reasonCodes: ["no-audio-stream"] };
  }

  const hasIdentifiableAudioCodec = audioStreams.some(
    (stream) => (stream.codec_name?.trim() ?? "").length > 0,
  );

  if (!hasIdentifiableAudioCodec) {
    return { kind: "unsupported", reasonCodes: ["no-audio-codec-metadata"] };
  }

  const videoStreams = probe.streams.filter(
    (stream) => stream.codec_type === "video",
  );

  const selected = selectAudioStream(audioStreams);

  if (videoStreams.length === 0) {
    return {
      kind: "ok",
      modality: "audio-only",
      reasonCodes: ["phase-2-stub-audio-only"],
      plannedAudioCodec,
      plannedContainer,
      selectedAudioStreamIndex: selected.index,
    };
  }

  const streamCopy = evaluateStreamCopyFeasibility({
    probe,
    plannedContainer,
    plannedAudioCodec,
  });

  if (streamCopy.kind === "fallback-required") {
    return {
      kind: "ok",
      modality: "fallback-required",
      reasonCodes: streamCopy.reasonCodes,
      plannedAudioCodec,
      plannedContainer,
      selectedAudioStreamIndex: selected.index,
    };
  }

  return {
    kind: "ok",
    modality: "video-copy-safe",
    reasonCodes: [...streamCopy.reasonCodes],
    plannedAudioCodec,
    plannedContainer,
    selectedAudioStreamIndex: selected.index,
  };
}

/**
 * Computes output modality before any FFmpeg execution. Video + audio uses
 * stream-copy feasibility (single video, planned container, MP4-safe codec whitelist
 * when planned container is mp4: H.264, HEVC, AV1).
 */
export function planMediaOutput(input: PlanMediaOutputInput): OutputPlan {
  const prelude = planMediaOutputPrelude(input.probe);

  if (prelude.kind === "unsupported") {
    return {
      modality: "unsupported",
      reasonCodes: prelude.reasonCodes,
      resolvedOutputPath: input.pathOutcome.resolvedOutputPath,
      resolvedInputPath: input.pathOutcome.resolvedInputPath,
    };
  }

  const ok = prelude;

  switch (ok.modality) {
    case "audio-only":
      return {
        modality: "audio-only",
        reasonCodes: ok.reasonCodes,
        resolvedOutputPath: input.pathOutcome.resolvedOutputPath,
        resolvedInputPath: input.pathOutcome.resolvedInputPath,
        selectedAudioStreamIndex: ok.selectedAudioStreamIndex,
        plannedAudioCodec: ok.plannedAudioCodec,
        plannedContainer: ok.plannedContainer,
      };
    case "fallback-required":
      return {
        modality: "fallback-required",
        reasonCodes: ok.reasonCodes,
        resolvedOutputPath: input.pathOutcome.resolvedOutputPath,
        resolvedInputPath: input.pathOutcome.resolvedInputPath,
        selectedAudioStreamIndex: ok.selectedAudioStreamIndex,
        plannedAudioCodec: ok.plannedAudioCodec,
        plannedContainer: ok.plannedContainer,
      };
    case "video-copy-safe":
      return {
        modality: "video-copy-safe",
        reasonCodes: ok.reasonCodes,
        resolvedOutputPath: input.pathOutcome.resolvedOutputPath,
        resolvedInputPath: input.pathOutcome.resolvedInputPath,
        selectedAudioStreamIndex: ok.selectedAudioStreamIndex,
        plannedAudioCodec: ok.plannedAudioCodec,
        plannedContainer: ok.plannedContainer,
      };
  }
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
