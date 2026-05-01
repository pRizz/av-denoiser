import { expect, test } from "bun:test";
import {
  type DoctorReport,
  discoverTools,
  type ProcessRunner,
  type ToolAvailability,
  type ToolName,
} from "../../src/index";

test("reports missing required ffmpeg when path lookup fails", async () => {
  // Arrange
  const deps = fakeDiscoveryDeps({
    maybeWhich: () => null,
  });

  // Act
  const report = await discoverTools(deps);

  // Assert
  expect(toolFact(report, "ffmpeg")).toEqual({
    kind: "missing",
    tool: "ffmpeg",
    requirement: "required",
    installHint: "Install FFmpeg and ensure ffmpeg is on PATH.",
  });
});

test("captures the first non-empty version line for available ffmpeg", async () => {
  // Arrange
  const deps = fakeDiscoveryDeps({
    maybeWhich: (name) => (name === "ffmpeg" ? "/opt/bin/ffmpeg" : null),
    runProcess: async () => ({
      kind: "exited",
      exitCode: 0,
      stdout: "\nffmpeg version 8.1\nconfiguration: --enable-ladspa\n",
      stderr: "",
    }),
  });

  // Act
  const report = await discoverTools(deps);

  // Assert
  expect(toolFact(report, "ffmpeg")).toMatchObject({
    kind: "available",
    tool: "ffmpeg",
    requirement: "required",
    path: "/opt/bin/ffmpeg",
    version: "ffmpeg version 8.1",
  });
});

test("includes optional missing tool facts without failing discovery", async () => {
  // Arrange
  const deps = fakeDiscoveryDeps({
    maybeWhich: (name) =>
      name === "ffmpeg" || name === "ffprobe" ? `/opt/bin/${name}` : null,
  });

  // Act
  const report = await discoverTools(deps);

  // Assert
  expect(optionalToolFacts(report).map((tool) => tool.tool)).toEqual([
    "sox_ng",
    "sox",
    "demucs",
    "audacity",
    "melt",
  ]);
  expect(
    optionalToolFacts(report).every((tool) => tool.kind === "missing"),
  ).toBe(true);
});

test("marks planned capability checks as not checked yet", async () => {
  // Arrange
  const deps = fakeDiscoveryDeps({
    maybeWhich: (name) => `/opt/bin/${name}`,
  });

  // Act
  const report = await discoverTools(deps);

  // Assert
  expect(capabilityIds(report, "ffmpeg")).toContain("ffmpeg.filters");
  expect(capabilityIds(report, "sox")).toContain("sox.effects");
  expect(
    availableToolFact(report, "ffmpeg").capabilities.every(
      (capability) => capability.kind === "not-checked-yet",
    ),
  ).toBe(true);
});

function fakeDiscoveryDeps(
  overrides: {
    readonly maybeWhich?: (name: string) => string | null;
    readonly runProcess?: ProcessRunner;
  } = {},
) {
  const runProcess: ProcessRunner =
    overrides.runProcess ??
    (async () => ({
      kind: "exited",
      exitCode: 0,
      stdout: "tool version 1.0",
      stderr: "",
    }));

  return {
    maybeWhich: overrides.maybeWhich ?? (() => null),
    runProcess,
  };
}

function toolFact(report: DoctorReport, tool: ToolName): ToolAvailability {
  const maybeTool = report.tools.find((fact) => fact.tool === tool);

  if (maybeTool === undefined) {
    throw new Error(`Missing tool fact for ${tool}`);
  }

  return maybeTool;
}

function availableToolFact(
  report: DoctorReport,
  tool: ToolName,
): Extract<ToolAvailability, { kind: "available" }> {
  const fact = toolFact(report, tool);

  if (fact.kind !== "available") {
    throw new Error(`Expected available tool fact for ${tool}`);
  }

  return fact;
}

function optionalToolFacts(report: DoctorReport): ToolAvailability[] {
  return report.tools.filter((tool) => tool.requirement === "optional");
}

function capabilityIds(report: DoctorReport, tool: ToolName): string[] {
  return availableToolFact(report, tool).capabilities.map(
    (capability) => capability.id,
  );
}
