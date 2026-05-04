import type { LadspaIntegration, PresetId } from "./audio-pipeline-plan";

/** Prompt-derived inputs for guided denoise — mirrors `DenoiseRunInput` without `json` (Phase 6 + Phase 8 optional integrations). */
export type GuidedDenoiseSelections = {
  readonly inputPath: string;
  readonly maybeOutputPath?: string;
  readonly force: boolean;
  readonly dryRun: boolean;
  readonly presetId: PresetId;
  readonly noiseStrength: number;
  readonly allowVideoReencode: boolean;
  readonly acceptAudacityPipeRisk: boolean;
  readonly maybeAudacityMacro?: string;
  readonly maybeLadspa?: LadspaIntegration;
};
