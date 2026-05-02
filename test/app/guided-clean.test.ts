import { describe, expect, mock, test } from "bun:test";
import { runGuidedCleanRequest } from "../../src/app/guided-clean";
import { renderCommandOutcome } from "../../src/cli/render";
import type { CliRequest } from "../../src/domain/cli-request";
import type { GuidedCleanSelections } from "../../src/domain/guided-clean-selection";

describe("runGuidedCleanRequest", () => {
  test("fails fast when stdin is not a TTY", async () => {
    const outcome = await runGuidedCleanRequest({ isTTY: false });

    expect(outcome.kind).toBe("failure");

    if (outcome.kind === "failure") {
      expect(outcome.reason.kind).toBe("planning-failure");

      if (outcome.reason.kind === "planning-failure") {
        expect(outcome.reason.message).toContain("TTY");
      }
    }
  });

  test("runs dry-run preview then execute when confirmed", async () => {
    const canned: GuidedCleanSelections = {
      inputPath: "in.wav",
      force: false,
      dryRun: false,
      presetId: "speech-light",
      noiseStrength: 0.35,
      allowVideoFallback: false,
    };

    const calls: { dryRun: boolean }[] = [];

    const runClean = mock(
      async (
        input: import("../../src/app/clean").CleanRunInput,
      ): Promise<import("../../src/app/clean").CleanCliOutcome> => {
        calls.push({ dryRun: input.dryRun });

        return {
          kind: "success",
          clean: {
            json: false,
            dryRun: input.dryRun,
            summary: {
              presetId: input.presetId,
              inputPath: input.inputPath,
              outputPath: "/tmp/out.wav",
              modality: "audio-only",
              pipelineWarnings: [],
              steps: [
                { tool: "ffmpeg", displayCommand: "ffmpeg -version (stub)" },
              ],
            },
          },
        };
      },
    );

    const outcome = await runGuidedCleanRequest({
      isTTY: true,
      collectSelections: async () => canned,
      askRunClean: async () => true,
      runClean,
    });

    expect(calls.length).toBe(2);
    expect(calls[0]?.dryRun).toBe(true);
    expect(calls[1]?.dryRun).toBe(false);
    expect(outcome.kind).toBe("success");

    if (outcome.kind === "success") {
      expect(outcome.guidedHumanSummary).toContain("Equivalent command:");
    }

    const guidedRequest: CliRequest = { kind: "guided-clean" };

    const rendered = renderCommandOutcome(guidedRequest, outcome, "");

    expect(rendered).toContain("Equivalent command:");
  });
});
