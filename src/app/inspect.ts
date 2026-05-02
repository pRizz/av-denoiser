import { existsSync } from "node:fs";

import { type FfprobeProbeError, runFfprobeProbe } from "../adapters/ffprobe";
import { runProcessCommand } from "../adapters/process-runner";
import type { CliRequest } from "../domain/cli-request";
import type { CommandOutcome } from "../domain/command-outcome";
import { resolveDidYouMeanMediaPath } from "../domain/input-path-hint";
import {
  type InspectPlanSummary,
  outputPlanToInspectSummary,
} from "../domain/inspect-summary";
import {
  canonicalInputPath,
  describeMissingInputPath,
  type OutputPathFailure,
  resolveOutputPath,
} from "../domain/output-path";
import { planMediaOutput } from "../domain/output-plan";

export type InspectCliSuccess = {
  readonly json: boolean;
  readonly summary: InspectPlanSummary;
};

export type InspectCliOutcome = CommandOutcome & {
  readonly inspect?: InspectCliSuccess;
};

export type InspectDeps = {
  readonly cwd: string;
  readonly maybeWhich: (name: string) => string | null;
  readonly runProcess: import("../adapters/process-runner").ProcessRunner;
  readonly outputExists: (absolutePath: string) => boolean;
};

export async function runInspectRequest(
  request: Extract<CliRequest, { kind: "inspect" }>,
  deps: Partial<InspectDeps> = {},
): Promise<InspectCliOutcome> {
  const cwd = deps.cwd ?? process.cwd();
  const maybeWhich = deps.maybeWhich ?? ((name: string) => Bun.which(name));
  const runProcess = deps.runProcess ?? runProcessCommand;
  const outputExists = deps.outputExists ?? ((p: string) => existsSync(p));

  const ffprobePath = maybeWhich("ffprobe");

  if (ffprobePath === null) {
    return {
      kind: "failure",
      reason: { kind: "missing-tools", tools: ["ffprobe"] },
    };
  }

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

  if (plan.modality === "fallback-required" && !request.allowVideoFallback) {
    return {
      kind: "failure",
      reason: {
        kind: "fallback-required",
        message:
          "Planned output requires video preservation fallback approval. Pass --allow-video-fallback to acknowledge.",
      },
    };
  }

  return {
    kind: "success",
    inspect: {
      json: request.json,
      summary: outputPlanToInspectSummary(plan),
    },
  };
}

export function describeFfprobeFailure(error: FfprobeProbeError): string {
  switch (error.kind) {
    case "invalid-json":
      return "FFprobe returned invalid JSON.";
    case "schema-mismatch":
      return `FFprobe JSON did not match the expected schema: ${error.message}`;
    case "spawn-failed":
      return `Failed to spawn ffprobe: ${error.message}`;
    case "signaled":
      return `ffprobe terminated by signal ${error.signalCode}`;
    case "non-zero-exit":
      return `ffprobe exited with code ${error.exitCode}: ${error.stderr.trim()}`;
    case "empty-output":
      return "ffprobe returned empty output.";
    case "invalid-command":
      return "Internal error building ffprobe command.";
  }
}

export function describePathFailure(failure: OutputPathFailure): string {
  switch (failure.kind) {
    case "output-equals-input":
      return "Refusing to plan in-place output: resolved output path matches input path.";
    case "output-exists":
      return `Output path already exists: ${failure.resolvedOutputPath}`;
  }
}
