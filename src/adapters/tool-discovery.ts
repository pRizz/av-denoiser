import {
  type DoctorReport,
  defaultToolDefinitions,
  type ToolAvailability,
  type ToolCapabilityStatus,
  type ToolDefinition,
  type ToolName,
} from "../domain/doctor-report";
import {
  createProcessCommand,
  type ProcessCommand,
} from "../domain/process-command";
import { probeFfmpegLadspaFilter } from "./ffmpeg-ladspa-probe";
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
  if (definition.tool === "demucs") {
    const direct = deps.maybeWhich("demucs");

    if (direct !== null && direct.trim() !== "") {
      return await discoverToolAtPath(definition, direct, deps);
    }

    return await discoverDemucsViaPythonModule(definition, deps);
  }

  const maybePath = deps.maybeWhich(definition.tool);

  if (maybePath === null) {
    return missingOptionalOrRequired(definition);
  }

  return await discoverToolAtPath(definition, maybePath, deps);
}

function missingOptionalOrRequired(
  definition: ToolDefinition,
): ToolAvailability {
  return {
    kind: "missing",
    tool: definition.tool,
    requirement: definition.requirement,
    installHint: definition.installHint,
  };
}

async function discoverDemucsViaPythonModule(
  definition: ToolDefinition,
  deps: ToolDiscoveryDeps,
): Promise<ToolAvailability> {
  const maybePython = deps.maybeWhich("python3");

  if (maybePython === null || maybePython.trim() === "") {
    return missingOptionalOrRequired(definition);
  }

  return await discoverOptionalToolAtPathWithArgs(
    definition,
    maybePython,
    ["-m", "demucs", "--help"],
    deps,
  );
}

async function discoverToolAtPath(
  definition: ToolDefinition,
  path: string,
  deps: ToolDiscoveryDeps,
): Promise<ToolAvailability> {
  const probe = buildVersionProbeCommandFromArgs(
    definition,
    path,
    versionArgsByTool[definition.tool],
  );

  if (probe.kind !== "created") {
    return checkFailedTool(definition, path, probe.reason);
  }

  return await finishDiscoveryFromProbeResult(
    definition,
    path,
    probe.command,
    deps,
  );
}

async function discoverOptionalToolAtPathWithArgs(
  definition: ToolDefinition,
  path: string,
  args: readonly string[],
  deps: ToolDiscoveryDeps,
): Promise<ToolAvailability> {
  const probe = buildVersionProbeCommandFromArgs(definition, path, args);

  if (probe.kind !== "created") {
    return checkFailedTool(definition, path, probe.reason);
  }

  return await finishDiscoveryFromProbeResult(
    definition,
    path,
    probe.command,
    deps,
  );
}

async function finishDiscoveryFromProbeResult(
  definition: ToolDefinition,
  path: string,
  command: ProcessCommand,
  deps: ToolDiscoveryDeps,
): Promise<ToolAvailability> {
  const result = await deps.runProcess(command);

  if (result.kind === "spawn-failed") {
    return checkFailedTool(definition, path, result.error.message);
  }

  if (result.kind === "signaled") {
    return checkFailedTool(
      definition,
      path,
      `version probe terminated by signal ${result.signalCode}`,
    );
  }

  const maybeVersion = firstNonEmptyLine(result.stdout, result.stderr);

  if (result.exitCode !== 0) {
    return checkFailedTool(
      definition,
      path,
      maybeVersion ?? `version probe exited with code ${result.exitCode}`,
    );
  }

  if (maybeVersion === null) {
    return checkFailedTool(
      definition,
      path,
      "version probe returned no output",
    );
  }

  const available: Extract<ToolAvailability, { kind: "available" }> = {
    kind: "available",
    tool: definition.tool,
    requirement: definition.requirement,
    path,
    version: maybeVersion,
    capabilities: capabilityIdsByTool[definition.tool].map((id) => ({
      kind: "not-checked-yet" as const,
      id,
      phase: "01" as const,
    })),
  };

  if (definition.tool === "ffmpeg") {
    return await augmentFfmpegWithLadspaCapability(available, deps);
  }

  return available;
}

async function augmentFfmpegWithLadspaCapability(
  tool: Extract<ToolAvailability, { kind: "available" }>,
  deps: ToolDiscoveryDeps,
): Promise<ToolAvailability> {
  const hasLadspa = await probeFfmpegLadspaFilter({
    ffmpegPath: tool.path,
    runProcess: deps.runProcess,
  });

  const ladspaRow: ToolCapabilityStatus = hasLadspa
    ? { kind: "available", id: "ffmpeg.ladspa-filter" }
    : {
        kind: "missing",
        id: "ffmpeg.ladspa-filter",
        detail:
          "FFmpeg -filters output does not list ladspa (build without LADSPA / plugin path not applicable here)",
      };

  return {
    ...tool,
    capabilities: [...tool.capabilities, ladspaRow],
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

function buildVersionProbeCommandFromArgs(
  _definition: ToolDefinition,
  executable: string,
  args: readonly string[],
):
  | { readonly kind: "created"; readonly command: ProcessCommand }
  | {
      readonly kind: "invalid";
      readonly reason: string;
    } {
  const created = createProcessCommand({
    executable,
    args: [...args],
    timeoutMs: versionProbeTimeoutMs,
    stdin: "ignore",
  });

  if (created.kind !== "created") {
    return {
      kind: "invalid",
      reason: "resolved executable is empty after normalization",
    };
  }

  return { kind: "created", command: created.command };
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
