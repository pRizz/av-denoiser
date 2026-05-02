import { describe, expect, mock, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { CleanCliOutcome } from "../../src/app/clean";
import { runCliRequest } from "../../src/app/run-command";
import type { CliRequest } from "../../src/domain/cli-request";

describe("runCliRequest batch discoverTools wiring", () => {
  test("persists stub DoctorReport into manifest.maybeDoctorFacts", async () => {
    const dir = mkdtempSync(join(tmpdir(), "avdn-runcli-batch-"));
    const manifestPath = join(dir, "manifest.json");
    const inputPath = join(dir, "in.wav");
    writeFileSync(inputPath, "");

    const stubReport = { tools: [] as const };

    const request: CliRequest = {
      kind: "batch",
      inputPaths: [inputPath],
      globs: [],
      acceptGlobRisk: false,
      maybeManifestPath: manifestPath,
      concurrency: 1,
      failFast: false,
      force: true,
      dryRun: true,
      json: false,
      presetId: "speech-light",
      knobs: { noiseStrength: 0.35 },
      allowVideoFallback: false,
      acceptAudacityPipeRisk: false,
    };

    const runClean = mock(
      async (): Promise<CleanCliOutcome> => ({
        kind: "success",
        clean: {
          json: false,
          dryRun: true,
          summary: {
            presetId: "speech-light",
            inputPath,
            outputPath: join(dir, `in.avdn.wav`),
            modality: "audio-only",
            pipelineWarnings: [],
            steps: [{ tool: "ffmpeg", displayCommand: "ffmpeg (stub)" }],
          },
        },
      }),
    );

    const outcome = await runCliRequest(request, {
      discoverTools: async () => stubReport,
      batch: { runClean },
      clean: { cwd: dir, outputExists: () => false },
    });

    expect(outcome.kind).toBe("success");
    if (outcome.kind !== "success") {
      throw new Error("expected success");
    }

    expect(outcome.batch?.document.maybeDoctorFacts).toEqual(stubReport);
    expect(runClean.mock.calls.length).toBe(1);

    rmSync(dir, { recursive: true });
  });

  test("returns failure before manifest write when discoverTools throws", async () => {
    const dir = mkdtempSync(join(tmpdir(), "avdn-runcli-batch-disc-"));
    const manifestPath = join(dir, "manifest.json");
    const inputPath = join(dir, "in.wav");
    writeFileSync(inputPath, "");

    const request: CliRequest = {
      kind: "batch",
      inputPaths: [inputPath],
      globs: [],
      acceptGlobRisk: false,
      maybeManifestPath: manifestPath,
      concurrency: 1,
      failFast: false,
      force: true,
      dryRun: true,
      json: false,
      presetId: "speech-light",
      knobs: { noiseStrength: 0.35 },
      allowVideoFallback: false,
      acceptAudacityPipeRisk: false,
    };

    const outcome = await runCliRequest(request, {
      discoverTools: async () => {
        throw new Error("discovery boom");
      },
      batch: {
        runClean: mock(
          async (): Promise<CleanCliOutcome> => ({
            kind: "success",
            clean: {
              json: false,
              dryRun: true,
              summary: {
                presetId: "speech-light",
                inputPath,
                outputPath: join(dir, `in.avdn.wav`),
                modality: "audio-only",
                pipelineWarnings: [],
                steps: [{ tool: "ffmpeg", displayCommand: "ffmpeg (stub)" }],
              },
            },
          }),
        ),
      },
      clean: { cwd: dir, outputExists: () => false },
    });

    expect(outcome.kind).toBe("failure");
    if (outcome.kind !== "failure") {
      throw new Error("expected failure");
    }

    expect(outcome.reason.kind).toBe("invalid-input");
    if (outcome.reason.kind !== "invalid-input") {
      throw new Error("expected invalid-input");
    }

    expect(outcome.reason.message).toContain("discovery boom");
    expect(existsSync(manifestPath)).toBe(false);

    rmSync(dir, { recursive: true });
  });
});
