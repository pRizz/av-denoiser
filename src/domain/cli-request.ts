import type { CleanPresetKnobs, PresetId } from "./audio-pipeline-plan";

export type CliRequest =
  | { readonly kind: "show-default" }
  | { readonly kind: "show-help" }
  | { readonly kind: "doctor" }
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
    };

export type CliRequestResult =
  | { readonly kind: "parsed"; readonly request: CliRequest }
  | { readonly kind: "parse-error"; readonly message: string };
