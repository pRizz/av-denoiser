import { expect, test } from "bun:test";
import type { CliCommandOutcome } from "../../src/app/run-command";
import { parseCliRequest, resolveProcessExitCode } from "../../src/cli/main";
import { renderDefaultGuidance } from "../../src/cli/render";
import { BATCH_MANIFEST_SCHEMA_VERSION } from "../../src/domain/batch-manifest";
import type { CliRequest } from "../../src/domain/cli-request";
import { ExitCode } from "../../src/domain/exit-codes";

test("resolveProcessExitCode uses batch worst exit code", () => {
  const request = { kind: "batch" } as CliRequest;
  const outcome = {
    kind: "success",
    batch: {
      manifestPath: "/tmp/m.json",
      worstExitCode: ExitCode.planningFailure,
      document: {
        schemaVersion: BATCH_MANIFEST_SCHEMA_VERSION,
        generatedAt: "",
        items: [],
        maybeDoctorFacts: null,
      },
    },
  } as CliCommandOutcome;

  expect(resolveProcessExitCode(request, outcome)).toBe(
    ExitCode.planningFailure,
  );
});

test("parses doctor command into a typed request", () => {
  // Arrange
  const rawArgs = ["doctor"];

  // Act
  const request = parseCliRequest(rawArgs);

  // Assert
  expect(request).toEqual({ kind: "doctor" });
});

test("parses guided command into typed guided-clean request", () => {
  expect(parseCliRequest(["guided"])).toEqual({ kind: "guided-clean" });
});

test("parses --help into show-help request", () => {
  expect(parseCliRequest(["--help"])).toEqual({ kind: "show-help" });
});

test("parses clean --help into scoped show-help for clean", () => {
  expect(parseCliRequest(["clean", "--help"])).toEqual({
    kind: "show-help",
    topic: "clean",
  });
});

test("parses install-deps --help into install-tools help topic", () => {
  expect(parseCliRequest(["install-deps", "-h"])).toEqual({
    kind: "show-help",
    topic: "install-tools",
  });
});

test("parses -h into show-help request", () => {
  expect(parseCliRequest(["-h"])).toEqual({ kind: "show-help" });
});

test("rejects excess root arguments (unknown command surface)", () => {
  expect(() => parseCliRequest(["not-a-command"])).toThrow(
    /too many arguments/,
  );
});

test("parses clean dry-run with default preset speech-light", () => {
  expect(parseCliRequest(["clean", "--dry-run", "x.m4a"])).toEqual({
    kind: "clean",
    inputPath: "x.m4a",
    force: false,
    dryRun: true,
    json: false,
    allowVideoFallback: false,
    presetId: "speech-light",
    knobs: { noiseStrength: 0.35 },
    acceptAudacityPipeRisk: false,
  });
});

test("parses clean with speech-soft-sox preset", () => {
  expect(
    parseCliRequest([
      "clean",
      "--preset",
      "speech-soft-sox",
      "--dry-run",
      "x.m4a",
    ]),
  ).toEqual({
    kind: "clean",
    inputPath: "x.m4a",
    force: false,
    dryRun: true,
    json: false,
    allowVideoFallback: false,
    presetId: "speech-soft-sox",
    knobs: { noiseStrength: 0.35 },
    acceptAudacityPipeRisk: false,
  });
});

test("clean rejects noise-strength outside 0..1", () => {
  expect(() =>
    parseCliRequest(["clean", "x.m4a", "--noise-strength", "2"]),
  ).toThrow();
});

test("parses inspect command into a typed request", () => {
  // Arrange
  const rawArgs = ["inspect", "clip.m4a", "--force", "--json"];

  // Act
  const request = parseCliRequest(rawArgs);

  // Assert
  expect(request).toEqual({
    kind: "inspect",
    inputPath: "clip.m4a",
    force: true,
    json: true,
    allowVideoFallback: false,
  });
});

test("renders default guidance without stale phase promises", () => {
  // Arrange
  const expectedDoctorHint =
    'Run "av-denoiser doctor" to inspect local tool readiness.';
  const expectedInspectHint =
    'Run "av-denoiser inspect <path>" to probe media and preview planned outputs.';

  // Act
  const output = renderDefaultGuidance();

  // Assert
  expect(output).toContain(expectedDoctorHint);
  expect(output).toContain(expectedInspectHint);
  expect(output).toContain("clean");
  expect(output).toContain('Run "av-denoiser guided"');
  expect(output).not.toContain("Phase 5 will add");
});
