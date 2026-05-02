import { describe, expect, test } from "bun:test";

import {
  formatBrewInstallDryRunLines,
  manualPostBrewHints,
  planBrewInstallSteps,
} from "../../src/domain/install-tools-brew";

describe("planBrewInstallSteps", () => {
  test("ffmpeg-only tier is a single brew install step", () => {
    const steps = planBrewInstallSteps(false);

    expect(steps).toHaveLength(1);
    expect(steps[0]?.argv).toEqual(["brew", "install", "ffmpeg", "uv"]);
  });

  test("full tier adds ffmpeg+sox_ng+uv, audacity cask (no mlt: brew mlt conflicts with sox_ng)", () => {
    const steps = planBrewInstallSteps(true);

    expect(steps).toHaveLength(2);
    expect(steps[0]?.argv).toEqual([
      "brew",
      "install",
      "ffmpeg",
      "sox_ng",
      "uv",
    ]);
    expect(steps[1]?.argv).toEqual(["brew", "install", "--cask", "audacity"]);
  });
});

test("formatBrewInstallDryRunLines joins brew invocations", () => {
  const lines = formatBrewInstallDryRunLines(planBrewInstallSteps(false));

  expect(lines).toBe("brew install ffmpeg uv");
});

test("manualPostBrewHints empty when disabled", () => {
  expect(manualPostBrewHints(false)).toBe("");
});

test("manualPostBrewHints includes demucs uv tool when enabled", () => {
  expect(manualPostBrewHints(true)).toContain("uv tool install");
  expect(manualPostBrewHints(true)).toContain("demucs");
});
