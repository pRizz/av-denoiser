export {
  createFfprobeJsonCommand,
  type FfprobeProbeError,
  type RunFfprobeProbeDeps,
  type RunFfprobeProbeResult,
  runFfprobeProbe,
} from "./adapters/ffprobe";
export {
  type ProcessResult,
  type ProcessRunner,
  runProcessCommand,
} from "./adapters/process-runner";
export {
  discoverTools,
  type ToolDiscoveryDeps,
} from "./adapters/tool-discovery";
export { createDoctorReport, type DoctorDeps } from "./app/doctor";
export {
  type InspectCliOutcome,
  type InspectCliSuccess,
  type InspectDeps,
  runInspectRequest,
} from "./app/inspect";
export {
  type InstallToolsDeps,
  type InstallToolsInput,
  runInstallToolsRequest,
} from "./app/install-tools";
export {
  type CliCommandOutcome,
  type CliRequestDeps,
  runCliRequest,
} from "./app/run-command";
export { createCommandProgram } from "./cli/command";
export {
  type RenderableOutcome,
  type RuntimeInfo,
  renderCliRequest,
  renderCommandOutcome,
  renderDefaultGuidance,
  renderDoctorGuidance,
  renderDoctorReport,
  renderFailureOutcome,
  renderHelpGuidance,
  renderInspectPlanText,
} from "./cli/render";
export type { CliRequest, CliRequestResult } from "./domain/cli-request";
export {
  type CommandFailureReason,
  type CommandOutcome,
  mapOutcomeToExitCode,
} from "./domain/command-outcome";
export {
  type DoctorReport,
  type DoctorSummary,
  defaultToolDefinitions,
  doctorReportToOutcome,
  summarizeDoctorReport,
  type ToolAvailability,
  type ToolCapabilityStatus,
  type ToolDefinition,
  type ToolName,
  type ToolRequirement,
  type UncheckedCapability,
} from "./domain/doctor-report";
export {
  ExitCode,
  type ExitCodeName,
  type ExitCodeValue,
} from "./domain/exit-codes";
export {
  type InspectPlanSummary,
  outputPlanToInspectSummary,
} from "./domain/inspect-summary";
export {
  type BrewInstallStep,
  formatBrewInstallDryRunLines,
  manualPostBrewHints,
  planBrewInstallSteps,
} from "./domain/install-tools-brew";
export {
  type FfprobeParseError,
  type MediaProbe,
  type ParseFfprobeJsonResult,
  parseFfprobeJson,
} from "./domain/media-probe";
export {
  DEFAULT_OUTPUT_SUFFIX_SEGMENT,
  type DefaultOutputPathBesideInputOptions,
  defaultOutputPathBesideInput,
  type OutputPathFailure,
  type OutputPathSuccess,
  type ResolveOutputPathInput,
  type ResolveOutputPathResult,
  resolveOutputPath,
} from "./domain/output-path";
export {
  type ImplicitDefaultExtInput,
  implicitDefaultOutputExtWithDot,
  type OutputModality,
  type OutputPlan,
  type PlanMediaOutputInput,
  type PlanMediaOutputPrelude,
  type PlannedAudioCodec,
  type PlannedContainer,
  planMediaOutput,
  planMediaOutputPrelude,
} from "./domain/output-plan";
export {
  createProcessCommand,
  type ProcessCommand,
  type ProcessCommandInput,
  type ProcessCommandInvalidReason,
  type ProcessCommandResult,
  renderDisplayCommand,
} from "./domain/process-command";
export { cliName } from "./domain/product";
