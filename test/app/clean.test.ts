import { expect, test } from "bun:test";

import { type CleanRunInput, runCleanRequest } from "../../src/app/clean";

const minimalAudioFixture = await Bun.file(
  `${import.meta.dir}/../fixtures/ffprobe/minimal-audio.json`,
).text();

const minimalVideoAudioFixture = await Bun.file(
  `${import.meta.dir}/../fixtures/ffprobe/minimal-video-audio.json`,
).text();

const fallbackMultiVideoProbe = JSON.stringify({
  streams: [
    {
      index: 0,
      codec_name: "h264",
      codec_type: "video",
      disposition: { default: 1 },
    },
    {
      index: 3,
      codec_name: "h264",
      codec_type: "video",
      disposition: { default: 0 },
    },
    {
      index: 1,
      codec_name: "aac",
      codec_type: "audio",
      channels: 2,
      sample_rate: "44100",
      disposition: { default: 1 },
    },
  ],
  format: {
    duration: "60.120000",
    format_name: "mov,mp4,m4a,3gp,3g2,mj2",
  },
});

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

function baseCleanInput(overrides: Partial<CleanRunInput>): CleanRunInput {
  return {
    inputPath: "clip.m4a",
    force: false,
    dryRun: true,
    json: false,
    presetId: "speech-light" as const,
    knobs: { noiseStrength: 0.3 },
    allowVideoFallback: false,
    ...overrides,
  };
}

test("runCleanRequest dry-run speech-light does not invoke ffmpeg (probe still runs)", async () => {
  let ffmpegInvocations = 0;

  const outcome = await runCleanRequest(baseCleanInput({ dryRun: true }), {
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
  });

  expect(ffmpegInvocations).toBe(0);
  expect(outcome.kind).toBe("success");
  if (outcome.kind !== "success" || outcome.clean === undefined) {
    return;
  }

  expect(outcome.clean.dryRun).toBe(true);
  expect(outcome.clean.summary.steps.length).toBe(3);
});

test("runCleanRequest video-copy-safe dry-run succeeds with extract and remux steps", async () => {
  const outcome = await runCleanRequest(
    baseCleanInput({
      inputPath: "clip.mp4",
      dryRun: true,
      knobs: { noiseStrength: 0.2 },
    }),
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

  expect(outcome.kind).toBe("success");
  if (outcome.kind !== "success" || outcome.clean === undefined) {
    return;
  }

  expect(outcome.clean.summary.modality).toBe("video-copy-safe");
  expect(outcome.clean.summary.steps.length).toBe(4);
  const joined = outcome.clean.summary.steps
    .map((s) => s.displayCommand)
    .join("\n");
  expect(joined).toContain("-vn");
  expect(joined).toContain("-c:v");
  expect(joined).toContain("copy");
});

test("runCleanRequest fallback-required without allow flag returns fallback-required", async () => {
  const outcome = await runCleanRequest(
    baseCleanInput({
      inputPath: "multi.mp4",
      dryRun: true,
      allowVideoFallback: false,
    }),
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout: fallbackMultiVideoProbe,
        stderr: "",
      }),
      outputExists: () => false,
    },
  );

  expect(outcome.kind).toBe("failure");
  if (outcome.kind !== "failure") {
    return;
  }

  expect(outcome.reason.kind).toBe("fallback-required");
});

test("runCleanRequest fallback-required with allowVideoFallback dry-run succeeds", async () => {
  const outcome = await runCleanRequest(
    baseCleanInput({
      inputPath: "multi.mp4",
      dryRun: true,
      allowVideoFallback: true,
    }),
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout: fallbackMultiVideoProbe,
        stderr: "",
      }),
      outputExists: () => false,
    },
  );

  expect(outcome.kind).toBe("success");
});

test("runCleanRequest unsupported modality mentions inspect", async () => {
  const noAudioProbe = JSON.stringify({
    streams: [{ index: 0, codec_name: "h264", codec_type: "video" }],
    format: {},
  });

  const outcome = await runCleanRequest(
    baseCleanInput({
      inputPath: "vonly.mp4",
      dryRun: true,
      knobs: { noiseStrength: 0.2 },
    }),
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

  expect(outcome.reason.message).toContain("inspect");
});

test("runCleanRequest speech-soft-sox missing SoX reports missing-tools sorted", async () => {
  const outcome = await runCleanRequest(
    baseCleanInput({
      dryRun: false,
      presetId: "speech-soft-sox",
      knobs: { noiseStrength: 0.2 },
    }),
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

test("runCleanRequest speech-light executes ffmpeg pipeline plus output probe", async () => {
  let count = 0;

  const outcome = await runCleanRequest(
    baseCleanInput({
      dryRun: false,
      knobs: { noiseStrength: 0.2 },
      force: true,
    }),
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      mkdtempSync: () => "/tmp/av-test-clean",
      rmSync: () => {},
      outputExists: () => true,
      outputFileSize: () => 1024,
      runProcess: async (_cmd) => {
        count += 1;

        return {
          kind: "exited",
          exitCode: 0,
          stdout: minimalAudioFixture,
          stderr: "",
        };
      },
    },
  );

  expect(outcome.kind).toBe("success");
  expect(count).toBe(5);
  if (outcome.kind === "success" && outcome.clean !== undefined) {
    expect(outcome.clean.maybeReportText).toContain("Verified:");
  }
});

test("runCleanRequest video-copy-safe execute runs extract remux and output probe", async () => {
  let ffprobeCalls = 0;
  let ffmpegArgsJoined = "";

  const outcome = await runCleanRequest(
    baseCleanInput({
      inputPath: "clip.mp4",
      dryRun: false,
      knobs: { noiseStrength: 0.2 },
      force: true,
    }),
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      mkdtempSync: () => "/tmp/av-test-clean-video",
      rmSync: () => {},
      outputExists: () => true,
      outputFileSize: () => 4096,
      runProcess: async (cmd) => {
        if (cmd.executable.includes("ffprobe")) {
          ffprobeCalls += 1;

          return {
            kind: "exited",
            exitCode: 0,
            stdout: minimalVideoAudioFixture,
            stderr: "",
          };
        }

        ffmpegArgsJoined += cmd.args.join(" ");

        return {
          kind: "exited",
          exitCode: 0,
          stdout: "",
          stderr: "",
        };
      },
    },
  );

  expect(outcome.kind).toBe("success");
  expect(ffprobeCalls).toBe(2);
  expect(ffmpegArgsJoined).toContain("-vn");
  expect(ffmpegArgsJoined).toContain("copy");
});
