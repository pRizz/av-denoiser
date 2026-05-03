/**
 * FFmpeg argv for extract + video remux (MULTI-06 / MULTI-07 — v1.1 mux policy).
 *
 * | plannedContainer | Audio in remux output   | FFmpeg audio args                         | Muxer flag before output |
 * | ----------------- | ---------------------- | ----------------------------------------- | ------------------------ |
 * | mp4               | AAC-LC                 | -c:a aac -b:a 192k                        | (omit -f mp4)            |
 * | webm              | Opus                   | -c:a libopus -b:a 128k                   | -f webm                  |
 * | matroska          | AAC-LC                 | -c:a aac -b:a 192k                       | -f matroska              |
 */
import type { PlannedAudioCodec, PlannedContainer } from "./output-plan";
import { createProcessCommand, type ProcessCommand } from "./process-command";

/** Video-file remux targets (wav is WAV deliverable/intermediate-only, not this builder). */
export type PlannedVideoMuxContainer = Exclude<PlannedContainer, "wav">;

/** Narrow planner output for remux argv — **`wav`** is invalid here and indicates a wiring bug. */
export function plannedContainerForVideoRemux(
  plannedContainer: PlannedContainer,
): PlannedVideoMuxContainer {
  if (plannedContainer === "wav") {
    throw new Error(
      "plannedContainerForVideoRemux: wav is not a typed video remux target",
    );
  }

  return plannedContainer;
}

export type ExtractAudioWavParams = {
  readonly ffmpegExecutable: string;
  readonly inputVideoPath: string;
  readonly selectedAudioStreamIndex: number;
  readonly sampleRate: number;
  readonly channelCount: number;
  readonly outputWavPath: string;
};

export type RemuxVideoCopyParams = {
  readonly ffmpegExecutable: string;
  readonly originalVideoPath: string;
  readonly processedAudioPath: string;
  readonly resolvedOutputPath: string;
  readonly plannedAudioCodec: PlannedAudioCodec;
  readonly plannedContainer: PlannedVideoMuxContainer;
};

/** `copy` when the probe is on a stream-copy matrix row; `reencode-hevc` when the source needs HEVC-in-MP4 transcode (e.g. VP8 → MP4 fallback, MULTI-13). */
export type RemuxVideoStreamMode = "copy" | "reencode-hevc";

export type RemuxVideoWithProcessedAudioParams = RemuxVideoCopyParams & {
  readonly videoStreamMode: RemuxVideoStreamMode;
};

export type VideoArgvBuildResult =
  | { readonly kind: "created"; readonly command: ProcessCommand }
  | { readonly kind: "invalid"; readonly reason: string };

export function buildExtractPrimaryAudioWavCommand(
  params: ExtractAudioWavParams,
): VideoArgvBuildResult {
  const ff = params.ffmpegExecutable.trim();

  if (ff.length === 0) {
    return { kind: "invalid", reason: "empty ffmpeg executable" };
  }

  const created = createProcessCommand({
    executable: ff,
    args: [
      "-nostdin",
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      params.inputVideoPath,
      "-vn",
      "-map",
      `0:${params.selectedAudioStreamIndex}`,
      "-acodec",
      "pcm_s16le",
      "-ar",
      String(params.sampleRate),
      "-ac",
      String(params.channelCount),
      "-f",
      "wav",
      params.outputWavPath,
    ],
  });

  if (created.kind !== "created") {
    return { kind: "invalid", reason: "could not create extract command" };
  }

  return created;
}

export function buildRemuxVideoWithProcessedAudioCommand(
  params: RemuxVideoWithProcessedAudioParams,
): VideoArgvBuildResult {
  const ff = params.ffmpegExecutable.trim();

  if (ff.length === 0) {
    return { kind: "invalid", reason: "empty ffmpeg executable" };
  }

  if (params.plannedAudioCodec === "pcm_s16le") {
    return {
      kind: "invalid",
      reason:
        "pcm_s16le is reserved for WAV/intermediate extracts, not typed video remux outputs",
    };
  }

  const audioArgs: string[] = [];

  switch (params.plannedAudioCodec) {
    case "aac":
      audioArgs.push("-c:a", "aac", "-b:a", "192k");
      break;
    case "opus":
      audioArgs.push("-c:a", "libopus", "-b:a", "128k");
      break;
    default: {
      const _exhaustive: never = params.plannedAudioCodec;

      return { kind: "invalid", reason: `unsupported codec ${_exhaustive}` };
    }
  }

  const videoArgs: string[] =
    params.videoStreamMode === "copy"
      ? ["-c:v", "copy"]
      : [
          "-c:v",
          "libx265",
          "-pix_fmt",
          "yuv420p",
          "-crf",
          "28",
          "-preset",
          "slow",
          "-tag:v",
          "hvc1",
        ];

  const muxFormatArgs: string[] =
    params.plannedContainer === "webm"
      ? ["-f", "webm"]
      : params.plannedContainer === "matroska"
        ? ["-f", "matroska"]
        : [];

  const created = createProcessCommand({
    executable: ff,
    args: [
      "-nostdin",
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      params.originalVideoPath,
      "-i",
      params.processedAudioPath,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      ...videoArgs,
      ...audioArgs,
      ...muxFormatArgs,
      params.resolvedOutputPath,
    ],
  });

  if (created.kind !== "created") {
    return { kind: "invalid", reason: "could not create remux command" };
  }

  return created;
}

export function buildRemuxVideoCopyCommand(
  params: RemuxVideoCopyParams,
): VideoArgvBuildResult {
  return buildRemuxVideoWithProcessedAudioCommand({
    ...params,
    videoStreamMode: "copy",
  });
}
