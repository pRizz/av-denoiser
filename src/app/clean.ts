import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
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
  type LogicalPipelineStep,
  type PipelineWarning,
  type PresetId,
  presetRequiresSox,
} from "../domain/audio-pipeline-plan";
import { verifyCleanOutput } from "../domain/clean-output-verify";
import {
  type CleanRunReport,
  labelsForDroppedStreams,
  renderCleanRunReportText,
} from "../domain/clean-run-report";
import type { CommandOutcome } from "../domain/command-outcome";
import type { MediaProbe } from "../domain/media-probe";
import { resolveOutputPath } from "../domain/output-path";
import { type OutputPlan, planMediaOutput } from "../domain/output-plan";
import { renderDisplayCommand } from "../domain/process-command";
import {
  buildExtractPrimaryAudioWavCommand,
  buildRemuxVideoCopyCommand,
} from "../domain/video-clean-argv";

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
  readonly allowVideoFallback: boolean;
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
  readonly maybeReportText?: string;
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
  /** Test injection for post-run verification without real output files. */
  readonly outputFileSize?: (absolutePath: string) => number;
  /** Coarse milestones during non–dry-run execution (`probe`, `step:N`, `verify`). */
  readonly reportProgress?: (phase: string) => void;
};

type ExecutableOutputPlan = Exclude<OutputPlan, { modality: "unsupported" }>;

type AudioOnlyOutputPlan = OutputPlan & { modality: "audio-only" };

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

function isVideoCleanModality(
  plan: ExecutableOutputPlan,
): plan is ExecutableOutputPlan & {
  readonly modality: "video-copy-safe" | "fallback-required";
} {
  return (
    plan.modality === "video-copy-safe" || plan.modality === "fallback-required"
  );
}

function buildStepSummariesFromLogicalSteps(params: {
  readonly logicalSteps: readonly LogicalPipelineStep[];
  readonly probe: MediaProbe;
  readonly plan: ExecutableOutputPlan;
  readonly ffmpegPath: string;
  readonly maybeWhich: (name: string) => string | null;
  readonly tempDirForPreview: string;
  readonly bootstrapIntermediatePath: string;
  readonly ctxInputMediaPath: string;
  readonly finalDeliverablePath: string;
}): { readonly steps: readonly CleanStepSummary[] } {
  const summaries: CleanStepSummary[] = [];
  let inputPathForStep = params.bootstrapIntermediatePath;

  for (let i = 0; i < params.logicalSteps.length; i++) {
    const logical = params.logicalSteps[i];

    if (logical === undefined) {
      break;
    }

    const isEncode =
      logical.tool === "ffmpeg" && logical.step.kind === "encode-deliverable";
    const outPath = isEncode
      ? params.finalDeliverablePath
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
        inputMediaPath: params.ctxInputMediaPath,
        intermediateInPath: inputPathForStep,
        intermediateOutPath: outPath,
        finalOutputPath: params.finalDeliverablePath,
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

function buildAudioOnlyStepSummaries(params: {
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

  return buildStepSummariesFromLogicalSteps({
    logicalSteps: expanded.steps,
    probe: params.probe,
    plan: params.plan,
    ffmpegPath: params.ffmpegPath,
    maybeWhich: params.maybeWhich,
    tempDirForPreview: params.tempDirForPreview,
    bootstrapIntermediatePath: params.plan.resolvedInputPath,
    ctxInputMediaPath: params.plan.resolvedInputPath,
    finalDeliverablePath: params.plan.resolvedOutputPath,
  });
}

async function runSequentialPipeline(params: {
  readonly logicalSteps: readonly LogicalPipelineStep[];
  readonly probe: MediaProbe;
  readonly plan: ExecutableOutputPlan;
  readonly tempRoot: string;
  readonly ffmpegPath: string;
  readonly maybeWhich: (name: string) => string | null;
  readonly runProcess: ProcessRunner;
  readonly bootstrapIntermediatePath: string;
  readonly ctxInputMediaPath: string;
  readonly finalDeliverablePath: string;
  readonly reportProgress?: (phase: string) => void;
  readonly stepIndexOffset?: number;
}): Promise<CleanCliOutcome | null> {
  let inputPathForStep = params.bootstrapIntermediatePath;
  const offset = params.stepIndexOffset ?? 0;

  for (let i = 0; i < params.logicalSteps.length; i++) {
    const logical = params.logicalSteps[i];

    if (logical === undefined) {
      break;
    }

    params.reportProgress?.(`step:${offset + i}`);
    const isEncode =
      logical.tool === "ffmpeg" && logical.step.kind === "encode-deliverable";
    const outPath = isEncode
      ? params.finalDeliverablePath
      : join(params.tempRoot, `step-${i}.wav`);

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
        inputMediaPath: params.ctxInputMediaPath,
        intermediateInPath: inputPathForStep,
        intermediateOutPath: outPath,
        finalOutputPath: params.finalDeliverablePath,
      },
      ffmpegExecutable: params.ffmpegPath,
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
    const processResult = await params.runProcess(built.command);

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

  return null;
}

async function finalizeCleanSuccess(params: {
  readonly outputPath: string;
  readonly inputProbe: MediaProbe;
  readonly ffprobePath: string;
  readonly runProcess: ProcessRunner;
  readonly outputExists: (p: string) => boolean;
  readonly outputFileSize: (p: string) => number;
  readonly plannedModality: ExecutableOutputPlan["modality"];
  readonly claimedVideoCopied: boolean;
  readonly baseSuccess: CleanCliSuccess;
  readonly report: Omit<CleanRunReport, "verificationOk">;
  readonly reportProgress?: (phase: string) => void;
}): Promise<CleanCliOutcome> {
  const outProbe = await runFfprobeProbe({
    ffprobePath: params.ffprobePath,
    inputPath: params.outputPath,
    runProcess: params.runProcess,
  });

  if (!outProbe.ok) {
    return {
      kind: "failure",
      reason: {
        kind: "processing-failure",
        message: `Output probe failed: ${describeFfprobeFailure(outProbe.error)}`,
      },
    };
  }

  let measuredSize: number;

  try {
    measuredSize = params.outputFileSize(params.outputPath);
  } catch (error: unknown) {
    return {
      kind: "failure",
      reason: {
        kind: "processing-failure",
        message:
          error instanceof Error
            ? error.message
            : "Could not stat output file after write.",
      },
    };
  }

  params.reportProgress?.("verify");

  const verify = verifyCleanOutput({
    outputPath: params.outputPath,
    outputExists: params.outputExists,
    outputFileSize: () => measuredSize,
    inputProbe: params.inputProbe,
    outputProbe: outProbe.value,
    plannedModality:
      params.plannedModality === "audio-only"
        ? "audio-only"
        : params.plannedModality === "video-copy-safe"
          ? "video-copy-safe"
          : "fallback-required",
    claimedVideoCopied: params.claimedVideoCopied,
  });

  const verificationOk = verify.kind === "ok";

  const fullReport: CleanRunReport = {
    ...params.report,
    verificationOk,
  };

  const reportText =
    verify.kind === "failure"
      ? `${renderCleanRunReportText(fullReport).trimEnd()}\nVerify: ${verify.detail}\n`
      : renderCleanRunReportText(fullReport);

  return {
    kind: "success",
    clean: {
      ...params.baseSuccess,
      maybeReportText: reportText,
    },
  };
}

export async function runCleanRequest(
  request: CleanRunInput,
  deps: Partial<CleanDeps> = {},
): Promise<CleanCliOutcome> {
  const cwd = deps.cwd ?? process.cwd();
  const maybeWhich = deps.maybeWhich ?? ((name: string) => Bun.which(name));
  const runProcess = deps.runProcess ?? runProcessCommand;
  const outputExists = deps.outputExists ?? ((p: string) => existsSync(p));
  const resolveOutputFileSize =
    deps.outputFileSize ?? ((p: string) => statSync(p).size);
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
          "Unsupported input for clean. Run av-denoiser inspect to review this file and confirm modality before processing.",
      },
    };
  }

  if (plan.modality === "fallback-required" && !request.allowVideoFallback) {
    return {
      kind: "failure",
      reason: {
        kind: "fallback-required",
        message:
          "Planned output requires video preservation fallback approval. Run av-denoiser clean with --allow-video-fallback (or av-denoiser inspect with --allow-video-fallback to preview).",
      },
    };
  }

  const executablePlan = plan as ExecutableOutputPlan;

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
    plannedAudioCodec: executablePlan.plannedAudioCodec,
    plannedContainer: executablePlan.plannedContainer,
  });

  const { steps: logicalSteps, warnings: pipelineWarnings } = expanded;

  const previewDir = join(cwd, "av-denoiser-clean-preview");

  let stepSummaries: readonly CleanStepSummary[];

  if (isVideoCleanModality(executablePlan)) {
    const audioMeta = audioLayoutForStream(
      probeResult.value,
      executablePlan.selectedAudioStreamIndex,
    );

    const extractPathPreview = join(previewDir, "extracted.wav");
    const pipelineAudioPreviewPath = join(previewDir, "pipeline-audio-out.mp4");

    const extractBuilt = buildExtractPrimaryAudioWavCommand({
      ffmpegExecutable: ffmpegPath,
      inputVideoPath: executablePlan.resolvedInputPath,
      selectedAudioStreamIndex: executablePlan.selectedAudioStreamIndex,
      sampleRate: audioMeta.sampleRate,
      channelCount: audioMeta.channelCount,
      outputWavPath: extractPathPreview,
    });

    const extractSummary: CleanStepSummary =
      extractBuilt.kind === "created"
        ? {
            tool: "ffmpeg",
            displayCommand: renderDisplayCommand(extractBuilt.command),
          }
        : {
            tool: "ffmpeg",
            displayCommand: "(invalid extract command build)",
          };

    const sliced = logicalSteps.slice(1);

    const pipelineSummaries = buildStepSummariesFromLogicalSteps({
      logicalSteps: sliced,
      probe: probeResult.value,
      plan: executablePlan,
      ffmpegPath,
      maybeWhich,
      tempDirForPreview: previewDir,
      bootstrapIntermediatePath: extractPathPreview,
      ctxInputMediaPath: extractPathPreview,
      finalDeliverablePath: pipelineAudioPreviewPath,
    }).steps;

    const remuxBuilt = buildRemuxVideoCopyCommand({
      ffmpegExecutable: ffmpegPath,
      originalVideoPath: executablePlan.resolvedInputPath,
      processedAudioPath: pipelineAudioPreviewPath,
      resolvedOutputPath: executablePlan.resolvedOutputPath,
      plannedAudioCodec: executablePlan.plannedAudioCodec,
    });

    const remuxSummary: CleanStepSummary =
      remuxBuilt.kind === "created"
        ? {
            tool: "ffmpeg",
            displayCommand: renderDisplayCommand(remuxBuilt.command),
          }
        : {
            tool: "ffmpeg",
            displayCommand: "(invalid remux command build)",
          };

    stepSummaries = [extractSummary, ...pipelineSummaries, remuxSummary];
  } else {
    stepSummaries = buildAudioOnlyStepSummaries({
      probe: probeResult.value,
      plan: executablePlan as AudioOnlyOutputPlan,
      presetId: request.presetId,
      knobs: request.knobs,
      ffmpegPath,
      maybeWhich,
      tempDirForPreview: previewDir,
    }).steps;
  }

  const summary: CleanPlanSummary = {
    presetId: request.presetId,
    inputPath: request.inputPath,
    outputPath: executablePlan.resolvedOutputPath,
    modality: executablePlan.modality,
    pipelineWarnings,
    steps: stepSummaries,
  };

  const baseDrySuccess: CleanCliSuccess = {
    json: request.json,
    dryRun: request.dryRun,
    summary,
  };

  if (request.dryRun) {
    return {
      kind: "success",
      clean: baseDrySuccess,
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

  let executionOk = false;

  try {
    deps.reportProgress?.("probe");

    if (isVideoCleanModality(executablePlan)) {
      const audioMeta = audioLayoutForStream(
        probeResult.value,
        executablePlan.selectedAudioStreamIndex,
      );

      const extractPath = join(tempRoot, "extracted.wav");
      const pipelineAudioPath = join(tempRoot, "pipeline-audio-out.mp4");

      const extractCmd = buildExtractPrimaryAudioWavCommand({
        ffmpegExecutable: ffmpegPath,
        inputVideoPath: executablePlan.resolvedInputPath,
        selectedAudioStreamIndex: executablePlan.selectedAudioStreamIndex,
        sampleRate: audioMeta.sampleRate,
        channelCount: audioMeta.channelCount,
        outputWavPath: extractPath,
      });

      if (extractCmd.kind !== "created") {
        return {
          kind: "failure",
          reason: {
            kind: "processing-failure",
            message: `Could not build extract command: ${extractCmd.reason}`,
          },
        };
      }

      deps.reportProgress?.("step:0");

      const extractRun = await runProcess(extractCmd.command);

      if (extractRun.kind !== "exited" || extractRun.exitCode !== 0) {
        return {
          kind: "failure",
          reason: {
            kind: "processing-failure",
            message: mapProcessFailure("ffmpeg", extractRun),
          },
        };
      }

      const sliced = logicalSteps.slice(1);

      const pipeFail = await runSequentialPipeline({
        logicalSteps: sliced,
        probe: probeResult.value,
        plan: executablePlan,
        tempRoot,
        ffmpegPath,
        maybeWhich,
        runProcess,
        bootstrapIntermediatePath: extractPath,
        ctxInputMediaPath: extractPath,
        finalDeliverablePath: pipelineAudioPath,
        reportProgress: deps.reportProgress,
        stepIndexOffset: 1,
      });

      if (pipeFail !== null) {
        return pipeFail;
      }

      const remuxCmd = buildRemuxVideoCopyCommand({
        ffmpegExecutable: ffmpegPath,
        originalVideoPath: executablePlan.resolvedInputPath,
        processedAudioPath: pipelineAudioPath,
        resolvedOutputPath: executablePlan.resolvedOutputPath,
        plannedAudioCodec: executablePlan.plannedAudioCodec,
      });

      if (remuxCmd.kind !== "created") {
        return {
          kind: "failure",
          reason: {
            kind: "processing-failure",
            message: `Could not build remux command: ${remuxCmd.reason}`,
          },
        };
      }

      deps.reportProgress?.(`step:${1 + sliced.length}`);

      const remuxRun = await runProcess(remuxCmd.command);

      if (remuxRun.kind !== "exited" || remuxRun.exitCode !== 0) {
        return {
          kind: "failure",
          reason: {
            kind: "processing-failure",
            message: mapProcessFailure("ffmpeg", remuxRun),
          },
        };
      }

      executionOk = true;

      const dropped = labelsForDroppedStreams(
        probeResult.value,
        executablePlan.selectedAudioStreamIndex,
      );

      return await finalizeCleanSuccess({
        outputPath: executablePlan.resolvedOutputPath,
        inputProbe: probeResult.value,
        ffprobePath,
        runProcess,
        outputExists,
        outputFileSize: resolveOutputFileSize,
        plannedModality: executablePlan.modality,
        claimedVideoCopied: true,
        baseSuccess: {
          json: request.json,
          dryRun: false,
          summary,
        },
        report: {
          videoPolicy: "copied",
          audioCodecSummary: executablePlan.plannedAudioCodec,
          droppedStreamsLabels: dropped,
          fallbackReasonCodes:
            executablePlan.reasonCodes.length > 0
              ? [...executablePlan.reasonCodes]
              : undefined,
        },
        reportProgress: deps.reportProgress,
      });
    }

    const audioOnlyPlan = executablePlan as AudioOnlyOutputPlan;

    const pipeFailAudio = await runSequentialPipeline({
      logicalSteps,
      probe: probeResult.value,
      plan: audioOnlyPlan,
      tempRoot,
      ffmpegPath,
      maybeWhich,
      runProcess,
      bootstrapIntermediatePath: audioOnlyPlan.resolvedInputPath,
      ctxInputMediaPath: audioOnlyPlan.resolvedInputPath,
      finalDeliverablePath: audioOnlyPlan.resolvedOutputPath,
      reportProgress: deps.reportProgress,
      stepIndexOffset: 0,
    });

    if (pipeFailAudio !== null) {
      return pipeFailAudio;
    }

    executionOk = true;

    return await finalizeCleanSuccess({
      outputPath: audioOnlyPlan.resolvedOutputPath,
      inputProbe: probeResult.value,
      ffprobePath,
      runProcess,
      outputExists,
      outputFileSize: resolveOutputFileSize,
      plannedModality: "audio-only",
      claimedVideoCopied: false,
      baseSuccess: {
        json: request.json,
        dryRun: false,
        summary,
      },
      report: {
        videoPolicy: "n/a-audio-only",
        audioCodecSummary: audioOnlyPlan.plannedAudioCodec,
        droppedStreamsLabels: [],
      },
      reportProgress: deps.reportProgress,
    });
  } finally {
    if (executionOk) {
      try {
        rm(tempRoot, { recursive: true });
      } catch {
        /* leave workspace if cleanup fails */
      }
    }
  }
}
