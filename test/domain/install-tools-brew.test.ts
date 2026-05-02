import { describe, expect, test } from "bun:test";

import {
  formatBrewInstallDryRunLines,
  manualPostBrewHints,
  planBrewInstallSteps,
} from "../../src/domain/install-tools-brew";

describe("planBrewInstallSteps", () => {
  test("default installs ffmpeg only", () => {
    const steps = planBrewInstallSteps(false);

    expect(steps).toHaveLength(1);
    expect(steps[0]?.argv).toEqual(["brew", "install", "ffmpeg"]);
  });

  test("with optional adds formulae, cask, and demucs hint source", () => {
    const steps = planBrewInstallSteps(true);

    expect(steps).toHaveLength(2);
    expect(steps[0]?.argv).toEqual([
      "brew",
      "install",
      "ffmpeg",
      "sox_ng",
      "mlt",
    ]);
    expect(steps[1]?.argv).toEqual(["brew", "install", "--cask", "audacity"]);
  });
});

test("formatBrewInstallDryRunLines joins brew invocations", () => {
  const lines = formatBrewInstallDryRunLines(planBrewInstallSteps(false));

  expect(lines).toBe("brew install ffmpeg");
});

test("manualPostBrewHints empty when disabled", () => {
  expect(manualPostBrewHints(false)).toBe("");
});

test("manualPostBrewHints includes demucs pip when enabled", () => {
  expect(manualPostBrewHints(true)).toContain("pip install");
  expect(manualPostBrewHints(true)).toContain("demucs");
});
