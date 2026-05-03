import { expect, test } from "bun:test";

import type { MediaProbe } from "../../src/domain/media-probe";
import {
  implicitDefaultOutputExtWithDot,
  planMediaOutput,
  planMediaOutputPrelude,
} from "../../src/domain/output-plan";

function pathOk(input: string, output: string) {
  return {
    kind: "ok" as const,
    resolvedInputPath: input,
    resolvedOutputPath: output,
  };
}

test("implicitDefaultOutputExtWithDot maps video mp4 planned container to .mp4 for .mov paths", () => {
  expect(
    implicitDefaultOutputExtWithDot({
      modality: "video-copy-safe",
      plannedContainer: "mp4",
      resolvedInputPath: "/x/c.mov",
    }),
  ).toBe(".mp4");
});

test("implicitDefaultOutputExtWithDot maps planned matroska and webm literals", () => {
  expect(
    implicitDefaultOutputExtWithDot({
      modality: "fallback-required",
      plannedContainer: "matroska",
      resolvedInputPath: "/x/y.mov",
    }),
  ).toBe(".mkv");
  expect(
    implicitDefaultOutputExtWithDot({
      modality: "video-copy-safe",
      plannedContainer: "webm",
      resolvedInputPath: "/x/z.mp4",
    }),
  ).toBe(".webm");
});

test("implicitDefaultOutputExtWithDot audio-only mp4 preserves input extension", () => {
  expect(
    implicitDefaultOutputExtWithDot({
      modality: "audio-only",
      plannedContainer: "mp4",
      resolvedInputPath: "/no-extension",
    }),
  ).toBe(".m4a");
  expect(
    implicitDefaultOutputExtWithDot({
      modality: "audio-only",
      plannedContainer: "mp4",
      resolvedInputPath: "/pod/episode.m4a",
    }),
  ).toBe(".m4a");
  expect(
    implicitDefaultOutputExtWithDot({
      modality: "audio-only",
      plannedContainer: "mp4",
      resolvedInputPath: "/speech.wav",
    }),
  ).toBe(".wav");
});

test("planMediaOutputPrelude mirrors planMediaOutput unsupported kinds", () => {
  const probe: MediaProbe = { streams: [], format: {} };

  const pre = planMediaOutputPrelude(probe);

  expect(pre.kind).toBe("unsupported");
  const plan = planMediaOutput({
    probe,
    pathOutcome: {
      kind: "ok",
      resolvedInputPath: "/a",
      resolvedOutputPath: "/b",
    },
  });
  expect(plan.modality).toBe("unsupported");
});

test("planMediaOutput unsupported when no audio stream", () => {
  // Arrange
  const probe: MediaProbe = {
    streams: [
      {
        index: 0,
        codec_name: "h264",
        codec_type: "video",
      },
    ],
  };

  // Act
  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mp4", "/out.mp4"),
  });

  // Assert
  expect(plan.modality).toBe("unsupported");
  expect(plan.reasonCodes).toContain("no-audio-stream");
});

test("planMediaOutput audio-only when only audio streams", () => {
  // Arrange
  const probe: MediaProbe = {
    streams: [
      {
        index: 0,
        codec_name: "aac",
        codec_type: "audio",
        channels: 2,
      },
    ],
  };

  // Act
  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.m4a", "/in.avdn.m4a"),
  });

  // Assert
  expect(plan.modality).toBe("audio-only");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.reasonCodes).toContain("phase-2-stub-audio-only");
  expect(plan.selectedAudioStreamIndex).toBe(0);
  expect(plan.plannedAudioCodec).toBe("aac");
  expect(plan.plannedContainer).toBe("mp4");
});

test("planMediaOutput video-copy-safe when audio and video present", () => {
  // Arrange
  const probe: MediaProbe = {
    streams: [
      {
        index: 0,
        codec_name: "h264",
        codec_type: "video",
      },
      {
        index: 1,
        codec_name: "aac",
        codec_type: "audio",
      },
    ],
    format: {
      format_name: "mov,mp4,m4a,3gp,3g2,mj2",
    },
  };

  // Act
  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mp4", "/in.avdn.mp4"),
  });

  // Assert
  expect(plan.modality).toBe("video-copy-safe");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.reasonCodes).toContain("video-copy-h264-mp4-v1");
  expect(plan.plannedAudioCodec).toBe("aac");
  expect(plan.plannedContainer).toBe("mp4");
});

test("planMediaOutput fallback-required when two video streams", () => {
  const probe: MediaProbe = {
    streams: [
      { index: 0, codec_name: "h264", codec_type: "video" },
      { index: 1, codec_name: "h264", codec_type: "video" },
      { index: 2, codec_name: "aac", codec_type: "audio", channels: 2 },
    ],
    format: { format_name: "mov,mp4,m4a,3gp,3g2,mj2" },
  };

  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mp4", "/out.mp4"),
  });

  expect(plan.modality).toBe("fallback-required");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.reasonCodes).toContain("video-fallback-multi-video-streams");
});

test("planMediaOutput video-copy-safe when lone video codec is VP9 with format metadata", () => {
  const probe: MediaProbe = {
    streams: [
      { index: 0, codec_name: "vp9", codec_type: "video" },
      { index: 1, codec_name: "aac", codec_type: "audio", channels: 2 },
    ],
    format: { format_name: "webm" },
  };

  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.webm", "/out.avdn.webm"),
  });

  expect(plan.modality).toBe("video-copy-safe");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.reasonCodes).toContain("video-copy-vp9-webm-v1");
  expect(plan.plannedContainer).toBe("webm");
  expect(plan.plannedAudioCodec).toBe("opus");
});

test("planMediaOutput video-copy-safe when lone video codec is theora", () => {
  const probe: MediaProbe = {
    streams: [
      { index: 0, codec_name: "theora", codec_type: "video" },
      { index: 1, codec_name: "vorbis", codec_type: "audio", channels: 2 },
    ],
    format: { format_name: "ogg" },
  };

  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.ogv", "/out.avdn.mkv"),
  });

  expect(plan.modality).toBe("video-copy-safe");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.reasonCodes).toContain("video-copy-theora-matroska-v1");
  expect(plan.plannedContainer).toBe("matroska");
  expect(plan.plannedAudioCodec).toBe("aac");
});

test("planMediaOutput fallback-required when lone video codec is vp8", () => {
  const probe: MediaProbe = {
    streams: [
      { index: 0, codec_name: "vp8", codec_type: "video" },
      { index: 1, codec_name: "opus", codec_type: "audio", channels: 2 },
    ],
    format: { format_name: "webm" },
  };

  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.webm", "/out.avdn.mp4"),
  });

  expect(plan.modality).toBe("fallback-required");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.reasonCodes).toContain("video-fallback-vp8-matrix-explicit-v1");
});

test("planMediaOutput fallback-required when format_name missing", () => {
  const probe: MediaProbe = {
    streams: [
      { index: 0, codec_name: "h264", codec_type: "video" },
      { index: 1, codec_name: "aac", codec_type: "audio", channels: 2 },
    ],
    format: { duration: "10" },
  };

  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mp4", "/out.mp4"),
  });

  expect(plan.modality).toBe("fallback-required");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.reasonCodes).toContain("video-fallback-missing-format-metadata");
});

test("planMediaOutput prefers default audio disposition", () => {
  // Arrange
  const probe: MediaProbe = {
    streams: [
      {
        index: 0,
        codec_name: "aac",
        codec_type: "audio",
        channels: 1,
      },
      {
        index: 1,
        codec_name: "aac",
        codec_type: "audio",
        channels: 2,
        disposition: { default: 1 },
      },
    ],
  };

  // Act
  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mkv", "/out.mkv"),
  });

  // Assert
  expect(plan.modality).not.toBe("unsupported");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.selectedAudioStreamIndex).toBe(1);
});

test("planMediaOutput prefers lower-index default stream over higher channel count", () => {
  // Arrange — index 0 is marked default but has fewer channels than index 1
  const probe: MediaProbe = {
    streams: [
      {
        index: 0,
        codec_name: "aac",
        codec_type: "audio",
        channels: 1,
        disposition: { default: 1 },
      },
      {
        index: 1,
        codec_name: "aac",
        codec_type: "audio",
        channels: 6,
      },
    ],
  };

  // Act
  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mkv", "/out.mkv"),
  });

  // Assert
  expect(plan.modality).not.toBe("unsupported");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.selectedAudioStreamIndex).toBe(0);
});

test("planMediaOutput video-copy-safe for hevc plus aac and extra audio without codec_name", () => {
  const probe: MediaProbe = {
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
        disposition: { default: 1 },
      },
      {
        index: 2,
        codec_type: "audio",
        channels: 4,
        disposition: { default: 0 },
      },
      {
        index: 3,
        codec_type: "data",
        disposition: { default: 1 },
      },
    ],
    format: { format_name: "mov,mp4,m4a,3gp,3g2,mj2" },
  };

  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mov", "/out.mp4"),
  });

  expect(plan.modality).toBe("video-copy-safe");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.reasonCodes).toContain("video-copy-hevc-mp4-v1");
  expect(plan.selectedAudioStreamIndex).toBe(1);
});

test("planMediaOutput video-copy-safe when video codec is h265 alias", () => {
  const probe: MediaProbe = {
    streams: [
      {
        index: 0,
        codec_name: "h265",
        codec_type: "video",
      },
      {
        index: 1,
        codec_name: "aac",
        codec_type: "audio",
        channels: 2,
      },
    ],
    format: { format_name: "isoav,mov,mp4,m4a,3gp,3g2,mj2" },
  };

  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mp4", "/out.avdn.mp4"),
  });

  expect(plan.modality).toBe("video-copy-safe");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.reasonCodes).toContain("video-copy-hevc-mp4-v1");
});

test("planMediaOutput video-copy-safe for av1 plus aac when format metadata present", () => {
  const probe: MediaProbe = {
    streams: [
      { index: 0, codec_name: "av1", codec_type: "video" },
      { index: 1, codec_name: "aac", codec_type: "audio", channels: 2 },
    ],
    format: { format_name: "mov,mp4,m4a,3gp,3g2,mj2,webm" },
  };

  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mp4", "/out.avdn.mp4"),
  });

  expect(plan.modality).toBe("video-copy-safe");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.reasonCodes).toContain("video-copy-av1-mp4-v1");
});

test("planMediaOutput fallback-required when video stream lacks codec_name", () => {
  const probe: MediaProbe = {
    streams: [
      { index: 0, codec_type: "video", disposition: { default: 1 } },
      {
        index: 1,
        codec_name: "aac",
        codec_type: "audio",
        channels: 2,
      },
    ],
    format: { format_name: "mov,mp4,m4a,3gp,3g2,mj2" },
  };

  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mov", "/out.mp4"),
  });

  expect(plan.modality).toBe("fallback-required");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.reasonCodes).toContain("video-fallback-missing-video-codec-name");
  expect(plan.selectedAudioStreamIndex).toBe(1);
});

test("planMediaOutput prefers audio stream with codec_name when neither is default", () => {
  const probe: MediaProbe = {
    streams: [
      {
        index: 0,
        codec_type: "audio",
        channels: 6,
      },
      {
        index: 1,
        codec_name: "aac",
        codec_type: "audio",
        channels: 2,
      },
    ],
  };

  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mkv", "/out.mkv"),
  });

  expect(plan.modality).toBe("audio-only");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.selectedAudioStreamIndex).toBe(1);
});

test("planMediaOutput unsupported when every audio stream lacks codec_name", () => {
  const probe: MediaProbe = {
    streams: [
      { index: 0, codec_type: "audio", channels: 2 },
      { index: 1, codec_type: "audio", channels: 2 },
    ],
  };

  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.mov", "/out.m4a"),
  });

  expect(plan.modality).toBe("unsupported");
  expect(plan.reasonCodes).toContain("no-audio-codec-metadata");
});
