import { expect, test } from "bun:test";

import {
  applyIntegrationsToLogicalSteps,
  DEFAULT_DENOISE_PRESET_ID,
  expandPreset,
  parseLadspaCliTriple,
  parsePresetId,
  presetRequiresDemucs,
  presetRequiresSox,
} from "../../src/domain/audio-pipeline-plan";

test("DEFAULT_DENOISE_PRESET_ID is speech-light", () => {
  expect(DEFAULT_DENOISE_PRESET_ID).toBe("speech-light");
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

test("parsePresetId accepts speech-vocals-demucs", () => {
  expect(parsePresetId("speech-vocals-demucs")).toBe("speech-vocals-demucs");
});

test("presetRequiresDemucs only for speech-vocals-demucs", () => {
  expect(presetRequiresDemucs("speech-light")).toBe(false);
  expect(presetRequiresDemucs("speech-vocals-demucs")).toBe(true);
});

test("expandPreset speech-vocals-demucs inserts demucs step and warnings", () => {
  const { steps, warnings } = expandPreset({
    presetId: "speech-vocals-demucs",
    knobs: { noiseStrength: 0.5 },
    plannedAudioCodec: "aac",
    plannedContainer: "mp4",
  });

  expect(steps.some((s) => s.tool === "demucs")).toBe(true);
  expect(warnings.some((w) => w.id === "warn-demucs-model-download")).toBe(
    true,
  );
  expect(warnings.some((w) => w.id === "warn-demucs-heavy-runtime")).toBe(true);
  expect(warnings.some((w) => w.id === "warn-demucs-resource")).toBe(true);
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

test("parseLadspaCliTriple accepts paired path+label and rejects partial flags", () => {
  expect(parseLadspaCliTriple({})).toBeNull();

  const partial = parseLadspaCliTriple({ pluginPath: "/opt/p.so" });

  expect(partial?.kind).toBe("error");

  const ok = parseLadspaCliTriple({
    pluginPath: "/opt/p.so",
    label: "amp",
    controls: "1|2",
  });

  expect(ok?.kind).toBe("ok");
  if (ok?.kind === "ok") {
    expect(ok.value.controls).toBe("1|2");
  }
});

test("applyIntegrationsToLogicalSteps orders ladspa ffmpeg before audacity before encode", () => {
  const { steps } = expandPreset({
    presetId: "speech-light",
    knobs: { noiseStrength: 0.2 },
    plannedAudioCodec: "aac",
    plannedContainer: "mp4",
  });

  const merged = applyIntegrationsToLogicalSteps(steps, {
    maybeLadspa: { pluginPath: "/p.so", label: "lbl", controls: "" },
    maybeAudacityMacro: "MyMacro",
    acceptAudacityPipeRisk: true,
  });

  expect(merged.kind).toBe("ok");
  if (merged.kind !== "ok") {
    return;
  }

  const encodeIdx = merged.steps.findIndex(
    (s) => s.tool === "ffmpeg" && s.step.kind === "encode-deliverable",
  );

  expect(encodeIdx).toBe(merged.steps.length - 1);
  expect(merged.steps[encodeIdx - 1]).toEqual({
    tool: "audacity",
    step: { kind: "macro", macroName: "MyMacro" },
  });
  expect(merged.steps[encodeIdx - 2]?.step.kind).toBe("ladspa-apply");
});

test("applyIntegrationsToLogicalSteps rejects audacity macro without risk flag", () => {
  const { steps } = expandPreset({
    presetId: "speech-light",
    knobs: { noiseStrength: 0.2 },
    plannedAudioCodec: "aac",
    plannedContainer: "mp4",
  });

  const merged = applyIntegrationsToLogicalSteps(steps, {
    maybeAudacityMacro: "X",
    acceptAudacityPipeRisk: false,
  });

  expect(merged.kind).toBe("error");
});
