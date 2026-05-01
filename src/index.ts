export { createCommandProgram } from "./cli/command";
export {
  renderCliRequest,
  renderDefaultGuidance,
  renderDoctorGuidance,
  renderHelpGuidance,
} from "./cli/render";
export {
  mapOutcomeToExitCode,
  type CommandFailureReason,
  type CommandOutcome,
} from "./domain/command-outcome";
export type { CliRequest, CliRequestResult } from "./domain/cli-request";
export {
  defaultToolDefinitions,
  doctorReportToOutcome,
  summarizeDoctorReport,
  type DoctorReport,
  type DoctorSummary,
  type ToolAvailability,
  type ToolCapabilityStatus,
  type ToolDefinition,
  type ToolName,
  type ToolRequirement,
  type UncheckedCapability,
} from "./domain/doctor-report";
export { ExitCode, type ExitCodeName, type ExitCodeValue } from "./domain/exit-codes";
export {
  createProcessCommand,
  renderDisplayCommand,
  type ProcessCommand,
  type ProcessCommandInput,
  type ProcessCommandInvalidReason,
  type ProcessCommandResult,
} from "./domain/process-command";
