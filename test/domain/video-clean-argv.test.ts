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
  });
});

describe("buildRemuxVideoWithProcessedAudioCommand", () => {
  test("reencode-h264 argv uses libx264 and yuv420p, not stream copy", () => {
    const built = buildRemuxVideoWithProcessedAudioCommand({
      ffmpegExecutable: "/bin/ffmpeg",
      originalVideoPath: "/in/w.ogv",
      processedAudioPath: "/tmp/audio.m4a",
      resolvedOutputPath: "/out/final.mp4",
      plannedAudioCodec: "aac",
      videoStreamMode: "reencode-h264",
    });

    expect(built.kind).toBe("created");
    if (built.kind !== "created") {
      return;
    }

    const argv = built.command.args;
    const joined = argv.join(" ");

    expect(argv).toContain("-c:v");
    expect(argv).toContain("libx264");
    expect(argv).toContain("-pix_fmt");
    expect(argv).toContain("yuv420p");
    expect(joined).not.toContain(" copy");
    expect(joined.indexOf("-c:v")).toBeLessThan(joined.indexOf("libx264"));
  });
});
