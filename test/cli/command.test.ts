import { expect, test } from "bun:test";

import { ExitCode } from "../../src/domain/exit-codes";

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

type ProcessOutput = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
};

async function runProcess(command: readonly string[]): Promise<ProcessOutput> {
  const subprocess = Bun.spawn(command, {
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
