import type { InspectCliSuccess } from "../app/inspect";
import type { CliRequest } from "../domain/cli-request";
import {
  type CommandOutcome,
  mapOutcomeToExitCode,
} from "../domain/command-outcome";
import {
  type DoctorReport,
  summarizeDoctorReport,
  type ToolAvailability,
  type ToolCapabilityStatus,
} from "../domain/doctor-report";
import { ExitCode } from "../domain/exit-codes";
import type { InspectPlanSummary } from "../domain/inspect-summary";

const DEFAULT_GUIDANCE_LINES = [
  "av-denoiser CLI foundation is installed.",
  'Run "av-denoiser doctor" to inspect local tool readiness.',
  'Run "av-denoiser inspect <path>" to probe media and preview planned outputs.',
  "Heavy transcoding and denoise pipelines are not wired yet.",
];

const DOCTOR_GUIDANCE_LINES = [
  "av-denoiser doctor",
  "",
  "Doctor command routing is wired into the typed CLI request model.",
  "Detailed media tool readiness checks are not available in this phase.",
  "Heavy transcoding and denoise pipelines are not wired yet.",
];

const targetBunVersion = "1.3.13";

export type RuntimeInfo = {
  readonly currentBunVersion: string;
  readonly targetBunVersion: string;
};

export type RenderableOutcome = CommandOutcome & {
  readonly doctorReport?: DoctorReport;
  readonly inspect?: InspectCliSuccess;
};

export function renderDefaultGuidance(): string {
  return DEFAULT_GUIDANCE_LINES.join("\n");
}

export function renderDoctorGuidance(): string {
  return DOCTOR_GUIDANCE_LINES.join("\n");
}

export function renderHelpGuidance(helpText: string): string {
  return [
    helpText.trimEnd(),
    "",
    "Current phase note:",
    "Heavy transcoding and denoise pipelines are not wired yet.",
  ].join("\n");
}

export function renderDoctorReport(
  report: DoctorReport,
  runtimeInfo: RuntimeInfo = createRuntimeInfo(),
): string {
  const summary = summarizeDoctorReport(report);
  const lines = [
    "av-denoiser doctor",
    "",
    "Runtime",
    `- Target Bun: ${runtimeInfo.targetBunVersion}`,
    `- Current Bun: ${runtimeInfo.currentBunVersion}`,
    "",
    "Required tools",
    ...renderToolSection(report.tools, "required"),
    "",
    "Optional tools",
    ...renderToolSection(report.tools, "optional"),
    "",
    "Capabilities not checked in this phase",
    ...renderUncheckedCapabilities(report.tools),
  ];

  if (summary.warnings.length > 0) {
    lines.push(
      "",
      "Warnings",
      ...summary.warnings.map((warning) => `- ${warning}`),
    );
  }

  return lines.join("\n");
}

export function renderInspectPlanText(summary: InspectPlanSummary): string {
  const lines = [
    "av-denoiser inspect",
    "",
    "Input",
    `- ${summary.inputPath}`,
    "",
    "Output path",
    `- ${summary.outputPath}`,
    "",
    "Modality",
    `- ${summary.modality}`,
    "",
    "Selected audio stream index",
    `- ${
      summary.selectedAudioStreamIndex === null
        ? "n/a"
        : String(summary.selectedAudioStreamIndex)
    }`,
    "",
    "Planned audio codec",
    `- ${
      summary.plannedAudioCodec === null ? "n/a" : summary.plannedAudioCodec
    }`,
    "",
    "Planned container",
    `- ${summary.plannedContainer === null ? "n/a" : summary.plannedContainer}`,
    "",
    "Reason codes",
    ...summary.reasonCodes.map((code) => `- ${code}`),
  ];

  return lines.join("\n");
}

export function renderCommandOutcome(
  request: CliRequest,
  outcome: RenderableOutcome,
  helpText: string,
  runtimeInfo: RuntimeInfo = createRuntimeInfo(),
): string {
  if (request.kind === "show-default") {
    return renderDefaultGuidance();
  }

  if (request.kind === "show-help") {
    return renderHelpGuidance(helpText);
  }

  if (request.kind === "inspect") {
    if (outcome.kind === "success" && outcome.inspect !== undefined) {
      return outcome.inspect.json
        ? `${JSON.stringify(outcome.inspect.summary, null, 2)}\n`
        : renderInspectPlanText(outcome.inspect.summary);
    }

    return appendFailureDetails("av-denoiser inspect failed.", outcome);
  }

  if (outcome.doctorReport !== undefined) {
    return appendFailureDetails(
      renderDoctorReport(outcome.doctorReport, runtimeInfo),
      outcome,
    );
  }

  return renderDoctorGuidance();
}

export function renderFailureOutcome(outcome: CommandOutcome): string {
  return appendFailureDetails("Command failed.", outcome);
}

export function renderCliRequest(
  request: CliRequest,
  helpText: string,
): string {
  switch (request.kind) {
    case "show-default":
      return renderDefaultGuidance();
    case "show-help":
      return renderHelpGuidance(helpText);
    case "doctor":
      return renderDoctorGuidance();
    case "inspect":
      return [
        "av-denoiser inspect <path>",
        "",
        "Runs ffprobe and prints planned output modality and paths.",
      ].join("\n");
  }
}

function createRuntimeInfo(): RuntimeInfo {
  return {
    currentBunVersion: Bun.version,
    targetBunVersion,
  };
}

function renderToolSection(
  tools: readonly ToolAvailability[],
  requirement: "required" | "optional",
): string[] {
  const matchingTools = tools.filter(
    (tool) => tool.requirement === requirement,
  );

  if (matchingTools.length === 0) {
    return ["- None"];
  }

  return matchingTools.map(renderToolAvailability);
}

function renderToolAvailability(tool: ToolAvailability): string {
  switch (tool.kind) {
    case "available":
      return `- ${tool.tool}: available at ${tool.path} (${tool.version})`;
    case "missing":
      return `- ${tool.tool}: missing (${tool.installHint})`;
    case "check-failed":
      return `- ${tool.tool}: check failed at ${tool.path} (${tool.reason})`;
  }
}

function renderUncheckedCapabilities(
  tools: readonly ToolAvailability[],
): string[] {
  const uncheckedCapabilities = tools.flatMap((tool) => {
    if (tool.kind !== "available") {
      return [];
    }

    return tool.capabilities
      .filter(isUncheckedCapability)
      .map(
        (capability) =>
          `- ${tool.tool} ${capability.id}: not-checked-yet (phase ${capability.phase})`,
      );
  });

  if (uncheckedCapabilities.length === 0) {
    return ["- None"];
  }

  return uncheckedCapabilities;
}

function isUncheckedCapability(
  capability: ToolCapabilityStatus,
): capability is Extract<
  ToolCapabilityStatus,
  { readonly kind: "not-checked-yet" }
> {
  return capability.kind === "not-checked-yet";
}

function appendFailureDetails(output: string, outcome: CommandOutcome): string {
  if (outcome.kind !== "failure") {
    return output;
  }

  const exitCode = mapOutcomeToExitCode(outcome);
  const name = exitCodeName(exitCode);

  return [
    output,
    "",
    `Exit code: ${name} (${exitCode})`,
    renderFailureReason(outcome),
  ].join("\n");
}

function renderFailureReason(
  outcome: Extract<CommandOutcome, { kind: "failure" }>,
): string {
  switch (outcome.reason.kind) {
    case "invalid-input":
      return `Invalid input: ${outcome.reason.message}`;
    case "missing-tools":
      return `Missing required tools: ${outcome.reason.tools.join(", ")}`;
    case "planning-failure":
      return `Planning failure: ${outcome.reason.message}`;
    case "processing-failure":
      return `Processing failure: ${outcome.reason.message}`;
    case "fallback-required":
      return `Fallback required: ${outcome.reason.message}`;
  }
}

function exitCodeName(exitCode: number): string {
  const maybeEntry = Object.entries(ExitCode).find(
    ([, value]) => value === exitCode,
  );

  return maybeEntry?.[0] ?? "unknown";
}
