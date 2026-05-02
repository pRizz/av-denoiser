import { Command } from "@commander-js/extra-typings";
import {
  DEFAULT_CLEAN_PRESET_ID,
  type LadspaIntegration,
  parseLadspaCliTriple,
  parsePresetId,
} from "../domain/audio-pipeline-plan";
import type { CliHelpSubcommandTopic, CliRequest } from "../domain/cli-request";
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
    .command("install-tools")
    .alias("install-deps")
    .description(
      "macOS: install FFmpeg, SoX_ng, and Audacity via Homebrew by default (use --no-optional for FFmpeg only)",
    )
    .option(
      "--dry-run",
      "Print brew commands and manual hints without running Homebrew",
      false,
    )
    .option(
      "--no-optional",
      "Install FFmpeg only (skip SoX_ng, Audacity; omit Demucs automation hint)",
      true,
    )
    .option(
      "-y, --yes",
      "After brew (full tier only), run Demucs install without prompting via `uv tool install demucs` — requires `uv` on PATH after Homebrew (non-interactive runs)",
      false,
    )
    .action(
      (options: { dryRun?: boolean; optional?: boolean; yes?: boolean }) => {
        handleRequest({
          kind: "install-tools",
          dryRun: Boolean(options.dryRun),
          includeOptional: options.optional !== false,
          assumeYes: Boolean(options.yes),
        });
      },
    );

  program
    .command("guided")
    .description(
      "Interactive guided clean workflow with prompts and an equivalent flags summary",
    )
    .action(() => {
      handleRequest({ kind: "guided-clean" });
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
      "Run preset cleanup: audio-only inputs, or video inputs when inspect reports video-copy-safe / approved fallback",
    )
    .argument("<input>", "Path to the input audio or video file")
    .option("-o, --output <path>", "Explicit output path (optional)")
    .option("--force", "Allow overwriting an existing output file", false)
    .option(
      "--dry-run",
      "Print planned steps and warnings without invoking ffmpeg/sox",
      false,
    )
    .option("--json", "Print machine-readable JSON instead of text", false)
    .option(
      "--allow-video-fallback",
      "Allow executing fallback-required preservation plans (same semantics as inspect)",
      false,
    )
    .option(
      "--preset <id>",
      "Preset id (speech-light | speech-soft-sox | speech-vocals-demucs)",
      DEFAULT_CLEAN_PRESET_ID,
    )
    .option(
      "--noise-strength <0..1>",
      "Noise reduction strength for afftdn mapping",
      parseNoiseStrength,
      0.35,
    )
    .option(
      "--accept-audacity-pipe-risk",
      "Acknowledge mod-script-pipe risk when using --audacity-macro",
      false,
    )
    .option(
      "--audacity-macro <name>",
      "Run Audacity macro on intermediate WAV (requires risk flag; see doctor docs)",
    )
    .option(
      "--ladspa-plugin-path <file>",
      "LADSPA plugin path for optional FFmpeg ladspa step (pair with --ladspa-label)",
    )
    .option("--ladspa-label <label>", "LADSPA label= for FFmpeg ladspa filter")
    .option("--ladspa-controls <string>", "Optional ladspa c= control string")
    .action(
      (
        input: string,
        options: {
          output?: string;
          force?: boolean;
          dryRun?: boolean;
          json?: boolean;
          allowVideoFallback?: boolean;
          preset?: string;
          noiseStrength?: number;
          acceptAudacityPipeRisk?: boolean;
          audacityMacro?: string;
          ladspaPluginPath?: string;
          ladspaLabel?: string;
          ladspaControls?: string;
        },
      ) => {
        const rawPreset = options.preset ?? DEFAULT_CLEAN_PRESET_ID;
        const presetId = parsePresetId(rawPreset);

        if (presetId === null) {
          throw new Error(
            `Invalid --preset "${rawPreset}". Use speech-light, speech-soft-sox, or speech-vocals-demucs.`,
          );
        }

        const integrations = integrationFieldsFromCliOptions(options);

        handleRequest({
          kind: "clean",
          inputPath: input,
          maybeOutputPath: options.output,
          force: Boolean(options.force),
          dryRun: Boolean(options.dryRun),
          json: Boolean(options.json),
          allowVideoFallback: Boolean(options.allowVideoFallback),
          presetId,
          knobs: { noiseStrength: options.noiseStrength ?? 0.35 },
          ...integrations,
        });
      },
    );

  program
    .command("batch")
    .description(
      "Run preset cleanup on multiple media files with per-file outcomes and a batch manifest",
    )
    .option(
      "-i, --input <path>",
      "Input media file (repeatable)",
      collectPaths,
      [] as string[],
    )
    .option(
      "--glob <pattern>",
      "Glob pattern resolved from cwd (requires --accept-glob-risk)",
      collectPaths,
      [] as string[],
    )
    .option("--from-dir <dir>", "Scan directory recursively for media files")
    .option(
      "--accept-glob-risk",
      "Acknowledge that glob expansion may match many files",
      false,
    )
    .option(
      "--output-dir <dir>",
      "Write outputs under this directory (basename-preserving)",
    )
    .option(
      "--manifest <path>",
      "Batch manifest JSON path (default: ./batch-manifest.json in cwd)",
    )
    .option("--concurrency <n>", "Parallel clean jobs", "1")
    .option("--fail-fast", "Stop after the first failing file", false)
    .option("--force", "Allow overwriting existing outputs", false)
    .option("--dry-run", "Plan every file without invoking ffmpeg/sox", false)
    .option("--json", "Machine-readable batch summary on stdout", false)
    .option(
      "--allow-video-fallback",
      "Allow executing fallback-required preservation plans",
      false,
    )
    .option(
      "--preset <id>",
      "Preset id (speech-light | speech-soft-sox | speech-vocals-demucs)",
      DEFAULT_CLEAN_PRESET_ID,
    )
    .option(
      "--noise-strength <0..1>",
      "Noise reduction strength for afftdn mapping",
      parseNoiseStrength,
      0.35,
    )
    .option(
      "--accept-audacity-pipe-risk",
      "Acknowledge mod-script-pipe risk when using --audacity-macro",
      false,
    )
    .option(
      "--audacity-macro <name>",
      "Run Audacity macro on intermediate WAV in each batch item (requires risk flag)",
    )
    .option(
      "--ladspa-plugin-path <file>",
      "LADSPA plugin path for optional FFmpeg ladspa step (pair with --ladspa-label)",
    )
    .option("--ladspa-label <label>", "LADSPA label= for FFmpeg ladspa filter")
    .option("--ladspa-controls <string>", "Optional ladspa c= control string")
    .action(
      (options: {
        input?: string[];
        glob?: string[];
        fromDir?: string;
        acceptGlobRisk?: boolean;
        outputDir?: string;
        manifest?: string;
        concurrency?: string;
        failFast?: boolean;
        force?: boolean;
        dryRun?: boolean;
        json?: boolean;
        allowVideoFallback?: boolean;
        preset?: string;
        noiseStrength?: number;
        acceptAudacityPipeRisk?: boolean;
        audacityMacro?: string;
        ladspaPluginPath?: string;
        ladspaLabel?: string;
        ladspaControls?: string;
      }) => {
        const inputs = options.input ?? [];
        const globs = options.glob ?? [];
        const rawConcurrency = Number.parseInt(options.concurrency ?? "1", 10);

        if (!Number.isFinite(rawConcurrency) || rawConcurrency < 1) {
          throw new Error("concurrency must be an integer >= 1");
        }

        const rawPreset = options.preset ?? DEFAULT_CLEAN_PRESET_ID;
        const presetId = parsePresetId(rawPreset);

        if (presetId === null) {
          throw new Error(
            `Invalid --preset "${rawPreset}". Use speech-light, speech-soft-sox, or speech-vocals-demucs.`,
          );
        }

        const integrations = integrationFieldsFromCliOptions(options);

        handleRequest({
          kind: "batch",
          inputPaths: inputs,
          globs,
          maybeFromDir: options.fromDir,
          acceptGlobRisk: Boolean(options.acceptGlobRisk),
          maybeOutputDir: options.outputDir,
          maybeManifestPath: options.manifest,
          concurrency: rawConcurrency,
          failFast: Boolean(options.failFast),
          force: Boolean(options.force),
          dryRun: Boolean(options.dryRun),
          json: Boolean(options.json),
          allowVideoFallback: Boolean(options.allowVideoFallback),
          presetId,
          knobs: { noiseStrength: options.noiseStrength ?? 0.35 },
          ...integrations,
        });
      },
    );

  return program;
}

function collectPaths(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function integrationFieldsFromCliOptions(options: {
  readonly acceptAudacityPipeRisk?: boolean;
  readonly audacityMacro?: string;
  readonly ladspaPluginPath?: string;
  readonly ladspaLabel?: string;
  readonly ladspaControls?: string;
}): {
  readonly acceptAudacityPipeRisk: boolean;
  readonly maybeAudacityMacro?: string;
  readonly maybeLadspa?: LadspaIntegration;
} {
  const acceptAudacityPipeRisk = Boolean(options.acceptAudacityPipeRisk);
  const rawMacro =
    options.audacityMacro === undefined
      ? undefined
      : options.audacityMacro.trim();

  if (rawMacro !== undefined && rawMacro !== "" && !acceptAudacityPipeRisk) {
    throw new Error(
      "--audacity-macro requires --accept-audacity-pipe-risk (see docs/doctor.md).",
    );
  }

  const maybeAudacityMacro =
    rawMacro === undefined || rawMacro === "" ? undefined : rawMacro;

  const ladspaParsed = parseLadspaCliTriple({
    pluginPath: options.ladspaPluginPath,
    label: options.ladspaLabel,
    controls: options.ladspaControls,
  });

  if (ladspaParsed !== null && ladspaParsed.kind === "error") {
    throw new Error(ladspaParsed.message);
  }

  const maybeLadspa =
    ladspaParsed !== null && ladspaParsed.kind === "ok"
      ? ladspaParsed.value
      : undefined;

  return { acceptAudacityPipeRisk, maybeAudacityMacro, maybeLadspa };
}

export function resolveCliHelpTopicFromArgvToken(
  firstToken: string,
): CliHelpSubcommandTopic | undefined {
  const map: Partial<Record<string, CliHelpSubcommandTopic>> = {
    doctor: "doctor",
    "install-tools": "install-tools",
    "install-deps": "install-tools",
    guided: "guided",
    inspect: "inspect",
    clean: "clean",
    batch: "batch",
  };

  return map[firstToken];
}

function findRegisteredSubcommandByTopic(
  program: Command,
  topic: CliHelpSubcommandTopic,
): Command | undefined {
  if (topic === "install-tools") {
    return program.commands.find((c) => c.name() === "install-tools") as
      | Command
      | undefined;
  }

  return program.commands.find((c) => c.name() === topic) as
    | Command
    | undefined;
}

/** Builds help text shown for `show-help`, including scoped subcommand `-h|--help`. */
export function cliHelpDocumentation(
  program: Command,
  request: CliRequest,
): string {
  if (request.kind !== "show-help") {
    return program.helpInformation();
  }

  if (request.topic === undefined) {
    return program.helpInformation();
  }

  const nested = findRegisteredSubcommandByTopic(program, request.topic);

  return nested?.helpInformation() ?? program.helpInformation();
}
