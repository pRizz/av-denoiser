import type { LadspaIntegration, PresetId } from "./audio-pipeline-plan";

/** Prompt-derived inputs for guided clean — mirrors `CleanRunInput` without `json` (Phase 6 + Phase 8 optional integrations). */
export type GuidedCleanSelections = {
  readonly inputPath: string;
  readonly maybeOutputPath?: string;
  readonly force: boolean;
  readonly dryRun: boolean;
  readonly presetId: PresetId;
  readonly noiseStrength: number;
  readonly allowVideoFallback: boolean;
  readonly acceptAudacityPipeRisk: boolean;
  readonly maybeAudacityMacro?: string;
  readonly maybeLadspa?: LadspaIntegration;
};
