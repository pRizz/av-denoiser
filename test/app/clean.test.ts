import { expect, test } from "bun:test";

import { type CleanRunInput, runCleanRequest } from "../../src/app/clean";
import { canonicalInputPath } from "../../src/domain/output-path";

const minimalAudioFixture = await Bun.file(
  `${import.meta.dir}/../fixtures/ffprobe/minimal-audio.json`,
).text();

const minimalVideoAudioFixture = await Bun.file(
  `${import.meta.dir}/../fixtures/ffprobe/minimal-video-audio.json`,
).text();

const vp8OpusFallbackVideoProbe = JSON.stringify({
  streams: [
    {
      index: 0,
      codec_name: "vp8",
      codec_type: "video",
      disposition: { default: 1 },
    },
    {
      index: 1,
      codec_name: "opus",
      codec_type: "audio",
      channels: 2,
      sample_rate: "48000",
      disposition: { default: 1 },
    },
  ],
  format: {
    duration: "2.840000",
    format_name: "webm",
  },
});

const vp9WebmCopySafeProbe = JSON.stringify({
  streams: [
    {
      index: 0,
      codec_name: "vp9",
      codec_type: "video",
      disposition: { default: 1 },
    },
    {
      index: 1,
      codec_name: "opus",
      codec_type: "audio",
      channels: 2,
      sample_rate: "48000",
      disposition: { default: 1 },
    },
  ],
  format: {
    duration: "120.000000",
    format_name: "webm",
  },
});

const hevcMinimalVideoProbe = JSON.stringify({
  streams: [
    {
      index: 0,
      codec_name: "hevc",
      codec_type: "video",
      disposition: { default: 1 },
    },
    {
      index: 1,
      codec_name: "aac",
      codec_type: "audio",
      channels: 2,
      sample_rate: "48000",
      disposition: { default: 1 },
    },
  ],
  format: {
    duration: "60.120000",
    format_name: "mov,mp4,m4a,3gp,3g2,mj2",
  },
});

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
    acceptAudacityPipeRisk: false,
    ...overrides,
  };
}

function outputExistsForCleanProbeOnly(
  cwd: string,
  inputPath: string,
): (p: string) => boolean {
  const resolvedInput = canonicalInputPath(cwd, inputPath);

  return (p) => p === resolvedInput;
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
    outputExists: outputExistsForCleanProbeOnly("/project", "clip.m4a"),
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
      outputExists: outputExistsForCleanProbeOnly("/project", "clip.mp4"),
    },
  );

  expect(outcome.kind).toBe("success");
  if (outcome.kind !== "success" || outcome.clean === undefined) {
    return;
  }

  expect(outcome.clean.summary.modality).toBe("video-copy-safe");
  expect(outcome.clean.summary.plannedContainer).toBe("mp4");
  expect(outcome.clean.summary.plannedAudioCodec).toBe("aac");
  expect(outcome.clean.summary.reasonCodes).toContain("video-copy-h264-mp4-v1");
  expect(outcome.clean.summary.steps.length).toBe(4);
  const joined = outcome.clean.summary.steps
    .map((s) => s.displayCommand)
    .join("\n");
  expect(joined).toContain("-vn");
  expect(joined).toContain("-c:v");
  expect(joined).toContain("copy");
});

test("runCleanRequest video-copy-safe dry-run VP9 includes -f webm and libopus in remux step", async () => {
  const outcome = await runCleanRequest(
    baseCleanInput({
      inputPath: "clip.webm",
      dryRun: true,
      knobs: { noiseStrength: 0.2 },
    }),
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout: vp9WebmCopySafeProbe,
        stderr: "",
      }),
      outputExists: outputExistsForCleanProbeOnly("/project", "clip.webm"),
    },
  );

  expect(outcome.kind).toBe("success");
  if (outcome.kind !== "success" || outcome.clean === undefined) {
    return;
  }

  expect(outcome.clean.summary.modality).toBe("video-copy-safe");
  const joined = outcome.clean.summary.steps
    .map((s) => s.displayCommand)
    .join("\n");
  expect(joined).toContain("-f webm");
  expect(joined).toContain("libopus");
  expect(joined).toContain("128k");
});

test("runCleanRequest video-copy-safe dry-run succeeds for lone hevc probe with stream copy remux step", async () => {
  const outcome = await runCleanRequest(
    baseCleanInput({
      inputPath: "clip.mov",
      dryRun: true,
      knobs: { noiseStrength: 0.2 },
    }),
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      runProcess: async () => ({
        kind: "exited",
        exitCode: 0,
        stdout: hevcMinimalVideoProbe,
        stderr: "",
      }),
      outputExists: outputExistsForCleanProbeOnly("/project", "clip.mov"),
    },
  );

  expect(outcome.kind).toBe("success");
  if (outcome.kind !== "success" || outcome.clean === undefined) {
    return;
  }

  expect(outcome.clean.summary.modality).toBe("video-copy-safe");
  const joined = outcome.clean.summary.steps
    .map((s) => s.displayCommand)
    .join("\n");
  expect(joined).toContain("-c:v");
  expect(joined).toContain("copy");
  expect(joined).not.toContain("libx264");
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
      outputExists: outputExistsForCleanProbeOnly("/project", "multi.mp4"),
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
      outputExists: outputExistsForCleanProbeOnly("/project", "multi.mp4"),
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
      outputExists: outputExistsForCleanProbeOnly("/project", "vonly.mp4"),
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
      outputExists: outputExistsForCleanProbeOnly("/project", "clip.m4a"),
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

test("runCleanRequest speech-vocals-demucs executes demucs between extract and encode", async () => {
  let demucsInvoked = false;
  let ffmpegIndex = 0;
  let encodeInputPath: string | undefined;

  const maybeWhichDemucs = (name: string) => {
    const map: Record<string, string | null> = {
      ffmpeg: "/bin/ffmpeg",
      ffprobe: "/bin/ffprobe",
      demucs: "/bin/demucs",
      sox_ng: null,
      sox: null,
    };

    return map[name] ?? null;
  };

  const outcome = await runCleanRequest(
    baseCleanInput({
      dryRun: false,
      presetId: "speech-vocals-demucs",
      force: true,
    }),
    {
      cwd: "/project",
      maybeWhich: maybeWhichDemucs,
      mkdtempSync: () => "/tmp/av-test-clean-demucs",
      rmSync: () => {},
      outputExists: () => true,
      outputFileSize: () => 1024,
      runProcess: async (cmd) => {
        if (cmd.executable === "/bin/demucs") {
          demucsInvoked = true;
          expect(cmd.args).toContain("--two-stems");
          expect(cmd.args).toContain("vocals");
          expect(cmd.args).toContain("-n");
          expect(cmd.args).toContain("htdemucs");
          expect(cmd.args).toContain("-o");
        }

        if (cmd.executable === "/bin/ffmpeg") {
          ffmpegIndex += 1;
          const iIdx = cmd.args.indexOf("-i");

          if (ffmpegIndex === 2 && iIdx >= 0) {
            encodeInputPath = cmd.args[iIdx + 1];
          }
        }

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
  expect(demucsInvoked).toBe(true);
  expect(encodeInputPath).toBeDefined();
  expect(encodeInputPath ?? "").toContain("step-1-demucs-out");
  expect(encodeInputPath ?? "").toContain("vocals.wav");
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

test("runCleanRequest fallback-required execute remuxes video with libx265 when allowVideoFallback", async () => {
  let ffprobeCalls = 0;
  let ffmpegArgsJoined = "";
  const ffmpegArgvs: string[][] = [];

  const outcome = await runCleanRequest(
    baseCleanInput({
      inputPath: "clip.webm",
      dryRun: false,
      knobs: { noiseStrength: 0.2 },
      force: true,
      allowVideoFallback: true,
    }),
    {
      cwd: "/project",
      maybeWhich: fakeWhichVideoScenario(),
      mkdtempSync: () => "/tmp/av-test-clean-vp8-fallback",
      rmSync: () => {},
      outputExists: () => true,
      outputFileSize: () => 4096,
      runProcess: async (cmd) => {
        if (cmd.executable.includes("ffprobe")) {
          ffprobeCalls += 1;

          return {
            kind: "exited",
            exitCode: 0,
            stdout:
              ffprobeCalls === 1
                ? vp8OpusFallbackVideoProbe
                : minimalVideoAudioFixture,
            stderr: "",
          };
        }

        ffmpegArgvs.push([...cmd.args]);
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
  expect(ffmpegArgsJoined).toContain("libx265");

  const libx265Argv = ffmpegArgvs.find((a) => a.includes("libx265"));
  expect(libx265Argv).toBeDefined();
  expect(libx265Argv?.join(" ")).not.toContain("-f webm");
  if (outcome.kind === "success" && outcome.clean !== undefined) {
    expect(outcome.clean.maybeReportText).toContain("re-encoded");
    expect(outcome.clean.maybeReportText).toContain(
      "Video: re-encoded (HEVC, libx265)",
    );
  }
});
