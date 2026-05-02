import { expect, test } from "bun:test";

import {
  DEFAULT_CLEAN_PRESET_ID,
  expandPreset,
  parsePresetId,
  presetRequiresSox,
} from "../../src/domain/audio-pipeline-plan";

test("DEFAULT_CLEAN_PRESET_ID is speech-light", () => {
  expect(DEFAULT_CLEAN_PRESET_ID).toBe("speech-light");
});

test("presetRequiresSox matches preset ids", () => {
  expect(presetRequiresSox("speech-light")).toBe(false);
  expect(presetRequiresSox("speech-soft-sox")).toBe(true);
});

test("parsePresetId accepts known ids only", () => {
  expect(parsePresetId("speech-light")).toBe("speech-light");
  expect(parsePresetId("speech-soft-sox")).toBe("speech-soft-sox");
  expect(parsePresetId("unknown")).toBeNull();
});

test("expandPreset speech-light: three ffmpeg steps ending in encode aac/mp4", () => {
  const { steps, warnings } = expandPreset({
    presetId: "speech-light",
    knobs: { noiseStrength: 0.5 },
    plannedAudioCodec: "aac",
    plannedContainer: "mp4",
  });

  expect(steps.length).toBe(3);
  expect(steps[0]?.tool).toBe("ffmpeg");
  expect(steps[0]?.step.kind).toBe("extract-pcm-wav");
  expect(steps[1]?.tool).toBe("ffmpeg");
  expect(steps[1]?.step.kind).toBe("afftdn");
  expect(steps[2]?.tool).toBe("ffmpeg");
  expect(steps[2]?.step).toEqual({
    kind: "encode-deliverable",
    audioCodec: "aac",
    container: "mp4",
  });

  expect(warnings.some((w) => w.id === "warn-heavy-cpu-ffmpeg-afftdn")).toBe(
    true,
  );
});

test("expandPreset speech-soft-sox inserts SoX step and extra warning id", () => {
  const { steps, warnings } = expandPreset({
    presetId: "speech-soft-sox",
    knobs: { noiseStrength: 0.25 },
    plannedAudioCodec: "aac",
    plannedContainer: "mp4",
  });

  expect(steps.length).toBe(4);
  expect(steps[2]).toEqual({
    tool: "sox",
    step: { kind: "gentle-dynamics" },
  });

  expect(warnings.some((w) => w.id === "warn-heavy-cpu-ffmpeg-afftdn")).toBe(
    true,
  );
  expect(warnings.some((w) => w.id === "warn-sox-dynamics-artifact-risk")).toBe(
    true,
  );
});

test("noiseStrength beyond 1 clamps to 1 on afftdn step", () => {
  const { steps } = expandPreset({
    presetId: "speech-light",
    knobs: { noiseStrength: 1.5 },
    plannedAudioCodec: "aac",
    plannedContainer: "mp4",
  });

  const afftdn = steps[1]?.step;
  expect(afftdn?.kind).toBe("afftdn");
  if (afftdn?.kind !== "afftdn") {
    return;
  }

  expect(afftdn.noiseStrength).toBe(1);
});
