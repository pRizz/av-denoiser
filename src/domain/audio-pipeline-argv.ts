/**
 * PCM WAV s16le interchange: every FFmpeg/SoX step in the middle of the pipeline uses
 * WAV container + pcm_s16le so steps can be chained without lossy re-encode (PIPE-05).
 */
import type { LogicalPipelineStep } from "./audio-pipeline-plan";
import type { PlannedAudioCodec, PlannedContainer } from "./output-plan";
import {
  createProcessCommand,
  type ProcessCommandResult,
} from "./process-command";

export type AudioArgvContext = {
  readonly streamIndex: number;
  readonly sampleRate: number;
  readonly channelCount: number;
  readonly plannedAudioCodec: PlannedAudioCodec;
  readonly plannedContainer: PlannedContainer;
  readonly inputMediaPath: string;
  readonly intermediateInPath: string;
  readonly intermediateOutPath: string;
  readonly finalOutputPath: string;
};

export type BuildLogicalStepCommandInput = {
  readonly step: LogicalPipelineStep;
  readonly ctx: AudioArgvContext;
  readonly ffmpegExecutable: string;
  readonly maybeSoxExecutable: string | null;
};

/** Maps afftdn `nf` from noise strength; literals frozen for tests (04-02). */
export function afftdnNoiseFloor(noiseStrength: number): number {
  const raw = -15 - noiseStrength * 50;

  return Math.min(-10, Math.max(-80, raw));
}

export function buildLogicalStepCommand(
  input: BuildLogicalStepCommandInput,
): ProcessCommandResult {
  const { step, ctx, ffmpegExecutable, maybeSoxExecutable } = input;

  if (step.tool === "sox") {
    if (step.step.kind !== "gentle-dynamics") {
      return { kind: "invalid", reason: { kind: "empty-executable" } };
    }

    const sox = maybeSoxExecutable === null ? "" : maybeSoxExecutable.trim();

    return createProcessCommand({
      executable: sox,
      args: [
        ctx.intermediateInPath,
        ctx.intermediateOutPath,
        "highpass",
        "80",
        "compand",
        "0.3,1",
        "6:-60,-40,-20",
        "-5",
        "-90",
        "0.2",
        "gain",
        "-n",
        "-3",
      ],
    });
  }

  const ff = step.step;

  switch (ff.kind) {
    case "extract-pcm-wav":
      return createProcessCommand({
        executable: ffmpegExecutable,
        args: [
          "-nostdin",
          "-hide_banner",
          "-loglevel",
          "error",
          "-y",
          "-i",
          ctx.inputMediaPath,
          "-map",
          `0:${ctx.streamIndex}`,
          "-vn",
          "-acodec",
          "pcm_s16le",
          "-ar",
          String(ctx.sampleRate),
          "-ac",
          String(ctx.channelCount),
          "-f",
          "wav",
          ctx.intermediateOutPath,
        ],
      });

    case "afftdn": {
      const nf = afftdnNoiseFloor(ff.noiseStrength);

      return createProcessCommand({
        executable: ffmpegExecutable,
        args: [
          "-nostdin",
          "-hide_banner",
          "-loglevel",
          "error",
          "-y",
          "-i",
          ctx.intermediateInPath,
          "-vn",
          "-af",
          `afftdn=nf=${nf}`,
          "-acodec",
          "pcm_s16le",
          "-ar",
          String(ctx.sampleRate),
          "-ac",
          String(ctx.channelCount),
          "-f",
          "wav",
          ctx.intermediateOutPath,
        ],
      });
    }

    case "encode-deliverable":
      return encodeDeliverableArgs(
        ffmpegExecutable,
        ctx.intermediateInPath,
        ctx.finalOutputPath,
        ff.audioCodec,
        ff.container,
      );

    default: {
      const _exhaustive: never = ff;

      return _exhaustive;
    }
  }
}

function encodeDeliverableArgs(
  ffmpegExecutable: string,
  inputWavPath: string,
  outputPath: string,
  audioCodec: PlannedAudioCodec,
  container: PlannedContainer,
): ProcessCommandResult {
  const args: string[] = [
    "-nostdin",
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    inputWavPath,
    "-vn",
  ];

  if (audioCodec === "aac" && container === "mp4") {
    args.push("-c:a", "aac", "-b:a", "192k", "-f", "mp4", outputPath);

    return createProcessCommand({ executable: ffmpegExecutable, args });
  }

  if (audioCodec === "opus" && container === "matroska") {
    args.push("-c:a", "libopus", "-f", "matroska", outputPath);

    return createProcessCommand({ executable: ffmpegExecutable, args });
  }

  if (audioCodec === "pcm_s16le" && container === "wav") {
    args.push("-c:a", "pcm_s16le", "-f", "wav", outputPath);

    return createProcessCommand({ executable: ffmpegExecutable, args });
  }

  args.push("-c:a", "aac", "-b:a", "192k", "-f", "mp4", outputPath);

  return createProcessCommand({ executable: ffmpegExecutable, args });
}
