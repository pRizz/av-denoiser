import { describe, expect, test } from "bun:test";
import {
  durationVerificationToleranceSeconds,
  verifyCleanOutput,
} from "../../src/domain/clean-output-verify";
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

describe("verifyCleanOutput", () => {
  const existsTrue = () => true;
  const sizeNonEmpty = () => 100;

  test("matching durations within tolerance => ok", () => {
    const input = probeVideoAudio("100.0", "h264");
    const output = probeVideoAudio("100.2", "h264");

    const result = verifyCleanOutput({
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

    const result = verifyCleanOutput({
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

    const result = verifyCleanOutput({
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

    const result = verifyCleanOutput({
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

  test("zero-byte file => empty-output", () => {
    const input = probeVideoAudio("10.0", "h264");
    const output = probeVideoAudio("10.0", "h264");

    const result = verifyCleanOutput({
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
});
