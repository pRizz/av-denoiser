import { expect, test } from "bun:test";
import { runProcessCommand } from "../../src/adapters/process-runner";

test("runs current Bun runtime with argv --version and ignores stdin", async () => {
  const result = await runProcessCommand({
    executable: process.execPath,
    args: ["--version"],
    stdin: "ignore",
  });

  expect(result.kind).toBe("exited");
  if (result.kind !== "exited") {
    throw new Error(`expected exited process result, received ${result.kind}`);
  }

  expect(result.exitCode).toBe(0);
  const firstLine = result.stdout.trim().split(/\r?\n/)[0] ?? "";
  expect(/^\d+\.\d+/.test(firstLine)).toBe(true);
});

test("merges command.env into the process environment (PATH preserved)", async () => {
  const result = await runProcessCommand({
    executable: process.execPath,
    args: [
      `-e`,
      `const inheritedPath =
        typeof process.env.PATH === "string" || typeof process.env.Path === "string";
      process.exit(
        process.env.AVDN_SPAWN_MERGE_MARK === "yes" && inheritedPath ? 0 : 1,
      );`,
    ],
    env: { AVDN_SPAWN_MERGE_MARK: "yes" },
  });

  expect(result.kind).toBe("exited");
  if (result.kind !== "exited") {
    throw new Error(`expected exited process result, received ${result.kind}`);
  }

  expect(result.exitCode).toBe(0);
});
