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

export function buildRemuxVideoCopyCommand(
  params: RemuxVideoCopyParams,
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
      "-c:v",
      "copy",
      ...audioArgs,
      params.resolvedOutputPath,
    ],
  });

  if (created.kind !== "created") {
    return { kind: "invalid", reason: "could not create remux command" };
  }

  return created;
}
