import type { PlannedAudioCodec, PlannedContainer } from "./output-plan";

export type PresetId =
  | "speech-light"
  | "speech-soft-sox"
  | "speech-vocals-demucs";

export const DEFAULT_DENOISE_PRESET_ID: PresetId = "speech-light";

export type DenoisePresetKnobs = { readonly noiseStrength: number };

export type PipelineWarning = {
  readonly id: string;
  readonly title: string;
  readonly detail?: string;
};

export type FfmpegLogicalStep =
  | { readonly kind: "extract-pcm-wav"; readonly interchange: "wav-pcm-s16le" }
  | { readonly kind: "afftdn"; readonly noiseStrength: number }
  | {
      readonly kind: "ladspa-apply";
      /** Absolute path to `.so` / plugin file (user-supplied). */
      readonly pluginPath: string;
      readonly label: string;
      readonly controls: string;
    }
  | {
      readonly kind: "encode-deliverable";
      readonly audioCodec: PlannedAudioCodec;
      readonly container: PlannedContainer;
    };

export type SoxLogicalStep = { readonly kind: "gentle-dynamics" };

export type AudacityLogicalStep = {
  readonly kind: "macro";
  readonly macroName: string;
};

/** Demucs v4 layout: `-o <dir>` then `<dir>/<model>/<trackStem>/vocals.wav` [ASSUMED: validated in tests]. */
export type DemucsLogicalStep = {
  readonly kind: "two-stems-vocals";
  readonly model: string;
};

export type LogicalPipelineStep =
  | { readonly tool: "ffmpeg"; readonly step: FfmpegLogicalStep }
  | { readonly tool: "sox"; readonly step: SoxLogicalStep }
  | { readonly tool: "demucs"; readonly step: DemucsLogicalStep }
  | { readonly tool: "audacity"; readonly step: AudacityLogicalStep };

export type ExpandedLogicalPipeline = {
  readonly steps: readonly LogicalPipelineStep[];
  readonly warnings: readonly PipelineWarning[];
};

export type ExpandPresetInput = {
  readonly presetId: PresetId;
  readonly knobs: DenoisePresetKnobs;
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

const WARN_DEMUCS_MODEL = {
  id: "warn-demucs-model-download",
  title:
    "Demucs may download model weights on first run (network, disk, and time)",
} as const;

const WARN_DEMUCS_HEAVY = {
  id: "warn-demucs-heavy-runtime",
  title: "Demucs source separation is CPU/GPU-heavy and can take a long time",
} as const;

const WARN_DEMUCS_RESOURCE = {
  id: "warn-demucs-resource",
  title: "Demucs can use significant RAM; close other heavy apps if needed",
} as const;

/** Default separation model for `speech-vocals-demucs` (bounded v1 choice). */
export const DEFAULT_DEMUCS_MODEL = "htdemucs";

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
  knobs: DenoisePresetKnobs,
  plannedAudioCodec: PlannedAudioCodec,
  plannedContainer: PlannedContainer,
): readonly LogicalPipelineStep[] {
  const noiseStrength = clampNoiseStrength(knobs.noiseStrength);

  if (presetId === "speech-vocals-demucs") {
    return [
      {
        tool: "ffmpeg",
        step: { kind: "extract-pcm-wav", interchange: "wav-pcm-s16le" },
      },
      {
        tool: "demucs",
        step: { kind: "two-stems-vocals", model: DEFAULT_DEMUCS_MODEL },
      },
      {
        tool: "ffmpeg",
        step: {
          kind: "encode-deliverable",
          audioCodec: plannedAudioCodec,
          container: plannedContainer,
        },
      },
    ];
  }

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

export function presetRequiresDemucs(presetId: PresetId): boolean {
  return presetId === "speech-vocals-demucs";
}

export function parsePresetId(raw: string): PresetId | null {
  if (
    raw === "speech-light" ||
    raw === "speech-soft-sox" ||
    raw === "speech-vocals-demucs"
  ) {
    return raw;
  }

  return null;
}

export function expandPreset(
  input: ExpandPresetInput,
): ExpandedLogicalPipeline {
  const warnings: PipelineWarning[] = [];

  if (input.presetId === "speech-vocals-demucs") {
    warnings.push(
      { id: WARN_DEMUCS_MODEL.id, title: WARN_DEMUCS_MODEL.title },
      { id: WARN_DEMUCS_HEAVY.id, title: WARN_DEMUCS_HEAVY.title },
      { id: WARN_DEMUCS_RESOURCE.id, title: WARN_DEMUCS_RESOURCE.title },
    );
  } else {
    warnings.push({ id: WARN_HEAVY_CPU.id, title: WARN_HEAVY_CPU.title });
  }

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

export type LadspaIntegration = {
  readonly pluginPath: string;
  readonly label: string;
  readonly controls: string;
};

const LADSPA_LABEL_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
const LADSPA_CONTROLS_RE = /^[a-zA-Z0-9_|.,:=\-/\s]*$/;

export function parseLadspaCliTriple(input: {
  readonly pluginPath?: string;
  readonly label?: string;
  readonly controls?: string;
}):
  | null
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "ok"; readonly value: LadspaIntegration } {
  const rawPath = input.pluginPath;
  const rawLabel = input.label;
  const rawControls = input.controls;

  const hasPath = rawPath !== undefined && rawPath.trim() !== "";
  const hasLabel = rawLabel !== undefined && rawLabel.trim() !== "";
  const hasControlsFlag = rawControls !== undefined;

  if (!hasPath && !hasLabel && !hasControlsFlag) {
    return null;
  }

  if (!hasPath || !hasLabel) {
    return {
      kind: "error",
      message:
        "LADSPA: pass --ladspa-plugin-path and --ladspa-label together (optional --ladspa-controls; see doctor and LADSPA_PATH).",
    };
  }

  const pluginPath = rawPath.trim();
  const label = rawLabel.trim();
  const controls = rawControls === undefined ? "" : rawControls.trim();

  if (/['";|`$]/.test(pluginPath) || pluginPath.includes("\n")) {
    return {
      kind: "error",
      message: "LADSPA: plugin path contains unsupported characters.",
    };
  }

  if (!LADSPA_LABEL_RE.test(label)) {
    return {
      kind: "error",
      message:
        "LADSPA: --ladspa-label failed validation (use letters, digits, _, ., -).",
    };
  }

  if (!LADSPA_CONTROLS_RE.test(controls)) {
    return {
      kind: "error",
      message: "LADSPA: --ladspa-controls failed validation.",
    };
  }

  return { kind: "ok", value: { pluginPath, label, controls } };
}

export function insertBeforeEncodeDeliverable(
  steps: readonly LogicalPipelineStep[],
  insert: readonly LogicalPipelineStep[],
): LogicalPipelineStep[] {
  const idx = steps.findIndex(
    (s) => s.tool === "ffmpeg" && s.step.kind === "encode-deliverable",
  );

  if (idx === -1) {
    return [...steps, ...insert];
  }

  return [...steps.slice(0, idx), ...insert, ...steps.slice(idx)];
}

export function applyIntegrationsToLogicalSteps(
  steps: readonly LogicalPipelineStep[],
  options: {
    readonly maybeLadspa?: LadspaIntegration;
    readonly maybeAudacityMacro?: string;
    readonly acceptAudacityPipeRisk: boolean;
  },
):
  | { readonly kind: "ok"; readonly steps: LogicalPipelineStep[] }
  | { readonly kind: "error"; readonly message: string } {
  let next: LogicalPipelineStep[] = [...steps];

  if (options.maybeLadspa !== undefined) {
    next = insertBeforeEncodeDeliverable(next, [
      {
        tool: "ffmpeg",
        step: {
          kind: "ladspa-apply",
          pluginPath: options.maybeLadspa.pluginPath,
          label: options.maybeLadspa.label,
          controls: options.maybeLadspa.controls,
        },
      },
    ]);
  }

  if (options.maybeAudacityMacro !== undefined) {
    if (!options.acceptAudacityPipeRisk) {
      return {
        kind: "error",
        message:
          "Audacity macro requires --accept-audacity-pipe-risk (see docs/doctor.md).",
      };
    }

    const name = options.maybeAudacityMacro.trim();

    if (name === "") {
      return {
        kind: "error",
        message: "Audacity macro name must be non-empty.",
      };
    }

    next = insertBeforeEncodeDeliverable(next, [
      { tool: "audacity", step: { kind: "macro", macroName: name } },
    ]);
  }

  return { kind: "ok", steps: next };
}
