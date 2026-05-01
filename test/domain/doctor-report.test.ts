import { expect, test } from "bun:test";
import {
  doctorReportToOutcome,
  summarizeDoctorReport,
  type DoctorReport,
} from "../../src/index";

test("maps missing required tools to a missing-tools failure", () => {
  // Arrange
  const report: DoctorReport = {
    tools: [
      {
        kind: "missing",
        tool: "ffmpeg",
        requirement: "required",
        installHint: "Install FFmpeg.",
      },
      {
        kind: "available",
        tool: "ffprobe",
        requirement: "required",
        path: "/opt/homebrew/bin/ffprobe",
        version: "8.1",
        capabilities: [],
      },
    ],
  };

  // Act
  const outcome = doctorReportToOutcome(report);

  // Assert
  expect(outcome).toEqual({
    kind: "failure",
    reason: { kind: "missing-tools", tools: ["ffmpeg"] },
  });
});

test("keeps missing optional tools as warnings in non-strict mode", () => {
  // Arrange
  const report: DoctorReport = {
    tools: [
      availableRequiredTool("ffmpeg"),
      availableRequiredTool("ffprobe"),
      missingOptionalTool("sox_ng"),
      missingOptionalTool("sox"),
      missingOptionalTool("demucs"),
      missingOptionalTool("audacity"),
      missingOptionalTool("melt"),
    ],
  };

  // Act
  const summary = summarizeDoctorReport(report);
  const outcome = doctorReportToOutcome(report);

  // Assert
  expect(summary.missingOptionalTools).toEqual([
    "sox_ng",
    "sox",
    "demucs",
    "audacity",
    "melt",
  ]);
  expect(outcome.kind).toBe("success");
});

test("represents capability checks as not checked yet without failing tool availability", () => {
  // Arrange
  const report: DoctorReport = {
    tools: [
      {
        kind: "available",
        tool: "ffmpeg",
        requirement: "required",
        path: "/opt/homebrew/bin/ffmpeg",
        version: "8.1",
        capabilities: [{ kind: "not-checked-yet", id: "afftdn-filter", phase: "01" }],
      },
      availableRequiredTool("ffprobe"),
    ],
  };

  // Act
  const summary = summarizeDoctorReport(report);
  const outcome = doctorReportToOutcome(report);

  // Assert
  expect(summary.uncheckedCapabilities).toEqual([
    { tool: "ffmpeg", id: "afftdn-filter", phase: "01" },
  ]);
  expect(outcome.kind).toBe("success");
});

test("summarizes optional missing tools as warnings while required tools succeed", () => {
  // Arrange
  const report: DoctorReport = {
    tools: [
      availableRequiredTool("ffmpeg"),
      availableRequiredTool("ffprobe"),
      missingOptionalTool("demucs"),
    ],
  };

  // Act
  const summary = summarizeDoctorReport(report);
  const outcome = doctorReportToOutcome(report);

  // Assert
  expect(summary.status).toBe("ready");
  expect(summary.warnings).toEqual(["Missing optional tool: demucs"]);
  expect(outcome.kind).toBe("success");
});

function availableRequiredTool(tool: "ffmpeg" | "ffprobe"): DoctorReport["tools"][number] {
  return {
    kind: "available",
    tool,
    requirement: "required",
    path: `/opt/homebrew/bin/${tool}`,
    version: "8.1",
    capabilities: [],
  };
}

function missingOptionalTool(
  tool: "sox_ng" | "sox" | "demucs" | "audacity" | "melt",
): DoctorReport["tools"][number] {
  return {
    kind: "missing",
    tool,
    requirement: "optional",
    installHint: `${tool} is optional for Phase 1.`,
  };
}
