import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runFfprobeProbe } from "../adapters/ffprobe";
import {
  type ProcessResult,
  type ProcessRunner,
  runProcessCommand,
} from "../adapters/process-runner";
import { buildLogicalStepCommand } from "../domain/audio-pipeline-argv";
import {
  type CleanPresetKnobs,
  expandPreset,
  type PipelineWarning,
  type PresetId,
  presetRequiresSox,
} from "../domain/audio-pipeline-plan";
import type { CommandOutcome } from "../domain/command-outcome";
import type { MediaProbe } from "../domain/media-probe";
import { resolveOutputPath } from "../domain/output-path";
import { type OutputPlan, planMediaOutput } from "../domain/output-plan";
import { renderDisplayCommand } from "../domain/process-command";

import { describeFfprobeFailure, describePathFailure } from "./inspect";

export const MAX_CLEAN_STDERR_SNIPPET = 500;

export type CleanRunInput = {
  readonly inputPath: string;
  readonly maybeOutputPath?: string;
  readonly force: boolean;
  readonly dryRun: boolean;
  readonly json: boolean;
  readonly presetId: PresetId;
  readonly knobs: CleanPresetKnobs;
};

export type CleanStepSummary = {
  readonly tool: string;
  readonly displayCommand: string;
};

export type CleanPlanSummary = {
  readonly presetId: PresetId;
  readonly inputPath: string;
  readonly outputPath: string;
  readonly modality: string;
  readonly pipelineWarnings: readonly PipelineWarning[];
  readonly steps: readonly CleanStepSummary[];
};

export type CleanCliSuccess = {
  readonly json: boolean;
  readonly dryRun: boolean;
  readonly summary: CleanPlanSummary;
};

export type CleanCliOutcome = CommandOutcome & {
  readonly clean?: CleanCliSuccess;
};

export type CleanDeps = {
  readonly cwd: string;
  readonly maybeWhich: (name: string) => string | null;
  readonly runProcess: ProcessRunner;
  readonly outputExists: (absolutePath: string) => boolean;
  readonly mkdtempSync?: (prefix: string) => string;
  readonly rmSync?: (path: string, options?: { recursive?: boolean }) => void;
};

function audioLayoutForStream(
  probe: MediaProbe,
  streamIndex: number,
): { sampleRate: number; channelCount: number } {
  const stream = probe.streams.find((s) => s.index === streamIndex);

  if (stream === undefined || stream.codec_type !== "audio") {
    return { sampleRate: 48_000, channelCount: 2 };
  }

  const parsedRate = stream.sample_rate
    ? Number.parseInt(stream.sample_rate, 10)
    : 48_000;

  const channels =
    typeof stream.channels === "number"
      ? stream.channels
      : Number.parseInt(stream.channels ?? "2", 10);

  return {
    sampleRate: Number.isFinite(parsedRate) ? parsedRate : 48_000,
    channelCount: Number.isFinite(channels) && channels > 0 ? channels : 2,
  };
}

function mapProcessFailure(
  label: "ffmpeg" | "sox",
  result: ProcessResult,
): string {
  if (result.kind === "spawn-failed") {
    return `${label}: failed to spawn: ${result.error.message}`;
  }

  if (result.kind === "signaled") {
    return `${label}: terminated by signal ${result.signalCode}`;
  }

  const stderr = result.stderr.trim();
  const cap = MAX_CLEAN_STDERR_SNIPPET;
  const snippet = stderr.length <= cap ? stderr : `${stderr.slice(0, cap)}…`;

  return `${label}: exited with code ${result.exitCode}: ${snippet}`;
}

type AudioOnlyOutputPlan = OutputPlan & { modality: "audio-only" };

function buildStepSummaries(params: {
  readonly probe: MediaProbe;
  readonly plan: AudioOnlyOutputPlan;
  readonly presetId: PresetId;
  readonly knobs: CleanPresetKnobs;
  readonly ffmpegPath: string;
  readonly maybeWhich: (name: string) => string | null;
  readonly tempDirForPreview: string;
}): { readonly steps: readonly CleanStepSummary[] } {
  const expanded = expandPreset({
    presetId: params.presetId,
    knobs: params.knobs,
    plannedAudioCodec: params.plan.plannedAudioCodec,
    plannedContainer: params.plan.plannedContainer,
  });

  const { steps: logicalSteps } = expanded;
  const summaries: CleanStepSummary[] = [];
  let inputPathForStep = params.plan.resolvedInputPath;

  for (let i = 0; i < logicalSteps.length; i++) {
    const logical = logicalSteps[i];

    if (logical === undefined) {
      break;
    }
    const isEncode =
      logical.tool === "ffmpeg" && logical.step.kind === "encode-deliverable";
    const outPath = isEncode
      ? params.plan.resolvedOutputPath
      : join(params.tempDirForPreview, `step-${i}.wav`);

    const audioMeta = audioLayoutForStream(
      params.probe,
      params.plan.selectedAudioStreamIndex,
    );

    const maybeSoxExecutable =
      logical.tool === "sox"
        ? (params.maybeWhich("sox_ng") ?? params.maybeWhich("sox"))
        : null;

    const built = buildLogicalStepCommand({
      step: logical,
      ctx: {
        streamIndex: params.plan.selectedAudioStreamIndex,
        sampleRate: audioMeta.sampleRate,
        channelCount: audioMeta.channelCount,
        plannedAudioCodec: params.plan.plannedAudioCodec,
        plannedContainer: params.plan.plannedContainer,
        inputMediaPath: params.plan.resolvedInputPath,
        intermediateInPath: inputPathForStep,
        intermediateOutPath: outPath,
        finalOutputPath: params.plan.resolvedOutputPath,
      },
      ffmpegExecutable: params.ffmpegPath,
      maybeSoxExecutable,
    });

    if (built.kind !== "created") {
      summaries.push({
        tool: logical.tool,
        displayCommand: "(invalid command build)",
      });
    } else {
      summaries.push({
        tool: logical.tool,
        displayCommand: renderDisplayCommand(built.command),
      });
    }

    inputPathForStep = outPath;
  }

  return { steps: summaries };
}

export async function runCleanRequest(
  request: CleanRunInput,
  deps: Partial<CleanDeps> = {},
): Promise<CleanCliOutcome> {
  const cwd = deps.cwd ?? process.cwd();
  const maybeWhich = deps.maybeWhich ?? ((name: string) => Bun.which(name));
  const runProcess = deps.runProcess ?? runProcessCommand;
  const outputExists = deps.outputExists ?? ((p: string) => existsSync(p));
  const mkdtemp =
    deps.mkdtempSync ??
    ((prefix: string) => mkdtempSync(join(tmpdir(), prefix)));
  const rm =
    deps.rmSync ??
    ((path: string, options?: { recursive?: boolean }) => {
      rmSync(path, options);
    });

  const maybeFfprobe = maybeWhich("ffprobe");
  const maybeFfmpeg = maybeWhich("ffmpeg");

  if (maybeFfprobe === null || maybeFfmpeg === null) {
    const tools: string[] = [];

    if (maybeFfprobe === null) {
      tools.push("ffprobe");
    }

    if (maybeFfmpeg === null) {
      tools.push("ffmpeg");
    }

    return {
      kind: "failure",
      reason: { kind: "missing-tools", tools },
    };
  }

  const ffprobePath = maybeFfprobe;
  const ffmpegPath = maybeFfmpeg;

  const probeResult = await runFfprobeProbe({
    ffprobePath,
    inputPath: request.inputPath,
    runProcess,
  });

  if (!probeResult.ok) {
    return {
      kind: "failure",
      reason: {
        kind: "planning-failure",
        message: describeFfprobeFailure(probeResult.error),
      },
    };
  }

  const pathResult = resolveOutputPath({
    cwd,
    inputPath: request.inputPath,
    maybeExplicitOutput: request.maybeOutputPath,
    force: request.force,
    doesOutputExist: outputExists,
  });

  if (pathResult.kind !== "ok") {
    return {
      kind: "failure",
      reason: {
        kind: "planning-failure",
        message: describePathFailure(pathResult),
      },
    };
  }

  const plan = planMediaOutput({
    probe: probeResult.value,
    pathOutcome: pathResult,
  });

  if (plan.modality === "unsupported") {
    return {
      kind: "failure",
      reason: {
        kind: "invalid-input",
        message:
          "Unsupported input for the audio-only clean command. Run av-denoiser inspect to review this file and confirm modality before processing.",
      },
    };
  }

  if (plan.modality === "video-copy-safe") {
    return {
      kind: "failure",
      reason: {
        kind: "invalid-input",
        message:
          "Video-containing inputs are not supported by clean yet. Run av-denoiser inspect for a full plan; Phase 5 will add remux execution for this modality.",
      },
    };
  }

  if (plan.modality === "fallback-required") {
    return {
      kind: "failure",
      reason: {
        kind: "fallback-required",
        message:
          "Planned output requires video preservation fallback approval. The clean command does not run mixed A/V pipelines in this phase. Use av-denoiser inspect with --allow-video-fallback to preview, or wait for Phase 5.",
      },
    };
  }

  if (plan.modality !== "audio-only") {
    return {
      kind: "failure",
      reason: {
        kind: "invalid-input",
        message:
          "Internal error: clean path expected audio-only modality after gating.",
      },
    };
  }

  const audioOnlyPlan = plan as AudioOnlyOutputPlan;

  if (presetRequiresSox(request.presetId)) {
    const soxPath = maybeWhich("sox_ng") ?? maybeWhich("sox");

    if (soxPath === null) {
      return {
        kind: "failure",
        reason: {
          kind: "missing-tools",
          tools: ["sox", "sox_ng"],
        },
      };
    }
  }

  const expanded = expandPreset({
    presetId: request.presetId,
    knobs: request.knobs,
    plannedAudioCodec: audioOnlyPlan.plannedAudioCodec,
    plannedContainer: audioOnlyPlan.plannedContainer,
  });

  const { steps: logicalSteps, warnings: pipelineWarnings } = expanded;

  const previewDir = join(cwd, "av-denoiser-clean-preview");

  const stepSummaries = buildStepSummaries({
    probe: probeResult.value,
    plan: audioOnlyPlan,
    presetId: request.presetId,
    knobs: request.knobs,
    ffmpegPath,
    maybeWhich,
    tempDirForPreview: previewDir,
  }).steps;

  const summary: CleanPlanSummary = {
    presetId: request.presetId,
    inputPath: request.inputPath,
    outputPath: audioOnlyPlan.resolvedOutputPath,
    modality: audioOnlyPlan.modality,
    pipelineWarnings,
    steps: stepSummaries,
  };

  if (request.dryRun) {
    return {
      kind: "success",
      clean: {
        json: request.json,
        dryRun: true,
        summary,
      },
    };
  }

  let tempRoot: string;

  try {
    tempRoot = mkdtemp("av-denoiser-clean-");
  } catch (error: unknown) {
    return {
      kind: "failure",
      reason: {
        kind: "planning-failure",
        message: `Failed to allocate temp workspace: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
    };
  }

  let inputPathForStep = audioOnlyPlan.resolvedInputPath;
  let executionOk = false;

  try {
    for (let i = 0; i < logicalSteps.length; i++) {
      const logical = logicalSteps[i];

      if (logical === undefined) {
        break;
      }
      const isEncode =
        logical.tool === "ffmpeg" && logical.step.kind === "encode-deliverable";
      const outPath = isEncode
        ? audioOnlyPlan.resolvedOutputPath
        : join(tempRoot, `step-${i}.wav`);

      const audioMeta = audioLayoutForStream(
        probeResult.value,
        audioOnlyPlan.selectedAudioStreamIndex,
      );

      const maybeSoxExecutable =
        logical.tool === "sox"
          ? (maybeWhich("sox_ng") ?? maybeWhich("sox"))
          : null;

      const built = buildLogicalStepCommand({
        step: logical,
        ctx: {
          streamIndex: audioOnlyPlan.selectedAudioStreamIndex,
          sampleRate: audioMeta.sampleRate,
          channelCount: audioMeta.channelCount,
          plannedAudioCodec: audioOnlyPlan.plannedAudioCodec,
          plannedContainer: audioOnlyPlan.plannedContainer,
          inputMediaPath: audioOnlyPlan.resolvedInputPath,
          intermediateInPath: inputPathForStep,
          intermediateOutPath: outPath,
          finalOutputPath: audioOnlyPlan.resolvedOutputPath,
        },
        ffmpegExecutable: ffmpegPath,
        maybeSoxExecutable,
      });

      if (built.kind !== "created") {
        return {
          kind: "failure",
          reason: {
            kind: "processing-failure",
            message: `Could not build ${logical.tool} command for step ${i}.`,
          },
        };
      }

      const label = logical.tool === "sox" ? "sox" : "ffmpeg";
      const processResult = await runProcess(built.command);

      if (processResult.kind === "exited" && processResult.exitCode === 0) {
        inputPathForStep = outPath;
        continue;
      }

      return {
        kind: "failure",
        reason: {
          kind: "processing-failure",
          message: mapProcessFailure(label, processResult),
        },
      };
    }

    executionOk = true;
  } finally {
    if (executionOk) {
      try {
        rm(tempRoot, { recursive: true });
      } catch {
        /* leave workspace if cleanup fails */
      }
    }
  }

  return {
    kind: "success",
    clean: {
      json: request.json,
      dryRun: false,
      summary,
    },
  };
}
