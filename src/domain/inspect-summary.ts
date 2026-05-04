import type {
  OutputModality,
  OutputPlan,
  PlannedAudioCodec,
  PlannedContainer,
} from "./output-plan";

/** Upper bound on derived preservation bullets — drop oldest extras first. */
export const MAX_PRESERVATION_NOTES = 5;

/**
 * User-facing video policy (inspect bullets / docs should stay aligned):
 * We try to keep the video track as-is (stream copy) when the feasibility matrix allows.
 * `--allow-video-reencode` means the user accepts re-encoding video (HEVC/libx265 to MP4 here)
 * when stream-copy-only is not possible for that input.
 */

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
    // Preserve order when trimming to MAX_PRESERVATION_NOTES: container copy line,
    // HDR/side-data caveat (where applicable), FFmpeg execution reminder.
    case "video-copy-safe": {
      if (plan.plannedContainer === "mp4") {
        notes.push(
          "Video stays as-is (stream copy) when possible: lone video on the MP4 allowlist (H.264, HEVC/H.265, or AV1); planned output is MP4 + AAC. FFmpeg must still validate remux at execution.",
        );
        notes.push(
          "HEVC HDR or advanced side data is best-effort: stream copy preserves compressed video bytes; container/player behavior may still differ from the source.",
        );
      } else if (plan.plannedContainer === "webm") {
        notes.push(
          "Video stays as-is (stream copy) when possible: VP9 with WebM container pairing; planned output is WebM + Opus. FFmpeg must still validate remux at execution.",
        );
        notes.push(
          "VP9 HDR, transfer characteristics, or side metadata are best-effort: stream copy preserves compressed video bytes; container/player color behavior may still differ from the source.",
        );
      } else if (plan.plannedContainer === "matroska") {
        notes.push(
          "Video stays as-is (stream copy) when possible: Theora with Matroska container pairing; planned output is MKV + AAC. FFmpeg must still validate remux at execution.",
        );
        notes.push(
          "Theora color metadata or side data is best-effort: stream copy preserves compressed video bytes; container/player behavior may still differ from the source.",
        );
      } else {
        notes.push(
          "Video stays as-is (stream copy) when possible: planned container follows the feasibility matrix; FFmpeg must still validate remux at execution.",
        );
      }

      break;
    }
    case "fallback-required": {
      notes.push(
        "This file cannot be handled while keeping the video track as-is (stream copy only) under the v1 matrix. Without further approval, the CLI stops here instead of re-encoding video.",
      );

      const primary = plan.reasonCodes[0];

      if (primary !== undefined) {
        notes.push(
          `Primary reason stream-copy-only video is not available: ${primary}.`,
        );
      }

      notes.push(
        "Pass --allow-video-reencode to allow re-encoding the video to HEVC (libx265) in MP4 (CRF 28, preset slow)—slower than stream-copy.",
      );

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
