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

test("parses inspect command into a typed request", () => {
  // Arrange
  const rawArgs = ["inspect", "clip.m4a", "--force", "--json"];

  // Act
  const request = parseCliRequest(rawArgs);

  // Assert
  expect(request).toEqual({
    kind: "inspect",
    inputPath: "clip.m4a",
    force: true,
    json: true,
  });
});

test("renders default guidance without promising unavailable pipelines", () => {
  // Arrange
  const expectedDoctorHint =
    'Run "av-denoiser doctor" to inspect local tool readiness.';
  const expectedInspectHint =
    'Run "av-denoiser inspect <path>" to probe media and preview planned outputs.';

  // Act
  const output = renderDefaultGuidance();

  // Assert
  expect(output).toContain(expectedDoctorHint);
  expect(output).toContain(expectedInspectHint);
  expect(output).toContain(
    "Heavy transcoding and denoise pipelines are not wired yet.",
  );
});
