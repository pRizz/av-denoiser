import { expect, test } from "bun:test";

import { runInspectRequest } from "../../src/app/inspect";

test("runInspectRequest fails when ffprobe is missing from PATH", async () => {
  // Act
  const outcome = await runInspectRequest(
    {
      kind: "inspect",
      inputPath: "clip.wav",
      force: false,
      json: false,
    },
    { maybeWhich: () => null },
  );

  // Assert
  expect(outcome.kind).toBe("failure");
  if (outcome.kind !== "failure") {
    return;
  }

  expect(outcome.reason.kind).toBe("missing-tools");
  if (outcome.reason.kind !== "missing-tools") {
    return;
  }

  expect(outcome.reason.tools).toContain("ffprobe");
});

test("runInspectRequest returns inspect summary when probe succeeds", async () => {
  // Arrange
  const fixture = await Bun.file(
    `${import.meta.dir}/../fixtures/ffprobe/minimal-audio.json`,
  ).text();

  // Act
  const outcome = await runInspectRequest(
    {
      kind: "inspect",
      inputPath: "clip.m4a",
      force: false,
      json: false,
    },
    {
      cwd: "/project",
      maybeWhich: () => "/bin/ffprobe",
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout: fixture,
        stderr: "",
      }),
      outputExists: () => false,
    },
  );

  // Assert
  expect(outcome.kind).toBe("success");
  if (outcome.kind !== "success" || outcome.inspect === undefined) {
    return;
  }

  expect(outcome.inspect.summary.modality).toBe("audio-only");
  expect(outcome.inspect.summary.plannedAudioCodec).toBe("aac");
});

test("runInspectRequest json flag preserves planned codec and container in serialized summary", async () => {
  // Arrange
  const fixture = await Bun.file(
    `${import.meta.dir}/../fixtures/ffprobe/minimal-audio.json`,
  ).text();

  // Act
  const outcome = await runInspectRequest(
    {
      kind: "inspect",
      inputPath: "clip.m4a",
      force: false,
      json: true,
    },
    {
      cwd: "/project",
      maybeWhich: () => "/bin/ffprobe",
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout: fixture,
        stderr: "",
      }),
      outputExists: () => false,
    },
  );

  // Assert
  expect(outcome.kind).toBe("success");
  if (outcome.kind !== "success" || outcome.inspect === undefined) {
    return;
  }

  expect(outcome.inspect.json).toBe(true);
  const serialized = JSON.stringify(outcome.inspect.summary);
  expect(serialized).toContain('"plannedAudioCodec":"aac"');
  expect(serialized).toContain('"plannedContainer":"mp4"');
});

test("runInspectRequest surfaces planning-failure when output collides", async () => {
  // Arrange
  const fixture = await Bun.file(
    `${import.meta.dir}/../fixtures/ffprobe/minimal-audio.json`,
  ).text();

  // Act
  const outcome = await runInspectRequest(
    {
      kind: "inspect",
      inputPath: "clip.m4a",
      force: false,
      json: false,
    },
    {
      cwd: "/project",
      maybeWhich: () => "/bin/ffprobe",
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout: fixture,
        stderr: "",
      }),
      outputExists: () => true,
    },
  );

  // Assert
  expect(outcome.kind).toBe("failure");
  if (outcome.kind !== "failure") {
    return;
  }

  expect(outcome.reason.kind).toBe("planning-failure");
});
