import type {
  OutputModality,
  OutputPlan,
  PlannedAudioCodec,
  PlannedContainer,
} from "./output-plan";

/** Upper bound on derived preservation bullets — drop oldest extras first. */
export const MAX_PRESERVATION_NOTES = 5;

/** Serializable inspect output for CLI JSON mode and tests. */
export type InspectPlanSummary = {
  readonly inputPath: string;
  readonly outputPath: string;
  readonly modality: OutputModality;
  readonly selectedAudioStreamIndex: number | null;
  readonly plannedAudioCodec: PlannedAudioCodec | null;
  readonly plannedContainer: PlannedContainer | null;
  readonly reasonCodes: readonly string[];
  readonly preservationNotes: readonly string[];
};

export function buildPreservationNotesFromPlan(
  plan: OutputPlan,
): readonly string[] {
  const notes: string[] = [];

  switch (plan.modality) {
    case "unsupported":
      notes.push(
        `This probe is unsupported for processing with the planned pipeline (reason codes: ${plan.reasonCodes.join(", ")}).`,
      );
      break;
    case "audio-only":
      notes.push(
        "Output planning is audio-only; video stream-copy rules do not apply for this probe.",
      );
      break;
    case "video-copy-safe":
      notes.push(
        "Stream-copy path: lone H.264 stream + MP4 plan matches the Phase 3 v1 matrix (FFmpeg must still validate at execution).",
      );
      break;
    case "fallback-required": {
      notes.push(
        "Planning would require FFmpeg fallback steps—the default stream-copy-first posture cannot honor this probe under the v1 matrix.",
      );

      const primary = plan.reasonCodes[0];

      if (primary !== undefined) {
        notes.push(`Primary preservation reason code: ${primary}.`);
      }

      break;
    }
  }

  const capped =
    notes.length > MAX_PRESERVATION_NOTES
      ? notes.slice(notes.length - MAX_PRESERVATION_NOTES)
      : notes;

  return capped;
}

export function outputPlanToInspectSummary(
  plan: OutputPlan,
): InspectPlanSummary {
  const preservationNotes = buildPreservationNotesFromPlan(plan);

  if (plan.modality === "unsupported") {
    return {
      inputPath: plan.resolvedInputPath,
      outputPath: plan.resolvedOutputPath,
      modality: plan.modality,
      selectedAudioStreamIndex: null,
      plannedAudioCodec: null,
      plannedContainer: null,
      reasonCodes: plan.reasonCodes,
      preservationNotes,
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
    preservationNotes,
  };
}
