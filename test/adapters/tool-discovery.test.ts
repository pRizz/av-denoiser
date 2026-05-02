import { expect, test } from "bun:test";
import {
  type DoctorReport,
  discoverTools,
  type ProcessCommand,
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

test("runs ffmpeg version probes with spaced paths as discrete argv arrays", async () => {
  const captured: ProcessCommand[] = [];
  const spacedPath = "/opt/ffmpeg tools/ffmpeg";
  const deps = fakeDiscoveryDeps({
    maybeWhich: (name) => (name === "ffmpeg" ? spacedPath : null),
    runProcess: async (command) => {
      captured.push(command);

      if (command.args.includes("-filters")) {
        return {
          kind: "exited",
          exitCode: 0,
          stdout: " ALSA ladspa ",
          stderr: "",
        };
      }

      return {
        kind: "exited",
        exitCode: 0,
        stdout: "\nffmpeg version 8.1\n",
        stderr: "",
      };
    },
  });

  const report = await discoverTools(deps);

  expect(captured).toEqual([
    {
      executable: spacedPath,
      args: ["-version"],
      timeoutMs: 5_000,
      stdin: "ignore",
    },
    {
      executable: spacedPath,
      args: ["-hide_banner", "-filters"],
      timeoutMs: 8_000,
      stdin: "ignore",
    },
  ]);
  expect(toolFact(report, "ffmpeg")).toMatchObject({
    kind: "available",
    path: spacedPath,
    version: "ffmpeg version 8.1",
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
    runProcess: async (command) => {
      if (command.args.includes("-filters")) {
        return {
          kind: "exited",
          exitCode: 0,
          stdout: " ... ladspa ...\n",
          stderr: "",
        };
      }

      return {
        kind: "exited",
        exitCode: 0,
        stdout: "tool version 1.0",
        stderr: "",
      };
    },
  });

  // Act
  const report = await discoverTools(deps);

  // Assert
  expect(capabilityIds(report, "ffmpeg")).toContain("ffmpeg.filters");
  expect(capabilityIds(report, "ffmpeg")).toContain("ffmpeg.ladspa-filter");
  expect(capabilityIds(report, "sox")).toContain("sox.effects");
  const ffmpegCaps = availableToolFact(report, "ffmpeg").capabilities;
  expect(
    ffmpegCaps
      .filter((capability) => capability.kind === "not-checked-yet")
      .map((c) => c.id),
  ).toEqual(["ffmpeg.filters"]);
  expect(ffmpegCaps.some((c) => c.id === "ffmpeg.ladspa-filter")).toBe(true);
  expect(ffmpegCaps.find((c) => c.id === "ffmpeg.ladspa-filter")?.kind).toBe(
    "available",
  );
});

test("falls back to python3 -m demucs when demucs binary is absent", async () => {
  const captured: ProcessCommand[] = [];

  const deps = fakeDiscoveryDeps({
    maybeWhich: (name) => {
      if (name === "ffmpeg" || name === "ffprobe") {
        return `/opt/bin/${name}`;
      }

      if (name === "python3") {
        return "/usr/bin/python3";
      }

      return null;
    },
    runProcess: async (command) => {
      captured.push(command);

      if (command.args[0] === "-m" && command.args[1] === "demucs") {
        return {
          kind: "exited",
          exitCode: 0,
          stdout: "usage: demucs ...\n",
          stderr: "",
        };
      }

      if (command.args.includes("-filters")) {
        return {
          kind: "exited",
          exitCode: 0,
          stdout: " ladspa ",
          stderr: "",
        };
      }

      return {
        kind: "exited",
        exitCode: 0,
        stdout: "ok 1.0\n",
        stderr: "",
      };
    },
  });

  const report = await discoverTools(deps);

  expect(toolFact(report, "demucs")).toMatchObject({
    kind: "available",
    path: "/usr/bin/python3",
  });

  expect(
    captured.some(
      (c) =>
        c.executable === "/usr/bin/python3" &&
        c.args[0] === "-m" &&
        c.args[1] === "demucs",
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
