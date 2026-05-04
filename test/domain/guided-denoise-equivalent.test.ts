import { describe, expect, test } from "bun:test";
import { argvTokensForEquivalentDenoise } from "../../src/domain/guided-denoise-equivalent";
import type { GuidedDenoiseSelections } from "../../src/domain/guided-denoise-selection";

describe("argvTokensForEquivalentDenoise", () => {
  test("minimal speech-light preset with defaults", () => {
    const s: GuidedDenoiseSelections = {
      inputPath: "./in.wav",
      force: false,
      dryRun: false,
      presetId: "speech-light",
      noiseStrength: 0.35,
      allowVideoReencode: false,
      acceptAudacityPipeRisk: false,
    };

    expect(argvTokensForEquivalentDenoise(s)).toEqual([
      "av-denoiser",
      "denoise",
      "./in.wav",
      "--preset",
      "speech-light",
      "--noise-strength",
      "0.35",
    ]);
  });

  test("speech-soft-sox with force, fallback, explicit output", () => {
    const s: GuidedDenoiseSelections = {
      inputPath: "vid.mp4",
      maybeOutputPath: "out.mkv",
      force: true,
      dryRun: false,
      presetId: "speech-soft-sox",
      noiseStrength: 0.35,
      allowVideoReencode: true,
      acceptAudacityPipeRisk: false,
    };

    expect(argvTokensForEquivalentDenoise(s)).toEqual([
      "av-denoiser",
      "denoise",
      "vid.mp4",
      "-o",
      "out.mkv",
      "--force",
      "--allow-video-reencode",
      "--preset",
      "speech-soft-sox",
      "--noise-strength",
      "0.35",
    ]);
  });

  test("quotes paths containing whitespace", () => {
    const s: GuidedDenoiseSelections = {
      inputPath: "./my in.wav",
      force: false,
      dryRun: false,
      presetId: "speech-light",
      noiseStrength: 0.35,
      allowVideoReencode: false,
      acceptAudacityPipeRisk: false,
    };

    expect(argvTokensForEquivalentDenoise(s)).toEqual([
      "av-denoiser",
      "denoise",
      '"./my in.wav"',
      "--preset",
      "speech-light",
      "--noise-strength",
      "0.35",
    ]);
  });

  test("dry-run flag appears when requested", () => {
    const s: GuidedDenoiseSelections = {
      inputPath: "a.wav",
      force: false,
      dryRun: true,
      presetId: "speech-light",
      noiseStrength: 0.35,
      allowVideoReencode: false,
      acceptAudacityPipeRisk: false,
    };

    expect(argvTokensForEquivalentDenoise(s)).toContain("--dry-run");
  });

  test("speech-vocals-demucs with Audacity + LADSPA argv snapshot", () => {
    const s: GuidedDenoiseSelections = {
      inputPath: "./in.wav",
      force: false,
      dryRun: false,
      presetId: "speech-vocals-demucs",
      noiseStrength: 0.35,
      allowVideoReencode: false,
      acceptAudacityPipeRisk: true,
      maybeAudacityMacro: "noise-reduction",
      maybeLadspa: {
        pluginPath: "/tmp/plugin.so",
        label: "rnnoise",
        controls: "gain=-10",
      },
    };

    expect(argvTokensForEquivalentDenoise(s)).toEqual([
      "av-denoiser",
      "denoise",
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
