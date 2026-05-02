import { ExitCode, type ExitCodeValue } from "./exit-codes";

export type CommandFailureReason =
  | { readonly kind: "invalid-input"; readonly message: string }
  | { readonly kind: "missing-tools"; readonly tools: readonly string[] }
  | { readonly kind: "planning-failure"; readonly message: string }
  | { readonly kind: "processing-failure"; readonly message: string }
  | { readonly kind: "fallback-required"; readonly message: string };

export type CommandOutcome =
  | { readonly kind: "success"; readonly message?: string }
  | { readonly kind: "failure"; readonly reason: CommandFailureReason }
  | { readonly kind: "internal-error"; readonly error: unknown };

/** Maps typed command outcomes to the CLI's stable shell-visible exit code. */
export function mapOutcomeToExitCode(outcome: CommandOutcome): ExitCodeValue {
  if (outcome.kind === "success") {
    return ExitCode.success;
  }

  if (outcome.kind === "internal-error") {
    return ExitCode.internalError;
  }

  switch (outcome.reason.kind) {
    case "invalid-input":
      return ExitCode.invalidInput;
    case "missing-tools":
      return ExitCode.missingTools;
    case "planning-failure":
      return ExitCode.planningFailure;
    case "processing-failure":
      return ExitCode.processingFailure;
    case "fallback-required":
      return ExitCode.fallbackRequired;
  }
}

/** Batch aggregate exit = numeric max of per-file codes (`ExitCode.success` = 0). */
export function aggregateBatchExitCodes(
  codes: readonly ExitCodeValue[],
): ExitCodeValue {
  if (codes.length === 0) {
    return ExitCode.success;
  }

  return Math.max(...codes) as ExitCodeValue;
}
