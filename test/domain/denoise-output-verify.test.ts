import { describe, expect, test } from "bun:test";
import {
  durationVerificationToleranceSeconds,
  verifyDenoiseOutput,
} from "../../src/domain/denoise-output-verify";
import type { MediaProbe } from "../../src/domain/media-probe";

function probeVideoAudio(duration: string, videoCodec: string): MediaProbe {
  return {
    streams: [
      {
        index: 0,
        codec_type: "video",
        codec_name: videoCodec,
      },
      {
        index: 1,
        codec_type: "audio",
        codec_name: "aac",
      },
    ],
    format: { duration },
  };
}

describe("durationVerificationToleranceSeconds", () => {
  test("100s input uses min absolute 0.5s", () => {
    expect(durationVerificationToleranceSeconds(100)).toBe(0.5);
  });

  test("200s input uses 1.0s relative cap", () => {
    expect(durationVerificationToleranceSeconds(200)).toBe(1);
  });
});

describe("verifyDenoiseOutput", () => {
  const existsTrue = () => true;
  const sizeNonEmpty = () => 100;

  test("matching durations within tolerance => ok", () => {
    const input = probeVideoAudio("100.0", "h264");
    const output = probeVideoAudio("100.2", "h264");

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("ok");
  });

  test("duration beyond tolerance => duration-mismatch detail", () => {
    const input = probeVideoAudio("100.0", "h264");
    const output = probeVideoAudio("102.0", "h264");

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("duration-mismatch");
      expect(result.detail).toContain("duration-mismatch");
    }
  });

  test("matching h264 both sides => ok", () => {
    const input = probeVideoAudio("10.0", "h264");
    const output = probeVideoAudio("10.0", "h264");

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("ok");
  });

  test("h265 vs hevc probe strings canonical match => ok for video-copy-safe verify", () => {
    const input: MediaProbe = {
      streams: [
        { index: 0, codec_type: "video", codec_name: "h265" },
        { index: 1, codec_type: "audio", codec_name: "aac" },
      ],
      format: { duration: "10.0" },
    };
    const output: MediaProbe = {
      streams: [
        { index: 0, codec_type: "video", codec_name: "hevc" },
        { index: 1, codec_type: "audio", codec_name: "aac" },
      ],
      format: { duration: "10.0" },
    };

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("ok");
  });

  test("hev1 vs hevc probe strings canonical match => ok for video-copy-safe verify (MULTI-13)", () => {
    const input: MediaProbe = {
      streams: [
        { index: 0, codec_type: "video", codec_name: "hev1" },
        { index: 1, codec_type: "audio", codec_name: "aac" },
      ],
      format: { duration: "10.0" },
    };
    const output: MediaProbe = {
      streams: [
        { index: 0, codec_type: "video", codec_name: "hevc" },
        { index: 1, codec_type: "audio", codec_name: "aac" },
      ],
      format: { duration: "10.0" },
    };

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("ok");
  });

  test("hevc vs h264 => video-copy-mismatch", () => {
    const input = probeVideoAudio("10.0", "h264");
    const output = probeVideoAudio("10.0", "hevc");

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("video-copy-mismatch");
    }
  });

  test("input video missing codec_name in probe => video-copy-mismatch", () => {
    const input: MediaProbe = {
      streams: [
        { index: 0, codec_type: "video" },
        { index: 1, codec_type: "audio", codec_name: "aac" },
      ],
      format: { duration: "10.0" },
    };
    const output = probeVideoAudio("10.0", "h264");

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("video-copy-mismatch");
      expect(result.detail).toContain("missing codec_name");
    }
  });

  test("vp09 vs vp9 probe codec_name => ok for video-copy-safe verify", () => {
    const input: MediaProbe = {
      streams: [
        { index: 0, codec_type: "video", codec_name: "vp09" },
        { index: 1, codec_type: "audio", codec_name: "opus" },
      ],
      format: { duration: "10.0" },
    };
    const output: MediaProbe = {
      streams: [
        { index: 0, codec_type: "video", codec_name: "vp9" },
        { index: 1, codec_type: "audio", codec_name: "opus" },
      ],
      format: { duration: "10.0" },
    };

    const result = verifyDenoiseOutput({
      outputPath: "/out.webm",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("ok");
  });

  test("av01 vs av1 probe codec_name => ok for video-copy-safe verify", () => {
    const input: MediaProbe = {
      streams: [
        { index: 0, codec_type: "video", codec_name: "av01" },
        { index: 1, codec_type: "audio", codec_name: "aac" },
      ],
      format: { duration: "10.0" },
    };
    const output: MediaProbe = {
      streams: [
        { index: 0, codec_type: "video", codec_name: "av1" },
        { index: 1, codec_type: "audio", codec_name: "aac" },
      ],
      format: { duration: "10.0" },
    };

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("ok");
  });

  test("vp09 vs h264 => video-copy-mismatch", () => {
    const input = probeVideoAudio("10.0", "vp09");
    const output = probeVideoAudio("10.0", "h264");

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("video-copy-mismatch");
    }
  });

  test("theora vs vp9 => video-copy-mismatch", () => {
    const input = probeVideoAudio("10.0", "theora");
    const output = probeVideoAudio("10.0", "vp9");

    const result = verifyDenoiseOutput({
      outputPath: "/out.webm",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("video-copy-mismatch");
    }
  });

  test("zero-byte file => empty-output", () => {
    const input = probeVideoAudio("10.0", "h264");
    const output = probeVideoAudio("10.0", "h264");

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: () => 0,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "video-copy-safe",
      claimedVideoCopied: true,
    });

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("empty-output");
      expect(result.detail).toContain("empty-output");
    }
  });

  test("fallback-required re-encode: input h264 output hevc => ok", () => {
    const input = probeVideoAudio("10.0", "h264");
    const output = probeVideoAudio("10.0", "hevc");

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "fallback-required",
      claimedVideoCopied: false,
    });

    expect(result.kind).toBe("ok");
  });

  test("fallback-required re-encode: output h264 => video-reencode-codec-mismatch", () => {
    const input = probeVideoAudio("10.0", "h264");
    const output = probeVideoAudio("10.0", "h264");

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "fallback-required",
      claimedVideoCopied: false,
    });

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("video-reencode-codec-mismatch");
    }
  });

  test("fallback-required re-encode: output hev1 probe string => ok", () => {
    const input = probeVideoAudio("10.0", "h264");
    const output = probeVideoAudio("10.0", "hev1");

    const result = verifyDenoiseOutput({
      outputPath: "/out.mp4",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "fallback-required",
      claimedVideoCopied: false,
    });

    expect(result.kind).toBe("ok");
  });

  test("fallback-required re-encode: missing output video stream => missing-video-stream", () => {
    const input = probeVideoAudio("10.0", "h264");
    const output: MediaProbe = {
      streams: [{ index: 0, codec_type: "audio", codec_name: "aac" }],
      format: { duration: "10.0" },
    };

    const result = verifyDenoiseOutput({
      outputPath: "/out.m4a",
      outputExists: existsTrue,
      outputFileSize: sizeNonEmpty,
      inputProbe: input,
      outputProbe: output,
      plannedModality: "fallback-required",
      claimedVideoCopied: false,
    });

    expect(result.kind).toBe("failure");
    if (result.kind === "failure") {
      expect(result.reason).toBe("missing-video-stream");
    }
  });
});
