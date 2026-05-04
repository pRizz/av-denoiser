import { describe, expect, mock, test } from "bun:test";
import { runGuidedDenoiseRequest } from "../../src/app/guided-denoise";
import { renderCommandOutcome } from "../../src/cli/render";
import type { CliRequest } from "../../src/domain/cli-request";
import type { GuidedDenoiseSelections } from "../../src/domain/guided-denoise-selection";

describe("runGuidedDenoiseRequest", () => {
  test("fails fast when stdin is not a TTY", async () => {
    const outcome = await runGuidedDenoiseRequest({ isTTY: false });

    expect(outcome.kind).toBe("failure");

    if (outcome.kind === "failure") {
      expect(outcome.reason.kind).toBe("planning-failure");

      if (outcome.reason.kind === "planning-failure") {
        expect(outcome.reason.message).toContain("TTY");
      }
    }
  });

  test("runs dry-run preview then execute when confirmed", async () => {
    const canned: GuidedDenoiseSelections = {
      inputPath: "in.wav",
      force: false,
      dryRun: false,
      presetId: "speech-light",
      noiseStrength: 0.35,
      allowVideoReencode: false,
      acceptAudacityPipeRisk: false,
    };

    const calls: { dryRun: boolean }[] = [];

    const runDenoise = mock(
      async (
        input: import("../../src/app/denoise").DenoiseRunInput,
      ): Promise<import("../../src/app/denoise").DenoiseCliOutcome> => {
        calls.push({ dryRun: input.dryRun });

        return {
          kind: "success",
          denoise: {
            json: false,
            dryRun: input.dryRun,
            summary: {
              presetId: input.presetId,
              inputPath: input.inputPath,
              outputPath: "/tmp/out.wav",
              modality: "audio-only",
              plannedContainer: "mp4",
              plannedAudioCodec: "aac",
              reasonCodes: [],
              pipelineWarnings: [],
              steps: [
                { tool: "ffmpeg", displayCommand: "ffmpeg -version (stub)" },
              ],
            },
          },
        };
      },
    );

    const outcome = await runGuidedDenoiseRequest({
      isTTY: true,
      collectSelections: async () => canned,
      askRunDenoise: async () => true,
      runDenoise,
    });

    expect(calls.length).toBe(2);
    expect(calls[0]?.dryRun).toBe(true);
    expect(calls[1]?.dryRun).toBe(false);
    expect(outcome.kind).toBe("success");

    if (outcome.kind === "success") {
      expect(outcome.guidedHumanSummary).toContain("Equivalent command:");
    }

    const guidedRequest: CliRequest = { kind: "guided-denoise" };

    const rendered = renderCommandOutcome(guidedRequest, outcome, "");

    expect(rendered).toContain("Equivalent command:");
  });
});
