import { expect, test } from "bun:test";

import type { MediaProbe } from "../../src/domain/media-probe";
import {
  canonicalVideoCodecForMatrix,
  planVideoStreamCopyFeasibility,
} from "../../src/domain/stream-copy-feasibility";

const baseAa: MediaProbe["streams"][number][] = [
  { index: 1, codec_name: "aac", codec_type: "audio", channels: 2 },
];

test("planVideoStreamCopyFeasibility copy-safe VP9 maps to webm + video-copy-vp9-webm-v1", () => {
  const probe: MediaProbe = {
    streams: [{ index: 0, codec_name: "vp9", codec_type: "video" }, ...baseAa],
    format: { format_name: "webm" },
  };

  const r = planVideoStreamCopyFeasibility(probe);
  expect(r.kind).toBe("video-copy-safe");
  if (r.kind !== "video-copy-safe") {
    return;
  }

  expect(r.plannedContainer).toBe("webm");
  expect(r.reasonCodes[0]).toBe("video-copy-vp9-webm-v1");
});

test("planVideoStreamCopyFeasibility copy-safe theora maps to matroska", () => {
  const probe: MediaProbe = {
    streams: [
      { index: 0, codec_name: "theora", codec_type: "video" },
      { index: 1, codec_name: "vorbis", codec_type: "audio", channels: 2 },
    ],
    format: { format_name: "ogg" },
  };

  const r = planVideoStreamCopyFeasibility(probe);
  expect(r.kind).toBe("video-copy-safe");
  if (r.kind !== "video-copy-safe") {
    return;
  }

  expect(r.plannedContainer).toBe("matroska");
  expect(r.reasonCodes[0]).toBe("video-copy-theora-matroska-v1");
});

test("planVideoStreamCopyFeasibility vp8 emits explicit fallback token", () => {
  const probe: MediaProbe = {
    streams: [{ index: 0, codec_name: "vp8", codec_type: "video" }, ...baseAa],
    format: { format_name: "webm" },
  };

  const r = planVideoStreamCopyFeasibility(probe);
  expect(r.kind).toBe("fallback-required");
  if (r.kind !== "fallback-required") {
    return;
  }

  expect(r.reasonCodes).toContain("video-fallback-vp8-matrix-explicit-v1");
});

test("planVideoStreamCopyFeasibility multi-video falls back before codec matrix", () => {
  const probe: MediaProbe = {
    streams: [
      { index: 0, codec_name: "vp9", codec_type: "video" },
      { index: 1, codec_name: "vp9", codec_type: "video" },
      ...baseAa,
    ],
    format: { format_name: "webm" },
  };

  const r = planVideoStreamCopyFeasibility(probe);
  expect(r.kind).toBe("fallback-required");
  expect(r.reasonCodes).toContain("video-fallback-multi-video-streams");
});

test("canonicalVideoCodecForMatrix normalizes h265 alias", () => {
  expect(canonicalVideoCodecForMatrix("H265")).toBe("hevc");
});
