import { expect, test } from "bun:test";

import { renderCleanRunReportText } from "../../src/domain/clean-run-report";

test("renderCleanRunReportText labels re-encoded video as HEVC libx265", () => {
  const text = renderCleanRunReportText({
    videoPolicy: "re-encoded",
    audioCodecSummary: "aac",
    droppedStreamsLabels: [],
    verificationOk: true,
  });

  const firstLine = text.trim().split("\n")[0];

  expect(firstLine).toBe("Video: re-encoded (HEVC, libx265)");
});
