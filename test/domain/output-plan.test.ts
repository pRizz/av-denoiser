import { expect, test } from "bun:test";

import type { MediaProbe } from "../../src/domain/media-probe";
import { planMediaOutput } from "../../src/domain/output-plan";

function pathOk(input: string, output: string) {
  return {
    kind: "ok" as const,
    resolvedInputPath: input,
    resolvedOutputPath: output,
  };
}

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

  expect(plan.reasonCodes).toContain("phase-2-stub-video-copy-safe");
  expect(plan.plannedAudioCodec).toBe("aac");
  expect(plan.plannedContainer).toBe("mp4");
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
