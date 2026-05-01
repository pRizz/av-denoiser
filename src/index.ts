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
export { ExitCode, type ExitCodeName, type ExitCodeValue } from "./domain/exit-codes";
