import { expect, test } from "bun:test";

import { runCleanRequest } from "../../src/app/clean";

const minimalAudioFixture = await Bun.file(
  `${import.meta.dir}/../fixtures/ffprobe/minimal-audio.json`,
).text();

const minimalVideoAudioFixture = await Bun.file(
  `${import.meta.dir}/../fixtures/ffprobe/minimal-video-audio.json`,
).text();

function fakeWhichVideoScenario() {
  return (name: string) => {
    const map: Record<string, string | null> = {
      ffmpeg: "/bin/ffmpeg",
      ffprobe: "/bin/ffprobe",
      sox_ng: null,
      sox: null,
    };

    return map[name] ?? null;
  };
}

test("runCleanRequest dry-run speech-light does not invoke ffmpeg (probe still runs)", async () => {
  let ffmpegInvocations = 0;

  const outcome = await runCleanRequest(
    {
      inputPath: "clip.m4a",
      force: false,
      dryRun: true,
      json: false,
      presetId: "speech-light",
      knobs: { noiseStrength: 0.3 },
    },
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      runProcess: async (cmd) => {
        if (cmd.executable === "/bin/ffmpeg") {
          ffmpegInvocations += 1;
        }

        return {
          kind: "exited",
          exitCode: 0,
          stdout: minimalAudioFixture,
          stderr: "",
        };
      },
      outputExists: () => false,
    },
  );

  expect(ffmpegInvocations).toBe(0);
  expect(outcome.kind).toBe("success");
  if (outcome.kind !== "success" || outcome.clean === undefined) {
    return;
  }

  expect(outcome.clean.dryRun).toBe(true);
  expect(outcome.clean.summary.steps.length).toBe(3);
});

test("runCleanRequest video-copy-safe fails invalid-input mentioning Phase 5", async () => {
  const outcome = await runCleanRequest(
    {
      inputPath: "clip.mp4",
      force: false,
      dryRun: true,
      json: false,
      presetId: "speech-light",
      knobs: { noiseStrength: 0.2 },
    },
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout: minimalVideoAudioFixture,
        stderr: "",
      }),
      outputExists: () => false,
    },
  );

  expect(outcome.kind).toBe("failure");
  if (outcome.kind !== "failure") {
    return;
  }

  expect(outcome.reason.kind).toBe("invalid-input");
  if (outcome.reason.kind !== "invalid-input") {
    return;
  }

  expect(outcome.reason.message).toContain("Phase 5");
});

test("runCleanRequest unsupported modality mentions audio-only and inspect", async () => {
  const noAudioProbe = JSON.stringify({
    streams: [{ index: 0, codec_name: "h264", codec_type: "video" }],
    format: {},
  });

  const outcome = await runCleanRequest(
    {
      inputPath: "vonly.mp4",
      force: false,
      dryRun: true,
      json: false,
      presetId: "speech-light",
      knobs: { noiseStrength: 0.2 },
    },
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout: noAudioProbe,
        stderr: "",
      }),
      outputExists: () => false,
    },
  );

  expect(outcome.kind).toBe("failure");
  if (outcome.kind !== "failure") {
    return;
  }

  expect(outcome.reason.kind).toBe("invalid-input");
  if (outcome.reason.kind !== "invalid-input") {
    return;
  }

  expect(outcome.reason.message.toLowerCase()).toContain("audio-only");
  expect(outcome.reason.message).toContain("inspect");
});

test("runCleanRequest speech-soft-sox missing SoX reports missing-tools sorted", async () => {
  const outcome = await runCleanRequest(
    {
      inputPath: "clip.m4a",
      force: false,
      dryRun: false,
      json: false,
      presetId: "speech-soft-sox",
      knobs: { noiseStrength: 0.2 },
    },
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout: minimalAudioFixture,
        stderr: "",
      }),
      outputExists: () => false,
    },
  );

  expect(outcome.kind).toBe("failure");
  if (outcome.kind !== "failure") {
    return;
  }

  expect(outcome.reason.kind).toBe("missing-tools");
  if (outcome.reason.kind !== "missing-tools") {
    return;
  }

  expect(outcome.reason.tools).toEqual(["sox", "sox_ng"]);
});

test("runCleanRequest speech-light executes ffmpeg three times when not dry-run", async () => {
  let count = 0;

  const outcome = await runCleanRequest(
    {
      inputPath: "clip.m4a",
      force: false,
      dryRun: false,
      json: false,
      presetId: "speech-light",
      knobs: { noiseStrength: 0.2 },
    },
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      mkdtempSync: () => "/tmp/av-test-clean",
      rmSync: () => {},
      runProcess: async () => {
        count += 1;

        return {
          kind: "exited",
          exitCode: 0,
          stdout: count === 1 ? minimalAudioFixture : "",
          stderr: "",
        };
      },
      outputExists: () => false,
    },
  );

  expect(outcome.kind).toBe("success");
  expect(count).toBe(4);
});
