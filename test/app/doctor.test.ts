import { expect, test } from "bun:test";

import { runCliRequest } from "../../src/app/run-command";
import {
  ExitCode,
  mapOutcomeToExitCode,
  type ToolAvailability,
} from "../../src/index";

const optionalMissingTools: readonly ToolAvailability[] = [
  missingOptionalTool("sox_ng"),
  missingOptionalTool("sox"),
  missingOptionalTool("demucs"),
  missingOptionalTool("audacity"),
  missingOptionalTool("melt"),
];

test("doctor request succeeds when required tools are available", async () => {
  // Arrange
  const requiredTools: readonly ToolAvailability[] = [
    availableRequiredTool("ffmpeg"),
    availableRequiredTool("ffprobe"),
  ];

  // Act
  const outcome = await runCliRequest(
    { kind: "doctor" },
    {
      discoverTools: async () => ({
        tools: [...requiredTools, ...optionalMissingTools],
      }),
    },
  );

  // Assert
  expect(outcome.kind).toBe("success");
  expect(mapOutcomeToExitCode(outcome)).toBe(ExitCode.success);
});

test("doctor request fails when ffmpeg is missing", async () => {
  // Arrange
  const tools: readonly ToolAvailability[] = [
    {
      kind: "missing",
      tool: "ffmpeg",
      requirement: "required",
      installHint: "Install FFmpeg and ensure ffmpeg is on PATH.",
    },
    availableRequiredTool("ffprobe"),
    ...optionalMissingTools,
  ];

  // Act
  const outcome = await runCliRequest(
    { kind: "doctor" },
    {
      discoverTools: async () => ({ tools }),
    },
  );

  // Assert
  expect(outcome.kind).toBe("failure");
  expect(mapOutcomeToExitCode(outcome)).toBe(ExitCode.missingTools);
});

function availableRequiredTool(
  tool: "ffmpeg" | "ffprobe",
): ToolAvailability {
  return {
    kind: "available",
    tool,
    requirement: "required",
    path: `/usr/local/bin/${tool}`,
    version: `${tool} version 8.1`,
    capabilities: [
      {
        kind: "not-checked-yet",
        id: `${tool}.capability`,
        phase: "01",
      },
    ],
  };
}

function missingOptionalTool(
  tool: "sox_ng" | "sox" | "demucs" | "audacity" | "melt",
): ToolAvailability {
  return {
    kind: "missing",
    tool,
    requirement: "optional",
    installHint: `Install ${tool} for optional future workflows.`,
  };
}
