import { expect, test } from "bun:test";

import {
  type AudioArgvContext,
  afftdnNoiseFloor,
  buildLogicalStepCommand,
} from "../../src/domain/audio-pipeline-argv";
import type { LogicalPipelineStep } from "../../src/domain/audio-pipeline-plan";

const baseCtx = (): AudioArgvContext => ({
  streamIndex: 2,
  sampleRate: 48_000,
  channelCount: 2,
  plannedAudioCodec: "aac",
  plannedContainer: "mp4",
  inputMediaPath: "/in/media.m4a",
  intermediateInPath: "/tmp/a.wav",
  intermediateOutPath: "/tmp/b.wav",
  finalOutputPath: "/out/final.mp4",
});

test("extract step argv includes pcm_s16le map and stream 0:2", () => {
  const step: LogicalPipelineStep = {
    tool: "ffmpeg",
    step: { kind: "extract-pcm-wav", interchange: "wav-pcm-s16le" },
  };

  const result = buildLogicalStepCommand({
    step,
    ctx: baseCtx(),
    ffmpegExecutable: "/bin/ffmpeg",
    maybeSoxExecutable: null,
  });

  expect(result.kind).toBe("created");
  if (result.kind !== "created") {
    return;
  }

  const { args } = result.command;
  expect(args).toContain("-map");
  expect(args).toContain("0:2");
  expect(args).toContain("pcm_s16le");
  expect(args).toContain("48000");
  expect(args).toContain("2");
  expect(args).toContain("-f");
  expect(args).toContain("wav");
});

test("afftdn at noiseStrength 0 produces deterministic nf substring", () => {
  const nf = afftdnNoiseFloor(0);

  expect(nf).toBe(-15);

  const step: LogicalPipelineStep = {
    tool: "ffmpeg",
    step: { kind: "afftdn", noiseStrength: 0 },
  };

  const result = buildLogicalStepCommand({
    step,
    ctx: baseCtx(),
    ffmpegExecutable: "/bin/ffmpeg",
    maybeSoxExecutable: null,
  });

  expect(result.kind).toBe("created");
  if (result.kind !== "created") {
    return;
  }

  const afftdnArg = result.command.args.find((a) => a.startsWith("afftdn="));

  expect(afftdnArg).toBe("afftdn=nf=-15");
});

test("encode aac mp4 includes 192k and aac codec", () => {
  const step: LogicalPipelineStep = {
    tool: "ffmpeg",
    step: {
      kind: "encode-deliverable",
      audioCodec: "aac",
      container: "mp4",
    },
  };

  const result = buildLogicalStepCommand({
    step,
    ctx: baseCtx(),
    ffmpegExecutable: "/bin/ffmpeg",
    maybeSoxExecutable: null,
  });

  expect(result.kind).toBe("created");
  if (result.kind !== "created") {
    return;
  }

  const { args } = result.command;
  expect(args).toContain("-c:a");
  expect(args).toContain("aac");
  expect(args).toContain("192k");
});

test("SoX gentle dynamics prefixes executable and includes highpass and compand", () => {
  const step: LogicalPipelineStep = {
    tool: "sox",
    step: { kind: "gentle-dynamics" },
  };

  const result = buildLogicalStepCommand({
    step,
    ctx: baseCtx(),
    ffmpegExecutable: "/bin/ffmpeg",
    maybeSoxExecutable: "/tmp/mock-sox",
  });

  expect(result.kind).toBe("created");
  if (result.kind !== "created") {
    return;
  }

  expect(result.command.executable).toBe("/tmp/mock-sox");
  expect(result.command.args).toContain("highpass");
  expect(result.command.args).toContain("compand");
});

test("SoX step invalid when executable missing", () => {
  const step: LogicalPipelineStep = {
    tool: "sox",
    step: { kind: "gentle-dynamics" },
  };

  const result = buildLogicalStepCommand({
    step,
    ctx: baseCtx(),
    ffmpegExecutable: "/bin/ffmpeg",
    maybeSoxExecutable: null,
  });

  expect(result.kind).toBe("invalid");
});
