import type { CommandOutcome } from "./command-outcome";

export type ToolName =
  | "ffmpeg"
  | "ffprobe"
  | "sox_ng"
  | "sox"
  | "demucs"
  | "audacity"
  | "melt";

export type ToolRequirement = "required" | "optional";

export type ToolCapabilityStatus =
  | { readonly kind: "available"; readonly id: string }
  | { readonly kind: "missing"; readonly id: string; readonly detail: string }
  | { readonly kind: "not-checked-yet"; readonly id: string; readonly phase: string };

export type ToolAvailability =
  | {
      readonly kind: "available";
      readonly tool: ToolName;
      readonly requirement: ToolRequirement;
      readonly path: string;
      readonly version: string;
      readonly capabilities: readonly ToolCapabilityStatus[];
    }
  | {
      readonly kind: "missing";
      readonly tool: ToolName;
      readonly requirement: ToolRequirement;
      readonly installHint: string;
    }
  | {
      readonly kind: "check-failed";
      readonly tool: ToolName;
      readonly requirement: ToolRequirement;
      readonly path: string;
      readonly reason: string;
    };

export type ToolDefinition = {
  readonly tool: ToolName;
  readonly requirement: ToolRequirement;
  readonly installHint: string;
};

export type DoctorReport = {
  readonly tools: readonly ToolAvailability[];
};

export type UncheckedCapability = {
  readonly tool: ToolName;
  readonly id: string;
  readonly phase: string;
};

export type DoctorSummary = {
  readonly status: "ready" | "blocked";
  readonly missingRequiredTools: readonly ToolName[];
  readonly missingOptionalTools: readonly ToolName[];
  readonly uncheckedCapabilities: readonly UncheckedCapability[];
  readonly warnings: readonly string[];
};

export const defaultToolDefinitions = [
  {
    tool: "ffmpeg",
    requirement: "required",
    installHint: "Install FFmpeg and ensure ffmpeg is on PATH.",
  },
  {
    tool: "ffprobe",
    requirement: "required",
    installHint: "Install FFmpeg and ensure ffprobe is on PATH.",
  },
  {
    tool: "sox_ng",
    requirement: "optional",
    installHint: "Install SoX_ng to enable optional SoX cleanup paths.",
  },
  {
    tool: "sox",
    requirement: "optional",
    installHint: "Install SoX as a compatibility fallback for SoX_ng.",
  },
  {
    tool: "demucs",
    requirement: "optional",
    installHint: "Install Demucs only when voice/source isolation is needed.",
  },
  {
    tool: "audacity",
    requirement: "optional",
    installHint: "Install Audacity only for the future optional GUI-backed workflow.",
  },
  {
    tool: "melt",
    requirement: "optional",
    installHint: "Install MLT melt only for future Kdenlive/MLT compatibility.",
  },
] as const satisfies readonly ToolDefinition[];

/** Aggregates doctor facts without performing PATH, version, or capability I/O. */
export function summarizeDoctorReport(report: DoctorReport): DoctorSummary {
  const missingRequiredTools = report.tools
    .filter(isRequiredUnavailable)
    .map((tool) => tool.tool);

  const missingOptionalTools = report.tools
    .filter((tool) => tool.kind === "missing" && tool.requirement === "optional")
    .map((tool) => tool.tool);

  const uncheckedCapabilities = report.tools.flatMap((tool) => {
    if (tool.kind !== "available") {
      return [];
    }

    return tool.capabilities
      .filter((capability) => capability.kind === "not-checked-yet")
      .map((capability) => ({
        tool: tool.tool,
        id: capability.id,
        phase: capability.phase,
      }));
  });

  return {
    status: missingRequiredTools.length === 0 ? "ready" : "blocked",
    missingRequiredTools,
    missingOptionalTools,
    uncheckedCapabilities,
    warnings: [
      ...missingOptionalTools.map((tool) => `Missing optional tool: ${tool}`),
      ...optionalCheckFailedWarnings(report.tools),
      ...missingCapabilityWarnings(report.tools),
    ],
  };
}

/** Converts doctor readiness to a command outcome while keeping optional gaps non-fatal. */
export function doctorReportToOutcome(report: DoctorReport): CommandOutcome {
  const summary = summarizeDoctorReport(report);

  if (summary.missingRequiredTools.length > 0) {
    return {
      kind: "failure",
      reason: { kind: "missing-tools", tools: summary.missingRequiredTools },
    };
  }

  return { kind: "success", message: "Doctor readiness facts are sufficient for Phase 1." };
}

function isRequiredUnavailable(tool: ToolAvailability): boolean {
  return tool.requirement === "required" && (tool.kind === "missing" || tool.kind === "check-failed");
}

function optionalCheckFailedWarnings(tools: readonly ToolAvailability[]): string[] {
  return tools
    .filter((tool) => tool.kind === "check-failed" && tool.requirement === "optional")
    .map((tool) => `Optional tool check failed: ${tool.tool}`);
}

function missingCapabilityWarnings(tools: readonly ToolAvailability[]): string[] {
  return tools.flatMap((tool) => {
    if (tool.kind !== "available") {
      return [];
    }

    return tool.capabilities
      .filter((capability) => capability.kind === "missing")
      .map((capability) => `Missing capability for ${tool.tool}: ${capability.id}`);
  });
}
