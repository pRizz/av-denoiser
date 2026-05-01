import { expect, test } from "bun:test";

import {
  createFfprobeJsonCommand,
  runFfprobeProbe,
} from "../../src/adapters/ffprobe";
import type { ProcessRunner } from "../../src/adapters/process-runner";

test("createFfprobeJsonCommand preserves spaced input path as one argv entry", () => {
  // Act
  const result = createFfprobeJsonCommand({
    ffprobePath: "/bin/ffprobe",
    inputPath: "in put.m4a",
  });

  // Assert
  expect(result.kind).toBe("created");
  if (result.kind !== "created") {
    return;
  }

  expect(result.command.executable).toBe("/bin/ffprobe");
  expect(result.command.args).toEqual([
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    "in put.m4a",
  ]);
});

test("runFfprobeProbe parses stdout from injected runProcess", async () => {
  // Arrange
  const fixture = await Bun.file(
    `${import.meta.dir}/../fixtures/ffprobe/minimal-audio.json`,
  ).text();

  const runProcess: ProcessRunner = async () => ({
    kind: "exited",
    exitCode: 0,
    stdout: fixture,
    stderr: "",
  });

  // Act
  const result = await runFfprobeProbe({
    ffprobePath: "/opt/ffprobe",
    inputPath: "any.m4a",
    runProcess,
  });

  // Assert
  expect(result.ok).toBe(true);
  if (!result.ok) {
    return;
  }

  expect(result.value.streams[0]?.codec_type).toBe("audio");
});

test("runFfprobeProbe maps non-zero exit to non-zero-exit error", async () => {
  const runProcess: ProcessRunner = async () => ({
    kind: "exited",
    exitCode: 1,
    stdout: "",
    stderr: "probe failed",
  });

  const result = await runFfprobeProbe({
    ffprobePath: "/bin/ffprobe",
    inputPath: "any.m4a",
    runProcess,
  });

  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }

  expect(result.error.kind).toBe("non-zero-exit");
  if (result.error.kind !== "non-zero-exit") {
    return;
  }

  expect(result.error.exitCode).toBe(1);
});

test("runFfprobeProbe maps whitespace-only stdout to empty-output after zero exit", async () => {
  const runProcess: ProcessRunner = async () => ({
    kind: "exited",
    exitCode: 0,
    stdout: "   ",
    stderr: "",
  });

  const result = await runFfprobeProbe({
    ffprobePath: "/bin/ffprobe",
    inputPath: "any.m4a",
    runProcess,
  });

  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }

  expect(result.error.kind).toBe("empty-output");
});

test("runFfprobeProbe maps spawn-failed process result", async () => {
  const runProcess: ProcessRunner = async () => ({
    kind: "spawn-failed",
    error: new Error("ENOENT"),
  });

  const result = await runFfprobeProbe({
    ffprobePath: "/missing/ffprobe",
    inputPath: "any.m4a",
    runProcess,
  });

  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }

  expect(result.error.kind).toBe("spawn-failed");
  if (result.error.kind !== "spawn-failed") {
    return;
  }

  expect(result.error.message).toBe("ENOENT");
});
