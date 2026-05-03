import { describe, expect, test } from "bun:test";
import { renderDisplayCommand } from "../../src/domain/process-command";
import {
  buildExtractPrimaryAudioWavCommand,
  buildRemuxVideoCopyCommand,
  buildRemuxVideoWithProcessedAudioCommand,
} from "../../src/domain/video-clean-argv";

describe("buildExtractPrimaryAudioWavCommand", () => {
  test("argv includes pcm_s16le extract sequence", () => {
    const built = buildExtractPrimaryAudioWavCommand({
      ffmpegExecutable: "/bin/ffmpeg",
      inputVideoPath: "/in/video.mp4",
      selectedAudioStreamIndex: 1,
      sampleRate: 48_000,
      channelCount: 2,
      outputWavPath: "/tmp/extract.wav",
    });

    expect(built.kind).toBe("created");
    if (built.kind !== "created") {
      return;
    }

    const text = renderDisplayCommand(built.command);
    expect(text).toContain("/bin/ffmpeg");
    expect(text).toContain("-i");
    expect(text).toContain("/in/video.mp4");
    expect(text).toContain("-vn");
    expect(text).toContain("-map");
    expect(text).toContain("0:1");
    expect(text).toContain("pcm_s16le");
    expect(text).toContain("48000");
    expect(text).toContain("-ac");
    expect(text).toContain("2");
    expect(text).toContain("/tmp/extract.wav");
  });
});

describe("buildRemuxVideoCopyCommand", () => {
  test("argv includes stream copy and audio maps", () => {
    const built = buildRemuxVideoCopyCommand({
      ffmpegExecutable: "/bin/ffmpeg",
      originalVideoPath: "/in/v.mp4",
      processedAudioPath: "/tmp/audio.m4a",
      resolvedOutputPath: "/out/final.mp4",
      plannedAudioCodec: "aac",
      plannedContainer: "mp4",
    });

    expect(built.kind).toBe("created");
    if (built.kind !== "created") {
      return;
    }

    const argv = built.command.args;
    const joined = argv.join(" ");

    expect(joined.indexOf("-c:v")).toBeLessThan(joined.indexOf("copy"));
    expect(argv).toContain("-map");
    expect(argv).toContain("0:v:0");
    expect(argv).toContain("1:a:0");
    expect(argv).toContain("copy");
    expect(argv).toContain("-c:a");
    expect(argv).toContain("aac");

    /** Deliberately omit `-f mp4` per MULTI-06 CONTEXT — extension + codecs suffice. */
    expect(joined).not.toContain("-f mp4");
  });
});

describe("buildRemuxVideoWithProcessedAudioCommand", () => {
  test("copy webm includes -f webm before output libopus and 128k", () => {
    const out = "/out/final.avdn.webm";

    const built = buildRemuxVideoWithProcessedAudioCommand({
      ffmpegExecutable: "/bin/ffmpeg",
      originalVideoPath: "/in/in.webm",
      processedAudioPath: "/tmp/pipe-opus.wav",
      resolvedOutputPath: out,
      plannedAudioCodec: "opus",
      plannedContainer: "webm",
      videoStreamMode: "copy",
    });

    expect(built.kind).toBe("created");
    if (built.kind !== "created") {
      return;
    }

    const argv = built.command.args;
    expect(argv.at(-3)).toBe("-f");
    expect(argv.at(-2)).toBe("webm");
    expect(argv.at(-1)).toBe(out);
    expect(argv).toContain("libopus");
    expect(argv).toContain("128k");
    expect(argv).not.toContain("matroska");
  });

  test("copy matroska includes -f matroska before output and AAC 192k", () => {
    const out = "/out/final.avdn.mkv";

    const built = buildRemuxVideoWithProcessedAudioCommand({
      ffmpegExecutable: "/bin/ffmpeg",
      originalVideoPath: "/in/in.mkv",
      processedAudioPath: "/tmp/audio.m4a",
      resolvedOutputPath: out,
      plannedAudioCodec: "aac",
      plannedContainer: "matroska",
      videoStreamMode: "copy",
    });

    expect(built.kind).toBe("created");
    if (built.kind !== "created") {
      return;
    }

    const argv = built.command.args;
    expect(argv.at(-3)).toBe("-f");
    expect(argv.at(-2)).toBe("matroska");
    expect(argv.at(-1)).toBe(out);
    expect(argv).toContain("192k");
  });

  test("reencode-hevc argv uses libx265, yuv420p, crf 28, preset slow, hvc1", () => {
    const built = buildRemuxVideoWithProcessedAudioCommand({
      ffmpegExecutable: "/bin/ffmpeg",
      originalVideoPath: "/in/w.ogv",
      processedAudioPath: "/tmp/audio.m4a",
      resolvedOutputPath: "/out/final.mp4",
      plannedAudioCodec: "aac",
      plannedContainer: "mp4",
      videoStreamMode: "reencode-hevc",
    });

    expect(built.kind).toBe("created");
    if (built.kind !== "created") {
      return;
    }

    const argv = built.command.args;
    const joined = argv.join(" ");

    expect(argv).toContain("-c:v");
    expect(argv).toContain("libx265");
    expect(argv).not.toContain("libx264");
    expect(argv).toContain("-pix_fmt");
    expect(argv).toContain("yuv420p");
    expect(argv).toContain("-crf");
    expect(argv).toContain("28");
    expect(argv).toContain("-preset");
    expect(argv).toContain("slow");
    expect(argv).toContain("-tag:v");
    expect(argv).toContain("hvc1");
    expect(joined).not.toContain(" copy");
    expect(joined.indexOf("-c:v")).toBeLessThan(joined.indexOf("libx265"));
  });

  test("reject pcm_s16le for video remux", () => {
    const built = buildRemuxVideoWithProcessedAudioCommand({
      ffmpegExecutable: "/bin/ffmpeg",
      originalVideoPath: "/in/v.mp4",
      processedAudioPath: "/tmp/x.wav",
      resolvedOutputPath: "/out/out.mp4",
      plannedAudioCodec: "pcm_s16le",
      plannedContainer: "mp4",
      videoStreamMode: "copy",
    });

    expect(built.kind).toBe("invalid");
    if (built.kind !== "invalid") {
      return;
    }

    expect(built.reason).toContain("pcm_s16le");
    expect(built.reason).toContain("remux");
  });
});
