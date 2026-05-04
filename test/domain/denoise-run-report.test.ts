import { expect, test } from "bun:test";

import { renderDenoiseRunReportText } from "../../src/domain/denoise-run-report";

test("renderDenoiseRunReportText labels re-encoded video as HEVC libx265", () => {
  const text = renderDenoiseRunReportText({
    videoPolicy: "re-encoded",
    audioCodecSummary: "aac",
    droppedStreamsLabels: [],
    verificationOk: true,
  });

  const firstLine = text.trim().split("\n")[0];

  expect(firstLine).toBe("Video: re-encoded (HEVC, libx265)");
});
