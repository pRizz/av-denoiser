export {
  type ProcessResult,
  type ProcessRunner,
  runProcessCommand,
} from "./adapters/process-runner";
export {
  discoverTools,
  type ToolDiscoveryDeps,
} from "./adapters/tool-discovery";
export { createCommandProgram } from "./cli/command";
export {
  renderCliRequest,
  renderDefaultGuidance,
  renderDoctorGuidance,
  renderHelpGuidance,
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
  createProcessCommand,
  type ProcessCommand,
  type ProcessCommandInput,
  type ProcessCommandInvalidReason,
  type ProcessCommandResult,
  renderDisplayCommand,
} from "./domain/process-command";
