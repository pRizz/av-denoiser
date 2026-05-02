import { describe, expect, test } from "bun:test";
import { argvTokensForEquivalentClean } from "../../src/domain/guided-clean-equivalent";
import type { GuidedCleanSelections } from "../../src/domain/guided-clean-selection";

describe("argvTokensForEquivalentClean", () => {
  test("minimal speech-light preset with defaults", () => {
    const s: GuidedCleanSelections = {
      inputPath: "./in.wav",
      force: false,
      dryRun: false,
      presetId: "speech-light",
      noiseStrength: 0.35,
      allowVideoFallback: false,
      acceptAudacityPipeRisk: false,
    };

    expect(argvTokensForEquivalentClean(s)).toEqual([
      "av-denoiser",
      "clean",
      "./in.wav",
      "--preset",
      "speech-light",
      "--noise-strength",
      "0.35",
    ]);
  });

  test("speech-soft-sox with force, fallback, explicit output", () => {
    const s: GuidedCleanSelections = {
      inputPath: "vid.mp4",
      maybeOutputPath: "out.mkv",
      force: true,
      dryRun: false,
      presetId: "speech-soft-sox",
      noiseStrength: 0.35,
      allowVideoFallback: true,
      acceptAudacityPipeRisk: false,
    };

    expect(argvTokensForEquivalentClean(s)).toEqual([
      "av-denoiser",
      "clean",
      "vid.mp4",
      "-o",
      "out.mkv",
      "--force",
      "--allow-video-fallback",
      "--preset",
      "speech-soft-sox",
      "--noise-strength",
      "0.35",
    ]);
  });

  test("quotes paths containing whitespace", () => {
    const s: GuidedCleanSelections = {
      inputPath: "./my in.wav",
      force: false,
      dryRun: false,
      presetId: "speech-light",
      noiseStrength: 0.35,
      allowVideoFallback: false,
      acceptAudacityPipeRisk: false,
    };

    expect(argvTokensForEquivalentClean(s)).toEqual([
      "av-denoiser",
      "clean",
      '"./my in.wav"',
      "--preset",
      "speech-light",
      "--noise-strength",
      "0.35",
    ]);
  });

  test("dry-run flag appears when requested", () => {
    const s: GuidedCleanSelections = {
      inputPath: "a.wav",
      force: false,
      dryRun: true,
      presetId: "speech-light",
      noiseStrength: 0.35,
      allowVideoFallback: false,
      acceptAudacityPipeRisk: false,
    };

    expect(argvTokensForEquivalentClean(s)).toContain("--dry-run");
  });

  test("speech-vocals-demucs with Audacity + LADSPA argv snapshot", () => {
    const s: GuidedCleanSelections = {
      inputPath: "./in.wav",
      force: false,
      dryRun: false,
      presetId: "speech-vocals-demucs",
      noiseStrength: 0.35,
      allowVideoFallback: false,
      acceptAudacityPipeRisk: true,
      maybeAudacityMacro: "noise-reduction",
      maybeLadspa: {
        pluginPath: "/tmp/plugin.so",
        label: "rnnoise",
        controls: "gain=-10",
      },
    };

    expect(argvTokensForEquivalentClean(s)).toEqual([
      "av-denoiser",
      "clean",
      "./in.wav",
      "--preset",
      "speech-vocals-demucs",
      "--noise-strength",
      "0.35",
      "--accept-audacity-pipe-risk",
      "--audacity-macro",
      "noise-reduction",
      "--ladspa-plugin-path",
      "/tmp/plugin.so",
      "--ladspa-label",
      "rnnoise",
      "--ladspa-controls",
      "gain=-10",
    ]);
  });
});
