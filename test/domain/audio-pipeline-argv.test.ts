import { expect, test } from "bun:test";

import {
  type AudioArgvContext,
  afftdnNoiseFloor,
  buildLogicalStepCommand,
  demucsTrackStemFromWavPath,
  pipelineAudioOutIntermediateBasename,
  resolveDemucsVocalsWavPath,
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

const demucsOff = {
  demucsExecutable: "",
  demucsModulePrefix: [] as const,
};

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
    ...demucsOff,
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
    ...demucsOff,
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
    ...demucsOff,
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

test("encode opus webm uses libopus and webm mux", () => {
  const step: LogicalPipelineStep = {
    tool: "ffmpeg",
    step: {
      kind: "encode-deliverable",
      audioCodec: "opus",
      container: "webm",
    },
  };

  const result = buildLogicalStepCommand({
    step,
    ctx: {
      ...baseCtx(),
      plannedAudioCodec: "opus",
      plannedContainer: "webm",
      finalOutputPath: "/out/final.webm",
    },
    ffmpegExecutable: "/bin/ffmpeg",
    maybeSoxExecutable: null,
    ...demucsOff,
  });

  expect(result.kind).toBe("created");
  if (result.kind !== "created") {
    return;
  }

  const { args } = result.command;
  expect(args).toContain("-c:a");
  expect(args).toContain("libopus");
  expect(args).toContain("-f");
  expect(args).toContain("webm");
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
    ...demucsOff,
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
    ...demucsOff,
  });

  expect(result.kind).toBe("invalid");
});

test("Demucs two-stems argv uses -o out dir and --two-stems vocals", () => {
  const step: LogicalPipelineStep = {
    tool: "demucs",
    step: { kind: "two-stems-vocals", model: "htdemucs" },
  };

  const result = buildLogicalStepCommand({
    step,
    ctx: {
      ...baseCtx(),
      intermediateInPath: "/w/in/track.wav",
      intermediateOutPath: "/w/outdir",
    },
    ffmpegExecutable: "/bin/ffmpeg",
    maybeSoxExecutable: null,
    demucsExecutable: "/usr/bin/demucs",
    demucsModulePrefix: [],
  });

  expect(result.kind).toBe("created");
  if (result.kind !== "created") {
    return;
  }

  expect(result.command.executable).toBe("/usr/bin/demucs");
  const { args } = result.command;
  expect(args).toContain("-n");
  expect(args).toContain("htdemucs");
  expect(args).toContain("--two-stems");
  expect(args).toContain("vocals");
  expect(args).toContain("-o");
  expect(args).toContain("/w/outdir");
  expect(args).toContain("/w/in/track.wav");
  expect(result.command.env).toEqual({ TQDM_DISABLE: "1" });
});

test("Demucs via python3 -m demucs prefixes module args", () => {
  const step: LogicalPipelineStep = {
    tool: "demucs",
    step: { kind: "two-stems-vocals", model: "htdemucs" },
  };

  const result = buildLogicalStepCommand({
    step,
    ctx: {
      ...baseCtx(),
      intermediateInPath: "/w/x.wav",
      intermediateOutPath: "/w/d",
    },
    ffmpegExecutable: "/bin/ffmpeg",
    maybeSoxExecutable: null,
    demucsExecutable: "/usr/bin/python3",
    demucsModulePrefix: ["-m", "demucs"],
  });

  expect(result.kind).toBe("created");
  if (result.kind !== "created") {
    return;
  }

  expect(result.command.args.slice(0, 3)).toEqual(["-m", "demucs", "-n"]);
  expect(result.command.env).toEqual({ TQDM_DISABLE: "1" });
});

test("ladspa-apply builds -af ladspa= with label and optional c=", () => {
  const step: LogicalPipelineStep = {
    tool: "ffmpeg",
    step: {
      kind: "ladspa-apply",
      pluginPath: "/opt/lv2/foo.so",
      label: "tap_limiter",
      controls: "0|1",
    },
  };

  const result = buildLogicalStepCommand({
    step,
    ctx: baseCtx(),
    ffmpegExecutable: "/bin/ffmpeg",
    maybeSoxExecutable: null,
    ...demucsOff,
  });

  expect(result.kind).toBe("created");
  if (result.kind !== "created") {
    return;
  }

  const ix = result.command.args.indexOf("-af");
  expect(ix).toBeGreaterThan(-1);
  expect(result.command.args[ix + 1]).toBe(
    "ladspa=file=/opt/lv2/foo.so:label=tap_limiter:c=0|1",
  );
});

test("resolveDemucsVocalsWavPath ends with vocals.wav", () => {
  const p = resolveDemucsVocalsWavPath("/out", "song", "htdemucs");

  expect(p.endsWith(`${"/"}htdemucs${"/"}song${"/"}vocals.wav`)).toBe(true);
  expect(demucsTrackStemFromWavPath("/a/b/foo.wav")).toBe("foo");
});

test("pipelineAudioOutIntermediateBasename matches encodeDeliverableArgs matrix", () => {
  expect(pipelineAudioOutIntermediateBasename("aac", "mp4")).toBe(
    "pipeline-audio-out.mp4",
  );
  expect(pipelineAudioOutIntermediateBasename("opus", "webm")).toBe(
    "pipeline-audio-out.webm",
  );
  expect(pipelineAudioOutIntermediateBasename("opus", "matroska")).toBe(
    "pipeline-audio-out.mkv",
  );
  expect(pipelineAudioOutIntermediateBasename("pcm_s16le", "wav")).toBe(
    "pipeline-audio-out.wav",
  );
  expect(pipelineAudioOutIntermediateBasename("aac", "matroska")).toBe(
    "pipeline-audio-out.mp4",
  );
});
