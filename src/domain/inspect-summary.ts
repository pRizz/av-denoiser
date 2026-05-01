import type {
  OutputModality,
  OutputPlan,
  PlannedAudioCodec,
  PlannedContainer,
} from "./output-plan";

/** Serializable inspect output for CLI JSON mode and tests. */
export type InspectPlanSummary = {
  readonly inputPath: string;
  readonly outputPath: string;
  readonly modality: OutputModality;
  readonly selectedAudioStreamIndex: number | null;
  readonly plannedAudioCodec: PlannedAudioCodec | null;
  readonly plannedContainer: PlannedContainer | null;
  readonly reasonCodes: readonly string[];
};

export function outputPlanToInspectSummary(
  plan: OutputPlan,
): InspectPlanSummary {
  if (plan.modality === "unsupported") {
    return {
      inputPath: plan.resolvedInputPath,
      outputPath: plan.resolvedOutputPath,
      modality: plan.modality,
      selectedAudioStreamIndex: null,
      plannedAudioCodec: null,
      plannedContainer: null,
      reasonCodes: plan.reasonCodes,
    };
  }

  return {
    inputPath: plan.resolvedInputPath,
    outputPath: plan.resolvedOutputPath,
    modality: plan.modality,
    selectedAudioStreamIndex: plan.selectedAudioStreamIndex,
    plannedAudioCodec: plan.plannedAudioCodec,
    plannedContainer: plan.plannedContainer,
    reasonCodes: plan.reasonCodes,
  };
}
