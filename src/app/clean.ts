import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  defaultAudacityPipePathsFromEnv,
  runAudacityMacro,
} from "../adapters/audacity-pipe";
import { probeFfmpegLadspaFilter } from "../adapters/ffmpeg-ladspa-probe";
import { runFfprobeProbe } from "../adapters/ffprobe";
import {
  type ProcessResult,
  type ProcessRunner,
  runProcessCommand,
} from "../adapters/process-runner";
import type { AudacityPipePaths } from "../domain/audacity";
import { formatAudacityDiagnostic } from "../domain/audacity";
import {
  buildLogicalStepCommand,
  demucsTrackStemFromWavPath,
  resolveDemucsVocalsWavPath,
} from "../domain/audio-pipeline-argv";
import {
  applyIntegrationsToLogicalSteps,
  type CleanPresetKnobs,
  expandPreset,
  type LadspaIntegration,
  type LogicalPipelineStep,
  type PipelineWarning,
  type PresetId,
  presetRequiresDemucs,
  presetRequiresSox,
} from "../domain/audio-pipeline-plan";
import { verifyCleanOutput } from "../domain/clean-output-verify";
import {
  type CleanRunReport,
  labelsForDroppedStreams,
  renderCleanRunReportText,
} from "../domain/clean-run-report";
import type { CommandOutcome } from "../domain/command-outcome";
import { resolveDidYouMeanMediaPath } from "../domain/input-path-hint";
import type { MediaProbe } from "../domain/media-probe";
import {
  canonicalInputPath,
  describeMissingInputPath,
  resolveOutputPath,
} from "../domain/output-path";
import {
  implicitDefaultOutputExtWithDot,
  type OutputPlan,
  planMediaOutput,
  planMediaOutputPrelude,
} from "../domain/output-plan";
import { renderDisplayCommand } from "../domain/process-command";
import {
  buildExtractPrimaryAudioWavCommand,
  buildRemuxVideoWithProcessedAudioCommand,
  plannedContainerForVideoRemux,
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
  /** Opt-in Audacity mod-script-pipe macro (`--audacity-macro`); requires `acceptAudacityPipeRisk`. */
  readonly maybeAudacityMacro?: string;
  readonly acceptAudacityPipeRisk: boolean;
  /** Optional FFmpeg `ladspa` step before encode (`--ladspa-*`); requires `ladspa` support in FFmpeg. */
  readonly maybeLadspa?: LadspaIntegration;
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
  readonly audacityPipes?: AudacityPipePaths;
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

function resolveDemucsInvocation(maybeWhich: (name: string) => string | null): {
  readonly executable: string;
  readonly modulePrefix: readonly string[];
} | null {
  const direct = maybeWhich("demucs");

  if (direct !== null && direct.trim() !== "") {
    return { executable: direct, modulePrefix: [] };
  }

  const py = maybeWhich("python3");

  if (py !== null && py.trim() !== "") {
    return { executable: py, modulePrefix: ["-m", "demucs"] };
  }

  return null;
}

function mapProcessFailure(
  label: "ffmpeg" | "sox" | "demucs",
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
  readonly demucsExecutable: string;
  readonly demucsModulePrefix: readonly string[];
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
    const isDemucs = logical.tool === "demucs";
    const outPath = isEncode
      ? params.finalDeliverablePath
      : isDemucs
        ? join(params.tempDirForPreview, `step-${i}-demucs-out`)
        : join(params.tempDirForPreview, `step-${i}.wav`);

    const audioMeta = audioLayoutForStream(
      params.probe,
      params.plan.selectedAudioStreamIndex,
    );

    if (logical.tool === "audacity") {
      summaries.push({
        tool: "audacity",
        displayCommand: `audacity macro:${logical.step.macroName} (mod-script-pipe)`,
      });
      inputPathForStep = outPath;

      continue;
    }

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
      demucsExecutable: params.demucsExecutable,
      demucsModulePrefix: params.demucsModulePrefix,
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

    const stepInputPath = inputPathForStep;

    if (logical.tool === "demucs" && logical.step.kind === "two-stems-vocals") {
      inputPathForStep = resolveDemucsVocalsWavPath(
        outPath,
        demucsTrackStemFromWavPath(stepInputPath),
        logical.step.model,
      );
    } else {
      inputPathForStep = outPath;
    }
  }

  return { steps: summaries };
}

function buildAudioOnlyStepSummaries(params: {
  readonly logicalSteps: readonly LogicalPipelineStep[];
  readonly probe: MediaProbe;
  readonly plan: AudioOnlyOutputPlan;
  readonly ffmpegPath: string;
  readonly maybeWhich: (name: string) => string | null;
  readonly tempDirForPreview: string;
  readonly demucsExecutable: string;
  readonly demucsModulePrefix: readonly string[];
}): { readonly steps: readonly CleanStepSummary[] } {
  return buildStepSummariesFromLogicalSteps({
    logicalSteps: params.logicalSteps,
    probe: params.probe,
    plan: params.plan,
    ffmpegPath: params.ffmpegPath,
    maybeWhich: params.maybeWhich,
    tempDirForPreview: params.tempDirForPreview,
    bootstrapIntermediatePath: params.plan.resolvedInputPath,
    ctxInputMediaPath: params.plan.resolvedInputPath,
    finalDeliverablePath: params.plan.resolvedOutputPath,
    demucsExecutable: params.demucsExecutable,
    demucsModulePrefix: params.demucsModulePrefix,
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
  readonly demucsExecutable: string;
  readonly demucsModulePrefix: readonly string[];
  readonly audacityPipes?: AudacityPipePaths;
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
    const isDemucs = logical.tool === "demucs";
    const outPath = isEncode
      ? params.finalDeliverablePath
      : isDemucs
        ? join(params.tempRoot, `step-${i}-demucs-out`)
        : join(params.tempRoot, `step-${i}.wav`);

    const audioMeta = audioLayoutForStream(
      params.probe,
      params.plan.selectedAudioStreamIndex,
    );

    if (logical.tool === "audacity") {
      if (logical.step.kind !== "macro") {
        return {
          kind: "failure",
          reason: {
            kind: "processing-failure",
            message: "Unexpected Audacity logical step shape.",
          },
        };
      }

      const pipes = params.audacityPipes ?? defaultAudacityPipePathsFromEnv();
      const macro = await runAudacityMacro({
        macroName: logical.step.macroName,
        inputAudioPath: inputPathForStep,
        outputAudioPath: outPath,
        pipes,
      });

      if (macro.kind !== "ok") {
        return {
          kind: "failure",
          reason: {
            kind: "processing-failure",
            message: formatAudacityDiagnostic(macro.diagnostic, macro.detail),
          },
        };
      }

      inputPathForStep = outPath;

      continue;
    }

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
      demucsExecutable: params.demucsExecutable,
      demucsModulePrefix: params.demucsModulePrefix,
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

    const label: "ffmpeg" | "sox" | "demucs" =
      logical.tool === "sox"
        ? "sox"
        : logical.tool === "demucs"
          ? "demucs"
          : "ffmpeg";
    const processResult = await params.runProcess(built.command);

    if (processResult.kind === "exited" && processResult.exitCode === 0) {
      const stepInputPath = inputPathForStep;

      if (
        logical.tool === "demucs" &&
        logical.step.kind === "two-stems-vocals"
      ) {
        inputPathForStep = resolveDemucsVocalsWavPath(
          outPath,
          demucsTrackStemFromWavPath(stepInputPath),
          logical.step.model,
        );
      } else {
        inputPathForStep = outPath;
      }

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

  const resolvedInputPath = canonicalInputPath(cwd, request.inputPath);

  if (!outputExists(resolvedInputPath)) {
    return {
      kind: "failure",
      reason: {
        kind: "planning-failure",
        message: describeMissingInputPath(
          resolvedInputPath,
          resolveDidYouMeanMediaPath(resolvedInputPath),
        ),
      },
    };
  }

  const probeResult = await runFfprobeProbe({
    ffprobePath,
    inputPath: resolvedInputPath,
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

  const prelude = planMediaOutputPrelude(probeResult.value);

  const hasExplicitOutput =
    request.maybeOutputPath !== undefined &&
    request.maybeOutputPath.trim().length > 0;

  const implicitOutputExtWithDot =
    !hasExplicitOutput && prelude.kind === "ok"
      ? implicitDefaultOutputExtWithDot({
          modality: prelude.modality,
          plannedContainer: prelude.plannedContainer,
          resolvedInputPath,
        })
      : undefined;

  const pathResult = resolveOutputPath({
    cwd,
    inputPath: request.inputPath,
    maybeExplicitOutput: request.maybeOutputPath,
    implicitOutputExtWithDot,
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

  const demucsInvoke = resolveDemucsInvocation(maybeWhich);

  if (presetRequiresDemucs(request.presetId) && demucsInvoke === null) {
    return {
      kind: "failure",
      reason: {
        kind: "missing-tools",
        tools: ["demucs"],
      },
    };
  }

  const demucsExecutable = demucsInvoke?.executable ?? "";
  const demucsModulePrefix = demucsInvoke?.modulePrefix ?? [];

  if (request.maybeLadspa !== undefined) {
    const hasLadspa = await probeFfmpegLadspaFilter({
      ffmpegPath,
      runProcess,
    });

    if (!hasLadspa) {
      return {
        kind: "failure",
        reason: {
          kind: "planning-failure",
          message:
            "FFmpeg does not list the ladspa filter (or the probe failed). Run `av-denoiser doctor`, install FFmpeg with LADSPA enabled, and set LADSPA_PATH when using plugins.",
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

  const mergedSteps = applyIntegrationsToLogicalSteps(expanded.steps, {
    maybeLadspa: request.maybeLadspa,
    maybeAudacityMacro: request.maybeAudacityMacro,
    acceptAudacityPipeRisk: request.acceptAudacityPipeRisk,
  });

  if (mergedSteps.kind === "error") {
    return {
      kind: "failure",
      reason: {
        kind: "planning-failure",
        message: mergedSteps.message,
      },
    };
  }

  const logicalSteps = mergedSteps.steps;
  const { warnings: pipelineWarnings } = expanded;

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
      demucsExecutable,
      demucsModulePrefix,
    }).steps;

    // Remux invariant: modality fallback-required ⇒ videoStreamMode reencode-h264 and prelude
    // plannedContainer mp4 — only pass planner fields through; argv builder avoids -f mp4 anyway.

    const remuxBuilt = buildRemuxVideoWithProcessedAudioCommand({
      ffmpegExecutable: ffmpegPath,
      originalVideoPath: executablePlan.resolvedInputPath,
      processedAudioPath: pipelineAudioPreviewPath,
      resolvedOutputPath: executablePlan.resolvedOutputPath,
      plannedAudioCodec: executablePlan.plannedAudioCodec,
      plannedContainer: plannedContainerForVideoRemux(
        executablePlan.plannedContainer,
      ),
      videoStreamMode:
        executablePlan.modality === "fallback-required"
          ? "reencode-h264"
          : "copy",
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
      logicalSteps,
      probe: probeResult.value,
      plan: executablePlan as AudioOnlyOutputPlan,
      ffmpegPath,
      maybeWhich,
      tempDirForPreview: previewDir,
      demucsExecutable,
      demucsModulePrefix,
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
        demucsExecutable,
        demucsModulePrefix,
        audacityPipes: deps.audacityPipes,
        reportProgress: deps.reportProgress,
        stepIndexOffset: 1,
      });

      if (pipeFail !== null) {
        return pipeFail;
      }

      const remuxCmd = buildRemuxVideoWithProcessedAudioCommand({
        ffmpegExecutable: ffmpegPath,
        originalVideoPath: executablePlan.resolvedInputPath,
        processedAudioPath: pipelineAudioPath,
        resolvedOutputPath: executablePlan.resolvedOutputPath,
        plannedAudioCodec: executablePlan.plannedAudioCodec,
        plannedContainer: plannedContainerForVideoRemux(
          executablePlan.plannedContainer,
        ),
        videoStreamMode:
          executablePlan.modality === "fallback-required"
            ? "reencode-h264"
            : "copy",
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

      const isVideoFallbackRemux =
        executablePlan.modality === "fallback-required";

      return await finalizeCleanSuccess({
        outputPath: executablePlan.resolvedOutputPath,
        inputProbe: probeResult.value,
        ffprobePath,
        runProcess,
        outputExists,
        outputFileSize: resolveOutputFileSize,
        plannedModality: executablePlan.modality,
        claimedVideoCopied: !isVideoFallbackRemux,
        baseSuccess: {
          json: request.json,
          dryRun: false,
          summary,
        },
        report: {
          videoPolicy: isVideoFallbackRemux ? "re-encoded" : "copied",
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
      demucsExecutable,
      demucsModulePrefix,
      audacityPipes: deps.audacityPipes,
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
