import { Command } from "@commander-js/extra-typings";
import {
  DEFAULT_CLEAN_PRESET_ID,
  parsePresetId,
} from "../domain/audio-pipeline-plan";
import type { CliRequest } from "../domain/cli-request";
import { cliName } from "../domain/product";

function parseNoiseStrength(raw: string): number {
  const value = Number.parseFloat(raw);

  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("noise-strength must be a number between 0 and 1");
  }

  return value;
}

export type CliRequestHandler = (request: CliRequest) => void;

export function createCommandProgram(handleRequest: CliRequestHandler) {
  const program = new Command()
    .name(cliName)
    .description(
      "Clean noisy audio in local media files through a safe typed pipeline",
    )
    .showHelpAfterError();

  program.action(() => {
    handleRequest({ kind: "show-default" });
  });

  program
    .command("doctor")
    .description("Inspect local tool readiness for future media processing")
    .action(() => {
      handleRequest({ kind: "doctor" });
    });

  program
    .command("inspect")
    .description(
      "Probe input media with ffprobe and print a planned output summary (no transcoding)",
    )
    .argument("<input>", "Path to the input audio or video file")
    .option("-o, --output <path>", "Explicit output path (optional)")
    .option("--force", "Allow overwriting an existing output file", false)
    .option("--json", "Print machine-readable JSON instead of text", false)
    .option(
      "--allow-video-fallback",
      "Acknowledge fallback-required preservation plans instead of exiting non-zero.",
      false,
    )
    .action(
      (
        input: string,
        options: {
          output?: string;
          force?: boolean;
          json?: boolean;
          allowVideoFallback?: boolean;
        },
      ) => {
        handleRequest({
          kind: "inspect",
          inputPath: input,
          maybeOutputPath: options.output,
          force: Boolean(options.force),
          json: Boolean(options.json),
          allowVideoFallback: Boolean(options.allowVideoFallback),
        });
      },
    );

  program
    .command("clean")
    .description(
      "Run preset audio cleanup on an audio-only input (probe + sequential FFmpeg/SoX)",
    )
    .argument("<input>", "Path to the input audio file")
    .option("-o, --output <path>", "Explicit output path (optional)")
    .option("--force", "Allow overwriting an existing output file", false)
    .option(
      "--dry-run",
      "Print planned steps and warnings without invoking ffmpeg/sox",
      false,
    )
    .option("--json", "Print machine-readable JSON instead of text", false)
    .option(
      "--preset <id>",
      "Preset id (speech-light | speech-soft-sox)",
      DEFAULT_CLEAN_PRESET_ID,
    )
    .option(
      "--noise-strength <0..1>",
      "Noise reduction strength for afftdn mapping",
      parseNoiseStrength,
      0.35,
    )
    .action(
      (
        input: string,
        options: {
          output?: string;
          force?: boolean;
          dryRun?: boolean;
          json?: boolean;
          preset?: string;
          noiseStrength?: number;
        },
      ) => {
        const rawPreset = options.preset ?? DEFAULT_CLEAN_PRESET_ID;
        const presetId = parsePresetId(rawPreset);

        if (presetId === null) {
          throw new Error(
            `Invalid --preset "${rawPreset}". Use speech-light or speech-soft-sox.`,
          );
        }

        handleRequest({
          kind: "clean",
          inputPath: input,
          maybeOutputPath: options.output,
          force: Boolean(options.force),
          dryRun: Boolean(options.dryRun),
          json: Boolean(options.json),
          presetId,
          knobs: { noiseStrength: options.noiseStrength ?? 0.35 },
        });
      },
    );

  return program;
}
