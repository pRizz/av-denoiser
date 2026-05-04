import type { BatchCliPayload } from "../app/batch";
import type { DenoiseCliSuccess } from "../app/denoise";
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
import { cliName } from "../domain/product";

const DEFAULT_GUIDANCE_LINES = [
  "av-denoiser CLI foundation is installed.",
  'Run "av-denoiser doctor" to inspect local tool readiness.',
  'Run "av-denoiser inspect <path>" to probe media and preview planned outputs.',
  'Use "av-denoiser denoise <path>" for preset FFmpeg/SoX cleanup when tools are ready.',
  'Use "av-denoiser batch --input <path>..." for multi-file cleanup with a manifest.',
  'Use "av-denoiser denoise <path>" after inspect for video when the plan keeps video as-is, or add --allow-video-reencode when the file needs video re-encoding.',
  'Run "av-denoiser guided" for a prompted denoise workflow that prints equivalent CLI flags.',
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
  readonly denoise?: DenoiseCliSuccess;
  readonly guidedHumanSummary?: string;
  readonly batch?: BatchCliPayload;
};

export function renderDefaultGuidance(): string {
  const lines = [...DEFAULT_GUIDANCE_LINES];

  if (process.platform === "darwin") {
    lines.push(
      `On macOS, run "${cliName} install-tools" to install FFmpeg, SoX_ng, Audacity, and uv via Homebrew (use --no-optional for FFmpeg and uv only).`,
    );
  }

  return lines.join("\n");
}

export function renderDoctorGuidance(): string {
  return DOCTOR_GUIDANCE_LINES.join("\n");
}

export function renderHelpGuidance(helpText: string): string {
  return [
    helpText.trimEnd(),
    "",
    "Current phase note:",
    "Video inputs use extract → preset pipeline → remux with video stream copy when inspect reports video-copy-safe.",
    'Use "av-denoiser guided" for a prompted walkthrough that prints equivalent flags.',
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

  const body = lines.join("\n");

  if (process.platform !== "darwin") {
    return body;
  }

  return `${body}\n\nTip: "${cliName} install-tools" installs FFmpeg, SoX_ng, Audacity, and uv by default; use --no-optional for FFmpeg + uv only. Full tier may offer Demucs via \`uv tool install demucs\` after brew; use --yes without prompting in non-interactive environments.`;
}

export function renderBatchSummary(payload: BatchCliPayload): string {
  const lines = [
    "av-denoiser batch",
    "",
    `Manifest: ${payload.manifestPath}`,
    `Worst exit code: ${payload.worstExitCode}`,
    "",
    "Files",
    ...payload.document.items.map(
      (row) =>
        `- ${row.inputPath} → ${row.outcome} (${row.resolvedOutputPath || "n/a"})${
          row.message.length > 0 ? `: ${row.message}` : ""
        }`,
    ),
  ];

  return lines.join("\n");
}

export function renderDenoisePlanText(success: DenoiseCliSuccess): string {
  const { summary } = success;
  const lines = [
    "av-denoiser denoise",
    "",
    "Preset",
    `- ${summary.presetId}`,
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
  ];

  if (summary.plannedContainer !== null) {
    lines.push("Planned container", `- ${summary.plannedContainer}`, "");
  }

  if (summary.plannedAudioCodec !== null) {
    lines.push("Planned audio codec", `- ${summary.plannedAudioCodec}`, "");
  }

  if (summary.reasonCodes.length > 0) {
    lines.push("Reason codes", ...summary.reasonCodes.map((c) => `- ${c}`), "");
  }

  lines.push(
    "Warnings",
    ...summary.pipelineWarnings.map((w) => `- ${w.title} (${w.id})`),
    "",
    "Steps",
    ...summary.steps.map((s) => `- ${s.tool}: ${s.displayCommand}`),
  );

  if (
    success.maybeReportText !== undefined &&
    success.maybeReportText.length > 0
  ) {
    lines.push("", "Verified:", success.maybeReportText.trimEnd());
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

  if (summary.preservationNotes.length > 0) {
    lines.push("", "Preservation notes");
    for (const line of summary.preservationNotes) {
      lines.push(`- ${line}`);
    }
  }

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

  if (request.kind === "denoise") {
    if (outcome.kind === "success" && outcome.denoise !== undefined) {
      return outcome.denoise.json
        ? `${JSON.stringify(denoiseSummaryForJson(outcome.denoise), null, 2)}\n`
        : renderDenoisePlanText(outcome.denoise);
    }

    return appendFailureDetails("av-denoiser denoise failed.", outcome);
  }

  if (request.kind === "guided-denoise") {
    if (outcome.kind === "success") {
      return outcome.guidedHumanSummary ?? "av-denoiser guided finished.\n";
    }

    return appendFailureDetails("av-denoiser guided failed.", outcome);
  }

  if (request.kind === "batch") {
    if (outcome.kind === "success" && outcome.batch !== undefined) {
      return request.json
        ? `${JSON.stringify(
            {
              worstExitCode: outcome.batch.worstExitCode,
              manifestPath: outcome.batch.manifestPath,
              items: outcome.batch.document.items,
            },
            null,
            2,
          )}\n`
        : renderBatchSummary(outcome.batch);
    }

    return appendFailureDetails("av-denoiser batch failed.", outcome);
  }

  if (request.kind === "install-tools") {
    if (
      outcome.kind === "success" &&
      outcome.message !== undefined &&
      outcome.message.length > 0
    ) {
      return outcome.message;
    }

    if (outcome.kind === "internal-error") {
      const msg =
        outcome.error instanceof Error
          ? outcome.error.message
          : String(outcome.error);

      return `${cliName} install-tools failed.\n\nInternal error: ${msg}\n`;
    }

    return appendFailureDetails(`${cliName} install-tools failed.`, outcome);
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
    case "install-tools":
      return [
        `${cliName} install-tools`,
        "",
        "macOS only: runs Homebrew to install FFmpeg, SoX_ng, Audacity, and uv by default; pass --no-optional for FFmpeg + uv only. Full tier offers Demucs via `uv tool install demucs` after brew (interactive) or --yes when non-interactive. Use --dry-run to preview commands.",
      ].join("\n");
    case "guided-denoise":
      return [
        "av-denoiser guided",
        "",
        "Runs an interactive preset denoise workflow with prompts, dry-run preview, and equivalent CLI flags.",
      ].join("\n");
    case "inspect":
      return [
        "av-denoiser inspect <path>",
        "",
        "Runs ffprobe and prints planned output modality and paths.",
      ].join("\n");
    case "denoise":
      return [
        "av-denoiser denoise <path>",
        "",
        "Runs preset FFmpeg/SoX cleanup on audio or supported video (inspect first; use --allow-video-reencode only when the plan cannot keep video as-is).",
      ].join("\n");
    case "batch":
      return [
        "av-denoiser batch [--input <path> ...] [--from-dir <dir>] [--glob <pattern> ...]",
        "",
        "Runs denoise on many inputs; writes batch-manifest.json unless --manifest is set.",
        "Globs require --accept-glob-risk. Default concurrency is 1; failures aggregate into the process exit code.",
      ].join("\n");
  }
}

function denoiseSummaryForJson(
  success: DenoiseCliSuccess,
): Record<string, unknown> {
  const summary = success.summary;
  const base: Record<string, unknown> = {
    presetId: summary.presetId,
    inputPath: summary.inputPath,
    outputPath: summary.outputPath,
    modality: summary.modality,
    plannedContainer: summary.plannedContainer,
    plannedAudioCodec: summary.plannedAudioCodec,
    reasonCodes: summary.reasonCodes,
    warnings: summary.pipelineWarnings,
    steps: summary.steps,
  };

  if (success.maybeReportText !== undefined) {
    base.reportText = success.maybeReportText;
  }

  if (success.maybeExecutionTiming !== undefined) {
    base.executionTiming = success.maybeExecutionTiming;
  }

  return base;
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
    case "missing-tools": {
      let text = `Missing required tools: ${outcome.reason.tools.join(", ")}`;

      if (process.platform === "darwin") {
        text += `\nOn macOS, try: ${cliName} install-tools`;
      }

      return text;
    }
    case "planning-failure":
      return `Planning failure: ${outcome.reason.message}`;
    case "processing-failure":
      return `Processing failure: ${outcome.reason.message}`;
    case "fallback-required":
      return `Approval needed: ${outcome.reason.message}`;
  }
}

function exitCodeName(exitCode: number): string {
  const maybeEntry = Object.entries(ExitCode).find(
    ([, value]) => value === exitCode,
  );

  return maybeEntry?.[0] ?? "unknown";
}
