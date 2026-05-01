import {
  type DoctorReport,
  defaultToolDefinitions,
  type ToolAvailability,
  type ToolDefinition,
  type ToolName,
} from "../domain/doctor-report";
import type { ProcessCommand } from "../domain/process-command";
import { type ProcessRunner, runProcessCommand } from "./process-runner";

export type ToolDiscoveryDeps = {
  readonly maybeWhich: (name: string) => string | null;
  readonly runProcess: ProcessRunner;
};

const versionProbeTimeoutMs = 5_000;

const versionArgsByTool = {
  ffmpeg: ["-version"],
  ffprobe: ["-version"],
  sox_ng: ["--version"],
  sox: ["--version"],
  demucs: ["--help"],
  audacity: ["--version"],
  melt: ["-version"],
} as const satisfies Record<ToolName, readonly string[]>;

const capabilityIdsByTool = {
  ffmpeg: ["ffmpeg.filters"],
  ffprobe: ["ffprobe.json-output"],
  sox_ng: ["sox.effects"],
  sox: ["sox.effects"],
  demucs: ["demucs.model-cache"],
  audacity: ["audacity.mod-script-pipe"],
  melt: ["melt.presets"],
} as const satisfies Record<ToolName, readonly string[]>;

export async function discoverTools(
  deps: Partial<ToolDiscoveryDeps> = {},
): Promise<DoctorReport> {
  const resolvedDeps = resolveToolDiscoveryDeps(deps);
  const tools = await Promise.all(
    defaultToolDefinitions.map((definition) =>
      discoverTool(definition, resolvedDeps),
    ),
  );

  return { tools };
}

async function discoverTool(
  definition: ToolDefinition,
  deps: ToolDiscoveryDeps,
): Promise<ToolAvailability> {
  const maybePath = deps.maybeWhich(definition.tool);

  if (maybePath === null) {
    return {
      kind: "missing",
      tool: definition.tool,
      requirement: definition.requirement,
      installHint: definition.installHint,
    };
  }

  const result = await deps.runProcess(
    versionProbeCommand(definition, maybePath),
  );

  if (result.kind === "spawn-failed") {
    return checkFailedTool(definition, maybePath, result.error.message);
  }

  if (result.kind === "signaled") {
    return checkFailedTool(
      definition,
      maybePath,
      `version probe terminated by signal ${result.signalCode}`,
    );
  }

  const maybeVersion = firstNonEmptyLine(result.stdout, result.stderr);

  if (result.exitCode !== 0) {
    return checkFailedTool(
      definition,
      maybePath,
      maybeVersion ?? `version probe exited with code ${result.exitCode}`,
    );
  }

  if (maybeVersion === null) {
    return checkFailedTool(
      definition,
      maybePath,
      "version probe returned no output",
    );
  }

  return {
    kind: "available",
    tool: definition.tool,
    requirement: definition.requirement,
    path: maybePath,
    version: maybeVersion,
    capabilities: capabilityIdsByTool[definition.tool].map((id) => ({
      kind: "not-checked-yet",
      id,
      phase: "01",
    })),
  };
}

function resolveToolDiscoveryDeps(
  deps: Partial<ToolDiscoveryDeps>,
): ToolDiscoveryDeps {
  return {
    maybeWhich: deps.maybeWhich ?? ((name) => Bun.which(name)),
    runProcess: deps.runProcess ?? runProcessCommand,
  };
}

function versionProbeCommand(
  definition: ToolDefinition,
  executable: string,
): ProcessCommand {
  return {
    executable,
    args: versionArgsByTool[definition.tool],
    timeoutMs: versionProbeTimeoutMs,
    stdin: "ignore",
  };
}

function checkFailedTool(
  definition: ToolDefinition,
  path: string,
  reason: string,
): ToolAvailability {
  return {
    kind: "check-failed",
    tool: definition.tool,
    requirement: definition.requirement,
    path,
    reason,
  };
}

function firstNonEmptyLine(stdout: string, stderr: string): string | null {
  const maybeLine = `${stdout}\n${stderr}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return maybeLine ?? null;
}
