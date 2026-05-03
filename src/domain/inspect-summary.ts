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
    case "video-copy-safe": {
      if (plan.plannedContainer === "mp4") {
        notes.push(
          "Stream-copy path: lone video on the MP4 allowlist (H.264, HEVC/H.265, or AV1); planned output is MP4 + AAC. FFmpeg must still validate remux at execution.",
        );
        notes.push(
          "HEVC HDR or advanced side data is best-effort: stream copy preserves compressed video bytes; container/player behavior may still differ from the source.",
        );
      } else if (plan.plannedContainer === "webm") {
        notes.push(
          "Stream-copy path: VP9 with WebM container pairing; planned output is WebM + Opus. FFmpeg must still validate remux at execution.",
        );
      } else if (plan.plannedContainer === "matroska") {
        notes.push(
          "Stream-copy path: Theora with Matroska container pairing; planned output is MKV + AAC. FFmpeg must still validate remux at execution.",
        );
      } else {
        notes.push(
          "Stream-copy path: planned container follows the feasibility matrix; FFmpeg must still validate remux at execution.",
        );
      }

      break;
    }
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
