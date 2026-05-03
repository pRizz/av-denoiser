import type { PlannedAudioCodec } from "./output-plan";
import { createProcessCommand, type ProcessCommand } from "./process-command";

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
};

/** `copy` when the probe is on the MP4 stream-copy allowlist; `reencode-h264` when the source video is outside that list (e.g. Theora → MP4 fallback). */
export type RemuxVideoStreamMode = "copy" | "reencode-h264";

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

  const audioArgs: string[] = [];

  switch (params.plannedAudioCodec) {
    case "aac":
      audioArgs.push("-c:a", "aac", "-b:a", "192k");
      break;
    case "opus":
      audioArgs.push("-c:a", "libopus");
      break;
    case "pcm_s16le":
      audioArgs.push("-c:a", "pcm_s16le");
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
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-crf",
          "23",
          "-preset",
          "fast",
        ];

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
