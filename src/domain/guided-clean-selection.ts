import type { PresetId } from "./audio-pipeline-plan";

/** Prompt-derived inputs for guided clean — mirrors `CleanRunInput` without `json`. */
export type GuidedCleanSelections = {
  readonly inputPath: string;
  readonly maybeOutputPath?: string;
  readonly force: boolean;
  readonly dryRun: boolean;
  readonly presetId: PresetId;
  readonly noiseStrength: number;
  readonly allowVideoFallback: boolean;
};
