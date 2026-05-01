import { expect, test } from "bun:test";
import {
  ExitCode,
  mapOutcomeToExitCode,
  type CommandOutcome,
} from "../../src/index";

test("locks stable exit code values", () => {
  // Arrange
  const expectedExitCodes = {
    success: 0,
    internalError: 1,
    invalidInput: 2,
    missingTools: 3,
    planningFailure: 4,
    processingFailure: 5,
    fallbackRequired: 6,
  } as const;

  // Act
  const exitCodes = ExitCode;

  // Assert
  expect(exitCodes).toEqual(expectedExitCodes);
});

test("maps success outcomes to success exit code", () => {
  // Arrange
  const outcome: CommandOutcome = { kind: "success" };

  // Act
  const exitCode = mapOutcomeToExitCode(outcome);

  // Assert
  expect(exitCode).toBe(ExitCode.success);
});

test("maps missing tool failures to missing tools exit code", () => {
  // Arrange
  const outcome: CommandOutcome = {
    kind: "failure",
    reason: { kind: "missing-tools", tools: ["ffmpeg"] },
  };

  // Act
  const exitCode = mapOutcomeToExitCode(outcome);

  // Assert
  expect(exitCode).toBe(ExitCode.missingTools);
});

test("maps invalid input failures to invalid input exit code", () => {
  // Arrange
  const outcome: CommandOutcome = {
    kind: "failure",
    reason: { kind: "invalid-input", message: "Unknown option --loud" },
  };

  // Act
  const exitCode = mapOutcomeToExitCode(outcome);

  // Assert
  expect(exitCode).toBe(ExitCode.invalidInput);
});

test("maps unexpected internal errors to internal error exit code", () => {
  // Arrange
  const outcome: CommandOutcome = {
    kind: "internal-error",
    error: new Error("boom"),
  };

  // Act
  const exitCode = mapOutcomeToExitCode(outcome);

  // Assert
  expect(exitCode).toBe(ExitCode.internalError);
});
