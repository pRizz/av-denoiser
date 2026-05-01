/** Stable process exit codes used by the CLI shell. */
export const ExitCode = {
  success: 0,
  internalError: 1,
  invalidInput: 2,
  missingTools: 3,
  planningFailure: 4,
  processingFailure: 5,
  fallbackRequired: 6,
} as const;

export type ExitCodeName = keyof typeof ExitCode;
export type ExitCodeValue = (typeof ExitCode)[ExitCodeName];
