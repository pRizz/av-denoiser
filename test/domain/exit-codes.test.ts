import { expect, test } from "bun:test";
import {
  type CommandOutcome,
  ExitCode,
  mapOutcomeToExitCode,
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

test("maps planning failures to planning failure exit code", () => {
  // Arrange
  const outcome: CommandOutcome = {
    kind: "failure",
    reason: { kind: "planning-failure", message: "Cannot build output plan." },
  };

  // Act
  const exitCode = mapOutcomeToExitCode(outcome);

  // Assert
  expect(exitCode).toBe(ExitCode.planningFailure);
});

test("maps processing failures to processing failure exit code", () => {
  // Arrange
  const outcome: CommandOutcome = {
    kind: "failure",
    reason: {
      kind: "processing-failure",
      message: "ffmpeg exited with code 1",
    },
  };

  // Act
  const exitCode = mapOutcomeToExitCode(outcome);

  // Assert
  expect(exitCode).toBe(ExitCode.processingFailure);
});

test("maps fallback-required failures to fallback required exit code", () => {
  // Arrange
  const outcome: CommandOutcome = {
    kind: "failure",
    reason: {
      kind: "fallback-required",
      message: "Video recompression requires explicit approval.",
    },
  };

  // Act
  const exitCode = mapOutcomeToExitCode(outcome);

  // Assert
  expect(exitCode).toBe(ExitCode.fallbackRequired);
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
