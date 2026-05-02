import type { PlannedAudioCodec, PlannedContainer } from "./output-plan";

export type PresetId = "speech-light" | "speech-soft-sox";

export const DEFAULT_CLEAN_PRESET_ID: PresetId = "speech-light";

export type CleanPresetKnobs = { readonly noiseStrength: number };

export type PipelineWarning = {
  readonly id: string;
  readonly title: string;
  readonly detail?: string;
};

export type FfmpegLogicalStep =
  | { readonly kind: "extract-pcm-wav"; readonly interchange: "wav-pcm-s16le" }
  | { readonly kind: "afftdn"; readonly noiseStrength: number }
  | {
      readonly kind: "encode-deliverable";
      readonly audioCodec: PlannedAudioCodec;
      readonly container: PlannedContainer;
    };

export type SoxLogicalStep = { readonly kind: "gentle-dynamics" };

export type LogicalPipelineStep =
  | { readonly tool: "ffmpeg"; readonly step: FfmpegLogicalStep }
  | { readonly tool: "sox"; readonly step: SoxLogicalStep };

export type ExpandedLogicalPipeline = {
  readonly steps: readonly LogicalPipelineStep[];
  readonly warnings: readonly PipelineWarning[];
};

export type ExpandPresetInput = {
  readonly presetId: PresetId;
  readonly knobs: CleanPresetKnobs;
  readonly plannedAudioCodec: PlannedAudioCodec;
  readonly plannedContainer: PlannedContainer;
};

const WARN_HEAVY_CPU = {
  id: "warn-heavy-cpu-ffmpeg-afftdn",
  title: "FFmpeg afftdn can be CPU-heavy on long files",
} as const;

const WARN_SOX_ARTIFACT = {
  id: "warn-sox-dynamics-artifact-risk",
  title: "SoX dynamics can introduce pumping or artifacts on some sources",
} as const;

function clampNoiseStrength(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function orderedSteps(
  presetId: PresetId,
  knobs: CleanPresetKnobs,
  plannedAudioCodec: PlannedAudioCodec,
  plannedContainer: PlannedContainer,
): readonly LogicalPipelineStep[] {
  const noiseStrength = clampNoiseStrength(knobs.noiseStrength);

  const core: LogicalPipelineStep[] = [
    {
      tool: "ffmpeg",
      step: { kind: "extract-pcm-wav", interchange: "wav-pcm-s16le" },
    },
    {
      tool: "ffmpeg",
      step: { kind: "afftdn", noiseStrength },
    },
  ];

  if (presetId === "speech-soft-sox") {
    core.push({ tool: "sox", step: { kind: "gentle-dynamics" } });
  }

  core.push({
    tool: "ffmpeg",
    step: {
      kind: "encode-deliverable",
      audioCodec: plannedAudioCodec,
      container: plannedContainer,
    },
  });

  return core;
}

export function presetRequiresSox(presetId: PresetId): boolean {
  return presetId === "speech-soft-sox";
}

export function parsePresetId(raw: string): PresetId | null {
  if (raw === "speech-light" || raw === "speech-soft-sox") {
    return raw;
  }

  return null;
}

export function expandPreset(
  input: ExpandPresetInput,
): ExpandedLogicalPipeline {
  const warnings: PipelineWarning[] = [
    { id: WARN_HEAVY_CPU.id, title: WARN_HEAVY_CPU.title },
  ];

  if (input.presetId === "speech-soft-sox") {
    warnings.push({
      id: WARN_SOX_ARTIFACT.id,
      title: WARN_SOX_ARTIFACT.title,
    });
  }

  return {
    steps: orderedSteps(
      input.presetId,
      input.knobs,
      input.plannedAudioCodec,
      input.plannedContainer,
    ),
    warnings,
  };
}
