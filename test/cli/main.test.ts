import { expect, test } from "bun:test";

import { parseCliRequest } from "../../src/cli/main";
import { renderDefaultGuidance } from "../../src/cli/render";

test("parses doctor command into a typed request", () => {
  // Arrange
  const rawArgs = ["doctor"];

  // Act
  const request = parseCliRequest(rawArgs);

  // Assert
  expect(request).toEqual({ kind: "doctor" });
});

test("renders default guidance without media processing claims", () => {
  // Arrange
  const expectedDoctorHint =
    'Run "av-denoiser doctor" to inspect local tool readiness.';

  // Act
  const output = renderDefaultGuidance();

  // Assert
  expect(output).toContain(expectedDoctorHint);
  expect(output).toContain(
    "Media processing commands are not available in this phase.",
  );
});
