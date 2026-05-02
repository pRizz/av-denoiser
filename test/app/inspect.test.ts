import { expect, test } from "bun:test";

import { runInspectRequest } from "../../src/app/inspect";
import {
  renderCommandOutcome,
  renderInspectPlanText,
} from "../../src/cli/render";
import { canonicalInputPath } from "../../src/domain/output-path";

/** Resolved input exists; default output beside input does not (typical dry-run disk). */
function outputExistsForProbeOnly(
  cwd: string,
  inputPath: string,
): (p: string) => boolean {
  const resolvedInput = canonicalInputPath(cwd, inputPath);

  return (p) => p === resolvedInput;
}

test("runInspectRequest fails when ffprobe is missing from PATH", async () => {
  // Act
  const outcome = await runInspectRequest(
    {
      kind: "inspect",
      inputPath: "clip.wav",
      force: false,
      json: false,
      allowVideoFallback: false,
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

test("runInspectRequest fails before ffprobe when input path does not exist", async () => {
  let ffprobeSpawned = false;

  const outcome = await runInspectRequest(
    {
      kind: "inspect",
      inputPath: "/no/such/my movie.mp4",
      force: false,
      json: false,
      allowVideoFallback: false,
    },
    {
      cwd: "/project",
      maybeWhich: () => "/bin/ffprobe",
      runProcess: async () => {
        ffprobeSpawned = true;

        return {
          kind: "exited",
          exitCode: 0,
          stdout: "{}",
          stderr: "",
        };
      },
      outputExists: () => false,
    },
  );

  expect(ffprobeSpawned).toBe(false);
  expect(outcome.kind).toBe("failure");
  if (outcome.kind !== "failure") {
    return;
  }

  expect(outcome.reason.kind).toBe("planning-failure");
  if (outcome.reason.kind !== "planning-failure") {
    return;
  }

  expect(outcome.reason.message).toContain("Input file not found");
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
      allowVideoFallback: false,
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
      outputExists: outputExistsForProbeOnly("/project", "clip.m4a"),
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
      allowVideoFallback: false,
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
      outputExists: outputExistsForProbeOnly("/project", "clip.m4a"),
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
  expect(serialized).toContain('"preservationNotes"');
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
      allowVideoFallback: false,
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

test("runInspectRequest denies fallback-required without allowVideoFallback flag", async () => {
  const stdout = JSON.stringify({
    streams: [
      { index: 0, codec_name: "vp9", codec_type: "video" },
      {
        index: 1,
        codec_name: "aac",
        codec_type: "audio",
        channels: 2,
      },
    ],
    format: { format_name: "webm" },
  });

  const outcome = await runInspectRequest(
    {
      kind: "inspect",
      inputPath: "/in/webm/source.webm",
      force: false,
      json: false,
      allowVideoFallback: false,
    },
    {
      cwd: "/project",
      maybeWhich: () => "/bin/ffprobe",
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout,
        stderr: "",
      }),
      outputExists: outputExistsForProbeOnly(
        "/project",
        "/in/webm/source.webm",
      ),
    },
  );

  expect(outcome.kind).toBe("failure");
  if (outcome.kind !== "failure") {
    return;
  }

  expect(outcome.reason.kind).toBe("fallback-required");
  if (outcome.reason.kind !== "fallback-required") {
    return;
  }

  expect(outcome.reason.message).toContain("--allow-video-fallback");
});

test("runInspectRequest allows fallback-required when acknowledged", async () => {
  const stdout = JSON.stringify({
    streams: [
      { index: 0, codec_name: "vp9", codec_type: "video" },
      {
        index: 1,
        codec_name: "aac",
        codec_type: "audio",
        channels: 2,
      },
    ],
    format: { format_name: "webm" },
  });

  const outcome = await runInspectRequest(
    {
      kind: "inspect",
      inputPath: "/in/webm/source.webm",
      force: false,
      json: false,
      allowVideoFallback: true,
    },
    {
      cwd: "/project",
      maybeWhich: () => "/bin/ffprobe",
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout,
        stderr: "",
      }),
      outputExists: outputExistsForProbeOnly(
        "/project",
        "/in/webm/source.webm",
      ),
    },
  );

  expect(outcome.kind).toBe("success");
  if (outcome.kind !== "success" || outcome.inspect === undefined) {
    return;
  }

  expect(outcome.inspect.summary.modality).toBe("fallback-required");
  expect(outcome.inspect.summary.preservationNotes.length).toBeGreaterThan(0);

  const rendered = renderInspectPlanText(outcome.inspect.summary);
  expect(rendered).toContain("Preservation notes");

  const request = {
    kind: "inspect" as const,
    inputPath: "/in/webm/source.webm",
    force: false,
    json: false,
    allowVideoFallback: true,
  };
  const cliText = renderCommandOutcome(request, outcome, "help-placeholder");
  expect(cliText).toContain("Preservation notes");
});
