import { expect, test } from "bun:test";
import {
  createProcessCommand,
  renderDisplayCommand,
  type ProcessCommand,
} from "../../src/index";

test("preserves paths with spaces as one argv element", () => {
  // Arrange
  const input = {
    executable: "ffmpeg",
    args: ["-i", "clip with spaces.mov"],
  } as const;

  // Act
  const result = createProcessCommand(input);

  // Assert
  expect(result).toEqual({
    kind: "created",
    command: {
      executable: "ffmpeg",
      args: ["-i", "clip with spaces.mov"],
    },
  });
});

test("renders a diagnostic command without changing execution data", () => {
  // Arrange
  const command: ProcessCommand = {
    executable: "ffmpeg",
    args: ["-i", "clip with spaces.mov", "clip \"quoted\".wav", "café.wav", "-dash.wav"],
  };

  // Act
  const displayCommand = renderDisplayCommand(command);

  // Assert
  expect(displayCommand).toContain("'clip with spaces.mov'");
  expect(displayCommand).toContain("'clip \"quoted\".wav'");
  expect(command.args).toEqual([
    "-i",
    "clip with spaces.mov",
    "clip \"quoted\".wav",
    "café.wav",
    "-dash.wav",
  ]);
});

test("rejects an empty executable as a typed failure", () => {
  // Arrange
  const input = { executable: " ", args: ["--version"] } as const;

  // Act
  const result = createProcessCommand(input);

  // Assert
  expect(result).toEqual({
    kind: "invalid",
    reason: { kind: "empty-executable" },
  });
});

test("supports timeout and ignored stdin without shell options", () => {
  // Arrange
  const input = {
    executable: "ffmpeg",
    args: ["-version"],
    timeoutMs: 5_000,
    stdin: "ignore",
  } as const;

  // Act
  const result = createProcessCommand(input);

  // Assert
  expect(result).toEqual({
    kind: "created",
    command: {
      executable: "ffmpeg",
      args: ["-version"],
      timeoutMs: 5_000,
      stdin: "ignore",
    },
  });
});
