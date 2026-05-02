/**
 * PCM WAV s16le interchange: every FFmpeg/SoX step in the middle of the pipeline uses
 * WAV container + pcm_s16le so steps can be chained without lossy re-encode (PIPE-05).
 */
import { basename, extname, join } from "node:path";
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
  /**
   * Demucs binary (`demucs`) or `python3` when `demucsModulePrefix` is `["-m","demucs"]`.
   * Ignored when step is not `demucs` (pass "").
   */
  readonly demucsExecutable: string;
  /** Args between executable and Demucs flags, e.g. `[]` or `["-m","demucs"]`. */
  readonly demucsModulePrefix: readonly string[];
};

/** Maps afftdn `nf` from noise strength; literals frozen for tests (04-02). */
export function afftdnNoiseFloor(noiseStrength: number): number {
  const raw = -15 - noiseStrength * 50;

  return Math.min(-10, Math.max(-80, raw));
}

/** Track stem from a WAV path inside the pipeline (basename without extension). */
export function demucsTrackStemFromWavPath(wavPath: string): string {
  const base = basename(wavPath);
  const ext = extname(base);

  return ext.length > 0 ? base.slice(0, -ext.length) : base;
}

/**
 * Expected Demucs v4 output when using `-o <dir>`, two-stems vocals, and model `-n <model>`.
 * Resolves to `<dir>/<model>/<trackStem>/vocals.wav`.
 */
export function resolveDemucsVocalsWavPath(
  outputDirBase: string,
  trackStem: string,
  model: string,
): string {
  return join(outputDirBase, model, trackStem, "vocals.wav");
}

export function buildLogicalStepCommand(
  input: BuildLogicalStepCommandInput,
): ProcessCommandResult {
  const {
    step,
    ctx,
    ffmpegExecutable,
    maybeSoxExecutable,
    demucsExecutable,
    demucsModulePrefix,
  } = input;

  if (step.tool === "demucs") {
    if (step.step.kind !== "two-stems-vocals") {
      return { kind: "invalid", reason: { kind: "empty-executable" } };
    }

    const exe = demucsExecutable.trim();

    if (exe.length === 0) {
      return { kind: "invalid", reason: { kind: "empty-executable" } };
    }

    const model = step.step.model.trim();

    if (model.length === 0) {
      return { kind: "invalid", reason: { kind: "empty-executable" } };
    }

    return createProcessCommand({
      executable: exe,
      args: [
        ...demucsModulePrefix,
        "-n",
        model,
        "--two-stems",
        "vocals",
        "-o",
        ctx.intermediateOutPath,
        ctx.intermediateInPath,
      ],
    });
  }

  if (step.tool === "audacity") {
    return { kind: "invalid", reason: { kind: "empty-executable" } };
  }

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

    case "ladspa-apply": {
      const pluginPath = ff.pluginPath.trim();

      if (pluginPath.length === 0) {
        return { kind: "invalid", reason: { kind: "empty-executable" } };
      }

      const label = ff.label.trim();

      if (label.length === 0) {
        return { kind: "invalid", reason: { kind: "empty-executable" } };
      }

      /** Colons and backslashes in paths must survive FFmpeg `ladspa=` option parsing (see ffmpeg ladspa filter). */
      const fileEsc = pluginPath.replace(/\\/g, "/").replace(/:/g, "\\:");
      const controls = ff.controls.trim();
      const ladspaFilter =
        controls === ""
          ? `ladspa=file=${fileEsc}:label=${label}`
          : `ladspa=file=${fileEsc}:label=${label}:c=${controls}`;

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
          ladspaFilter,
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
