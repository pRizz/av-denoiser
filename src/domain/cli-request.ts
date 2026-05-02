import type {
  CleanPresetKnobs,
  LadspaIntegration,
  PresetId,
} from "./audio-pipeline-plan";

/** Canonical subcommands that support `av-denoiser <name> [--options] ... --help` help text. */
export type CliHelpSubcommandTopic =
  | "doctor"
  | "install-tools"
  | "guided"
  | "inspect"
  | "clean"
  | "batch";

export type CliRequest =
  | { readonly kind: "show-default" }
  | {
      readonly kind: "show-help";
      /** When set, print this subcommand's options (instead of root command list only). */
      readonly topic?: CliHelpSubcommandTopic;
    }
  | { readonly kind: "doctor" }
  | {
      readonly kind: "install-tools";
      readonly dryRun: boolean;
      readonly includeOptional: boolean;
      /** When true, run optional Demucs install (`uv tool install demucs`) without prompting (non-TTY). */
      readonly assumeYes: boolean;
    }
  | { readonly kind: "guided-clean" }
  | {
      readonly kind: "inspect";
      readonly inputPath: string;
      readonly maybeOutputPath?: string;
      readonly force: boolean;
      readonly json: boolean;
      readonly allowVideoFallback: boolean;
    }
  | {
      readonly kind: "clean";
      readonly inputPath: string;
      readonly maybeOutputPath?: string;
      readonly force: boolean;
      readonly dryRun: boolean;
      readonly json: boolean;
      readonly presetId: PresetId;
      readonly knobs: CleanPresetKnobs;
      readonly allowVideoFallback: boolean;
      readonly acceptAudacityPipeRisk: boolean;
      readonly maybeAudacityMacro?: string;
      readonly maybeLadspa?: LadspaIntegration;
    }
  | {
      readonly kind: "batch";
      readonly inputPaths: readonly string[];
      readonly globs: readonly string[];
      readonly maybeFromDir?: string;
      readonly acceptGlobRisk: boolean;
      readonly maybeOutputDir?: string;
      readonly maybeManifestPath?: string;
      readonly concurrency: number;
      readonly failFast: boolean;
      readonly force: boolean;
      readonly dryRun: boolean;
      readonly json: boolean;
      readonly presetId: PresetId;
      readonly knobs: CleanPresetKnobs;
      readonly allowVideoFallback: boolean;
      readonly acceptAudacityPipeRisk: boolean;
      readonly maybeAudacityMacro?: string;
      readonly maybeLadspa?: LadspaIntegration;
    };

export type CliRequestResult =
  | { readonly kind: "parsed"; readonly request: CliRequest }
  | { readonly kind: "parse-error"; readonly message: string };
