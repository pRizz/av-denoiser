import { expect, test } from "bun:test";

import { parseCliRequest, runCli } from "../../src/cli/main";
import { ExitCode } from "../../src/domain/exit-codes";
import { argvTokensForEquivalentClean } from "../../src/domain/guided-clean-equivalent";
import type { GuidedCleanSelections } from "../../src/domain/guided-clean-selection";

test("argvTokensForEquivalentClean round-trips through parseCliRequest", () => {
  const selections: GuidedCleanSelections = {
    inputPath: "fixture.wav",
    force: false,
    dryRun: false,
    presetId: "speech-soft-sox",
    noiseStrength: 0.25,
    allowVideoFallback: true,
  };

  const tokens = argvTokensForEquivalentClean(selections);
  const parsed = parseCliRequest([...tokens.slice(1)]);

  expect(parsed).toEqual({
    kind: "clean",
    inputPath: "fixture.wav",
    maybeOutputPath: undefined,
    force: false,
    dryRun: false,
    json: false,
    presetId: "speech-soft-sox",
    knobs: { noiseStrength: 0.25 },
    allowVideoFallback: true,
  });
});

test("parses clean dry-run with default speech-light preset", () => {
  expect(parseCliRequest(["clean", "--dry-run", "clip.wav"])).toMatchObject({
    kind: "clean",
    presetId: "speech-light",
  });
});

test("parses clean --preset speech-soft-sox", () => {
  expect(
    parseCliRequest([
      "clean",
      "--dry-run",
      "--preset",
      "speech-soft-sox",
      "clip.wav",
    ]),
  ).toMatchObject({
    kind: "clean",
    presetId: "speech-soft-sox",
  });
});

test("invalid clean --noise-strength exits invalidInput via runCli", async () => {
  const code = await runCli(["clean", "clip.wav", "--noise-strength", "2"]);

  expect(code).toBe(ExitCode.invalidInput);
});

test("parses clean --allow-video-fallback", () => {
  expect(
    parseCliRequest(["clean", "--dry-run", "--allow-video-fallback", "in.mp4"]),
  ).toMatchObject({
    kind: "clean",
    allowVideoFallback: true,
  });
});

test("parses batch with two --input paths and dry-run", () => {
  expect(
    parseCliRequest([
      "batch",
      "--input",
      "a.wav",
      "--input",
      "b.wav",
      "--dry-run",
    ]),
  ).toMatchObject({
    kind: "batch",
    inputPaths: ["a.wav", "b.wav"],
    dryRun: true,
    concurrency: 1,
    presetId: "speech-light",
  });
});

test("parses inspect argv into typed inspect request", () => {
  expect(parseCliRequest(["inspect", "clip.m4a"])).toEqual({
    kind: "inspect",
    inputPath: "clip.m4a",
    force: false,
    json: false,
    allowVideoFallback: false,
  });
});

test("parses inspect with --output --force and --json together", () => {
  expect(
    parseCliRequest([
      "inspect",
      "--output",
      "out.mp4",
      "--force",
      "--json",
      "in.mp4",
    ]),
  ).toEqual({
    kind: "inspect",
    inputPath: "in.mp4",
    maybeOutputPath: "out.mp4",
    force: true,
    json: true,
    allowVideoFallback: false,
  });
});

test("default CLI prints guidance and exits successfully", async () => {
  // Arrange
  const command = ["bun", "run", "cli"];

  // Act
  const result = await runProcess(command);

  // Assert
  expect(result.exitCode).toBe(ExitCode.success);
  expect(result.stdout).toContain(
    'Run "av-denoiser doctor" to inspect local tool readiness.',
  );
});

test("unknown CLI options exit as invalid input", async () => {
  // Arrange
  const command = ["bun", "run", "src/cli/main.ts", "--unknown"];

  // Act
  const result = await runProcess(command);

  // Assert
  expect(result.exitCode).toBe(ExitCode.invalidInput);
  expect(result.stderr).toContain("invalidInput");
});

test("excess root arguments exit as invalid input", async () => {
  const result = await runProcess([
    "bun",
    "run",
    "src/cli/main.ts",
    "not-a-command",
  ]);

  expect(result.exitCode).toBe(ExitCode.invalidInput);
  expect(result.stderr).toContain("invalidInput");
  expect(result.stderr).toContain("Invalid input:");
});

type ProcessOutput = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
};

async function runProcess(command: readonly string[]): Promise<ProcessOutput> {
  const subprocess = Bun.spawn([...command], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    subprocess.exited,
    new Response(subprocess.stdout).text(),
    new Response(subprocess.stderr).text(),
  ]);

  return { exitCode, stdout, stderr };
}
