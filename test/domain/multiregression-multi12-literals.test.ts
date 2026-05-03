import { expect, test } from "bun:test";

import type { MediaProbe } from "../../src/domain/media-probe";
import { planVideoStreamCopyFeasibility } from "../../src/domain/stream-copy-feasibility";

function mp4IshProbe(videoCodec: string): MediaProbe {
  return {
    streams: [
      {
        index: 0,
        codec_name: videoCodec,
        codec_type: "video",
      },
      { index: 1, codec_name: "aac", codec_type: "audio", channels: 2 },
    ],
    format: { duration: "10", format_name: "mov,mp4,m4a,3gp,3g2,mj2" },
  };
}

test("MULTI-12 literal regression: h264 => video-copy-h264-mp4-v1", () => {
  const r = planVideoStreamCopyFeasibility(mp4IshProbe("h264"));
  expect(r.kind).toBe("video-copy-safe");
  if (r.kind !== "video-copy-safe") {
    return;
  }
  expect(r.reasonCodes[0]).toBe("video-copy-h264-mp4-v1");
});

test("MULTI-12 literal regression: hevc => video-copy-hevc-mp4-v1", () => {
  const r = planVideoStreamCopyFeasibility(mp4IshProbe("hevc"));
  expect(r.kind).toBe("video-copy-safe");
  if (r.kind !== "video-copy-safe") {
    return;
  }
  expect(r.reasonCodes[0]).toBe("video-copy-hevc-mp4-v1");
});

test("MULTI-12 literal regression: h265 alias => video-copy-hevc-mp4-v1", () => {
  const r = planVideoStreamCopyFeasibility(mp4IshProbe("h265"));
  expect(r.kind).toBe("video-copy-safe");
  if (r.kind !== "video-copy-safe") {
    return;
  }
  expect(r.reasonCodes[0]).toBe("video-copy-hevc-mp4-v1");
});

test("MULTI-12 literal regression: av1 => video-copy-av1-mp4-v1", () => {
  const r = planVideoStreamCopyFeasibility(mp4IshProbe("av1"));
  expect(r.kind).toBe("video-copy-safe");
  if (r.kind !== "video-copy-safe") {
    return;
  }
  expect(r.reasonCodes[0]).toBe("video-copy-av1-mp4-v1");
});
