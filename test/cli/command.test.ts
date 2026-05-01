import { expect, test } from "bun:test";

import { parseCliRequest } from "../../src/cli/main";
import { ExitCode } from "../../src/domain/exit-codes";

test("parses inspect argv into typed inspect request", () => {
  expect(parseCliRequest(["inspect", "clip.m4a"])).toEqual({
    kind: "inspect",
    inputPath: "clip.m4a",
    force: false,
    json: false,
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
