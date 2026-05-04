import { describe, expect, mock, test } from "bun:test";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runBatchRequest } from "../../src/app/batch";
import type { CliRequest } from "../../src/domain/cli-request";
import { ExitCode } from "../../src/domain/exit-codes";

const minimalAudioFixture = await Bun.file(
  `${import.meta.dir}/../fixtures/ffprobe/minimal-audio.json`,
).text();

function batchDenoiseDepsForAudioWav(dir: string) {
  return {
    cwd: dir,
    outputExists: (p: string) => existsSync(p),
    maybeWhich: (name: string) => (name === "ffprobe" ? "/bin/ffprobe" : null),
    runProcess: async () => ({
      kind: "exited" as const,
      exitCode: 0,
      stdout: minimalAudioFixture,
      stderr: "",
    }),
  };
}

describe("runBatchRequest", () => {
  test("writes manifest with mocked denoise success", async () => {
    const dir = mkdtempSync(join(tmpdir(), "avdn-batch-"));
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
      allowVideoReencode: false,
      acceptAudacityPipeRisk: false,
    };

    const runDenoise = mock(
      async (): Promise<import("../../src/app/denoise").DenoiseCliOutcome> => ({
        kind: "success",
        denoise: {
          json: false,
          dryRun: true,
          summary: {
            presetId: "speech-light",
            inputPath,
            outputPath: join(dir, `in.avdn.wav`),
            modality: "audio-only",
            plannedContainer: "mp4",
            plannedAudioCodec: "aac",
            reasonCodes: [],
            pipelineWarnings: [],
            steps: [{ tool: "ffmpeg", displayCommand: "ffmpeg (stub)" }],
          },
        },
      }),
    );

    const outcome = await runBatchRequest(request, {
      denoise: batchDenoiseDepsForAudioWav(dir),
      batch: { runDenoise },
    });

    expect(outcome.kind).toBe("success");
    if (outcome.kind !== "success") {
      throw new Error("expected success");
    }

    expect(outcome.batch?.document.items.length).toBe(1);
    const raw = readFileSync(manifestPath, "utf8");
    expect(raw).toContain('"schemaVersion": 1');

    rmSync(dir, { recursive: true });
  });

  test("fail-fast stops before third runDenoise call", async () => {
    const dir = mkdtempSync(join(tmpdir(), "avdn-batch-ff-"));
    const manifestPath = join(dir, "manifest.json");

    for (const name of ["a.wav", "b.wav", "c.wav"]) {
      writeFileSync(join(dir, name), "");
    }

    const request: CliRequest = {
      kind: "batch",
      inputPaths: [join(dir, "a.wav"), join(dir, "b.wav"), join(dir, "c.wav")],
      globs: [],
      acceptGlobRisk: false,
      maybeManifestPath: manifestPath,
      concurrency: 4,
      failFast: true,
      force: true,
      dryRun: true,
      json: false,
      presetId: "speech-light",
      knobs: { noiseStrength: 0.35 },
      allowVideoReencode: false,
      acceptAudacityPipeRisk: false,
    };

    let call = 0;

    const runDenoise = mock(
      async (): Promise<import("../../src/app/denoise").DenoiseCliOutcome> => {
        call += 1;

        if (call === 2) {
          return {
            kind: "failure",
            reason: {
              kind: "processing-failure",
              message: "boom",
            },
          };
        }

        return {
          kind: "success",
          denoise: {
            json: false,
            dryRun: true,
            summary: {
              presetId: "speech-light",
              inputPath: "",
              outputPath: "",
              modality: "audio-only",
              plannedContainer: "mp4",
              plannedAudioCodec: "aac",
              reasonCodes: [],
              pipelineWarnings: [],
              steps: [{ tool: "ffmpeg", displayCommand: "ffmpeg (stub)" }],
            },
          },
        };
      },
    );

    const outcome = await runBatchRequest(request, {
      denoise: batchDenoiseDepsForAudioWav(dir),
      batch: { runDenoise },
    });

    expect(outcome.kind).toBe("success");
    if (outcome.kind !== "success") {
      throw new Error("expected success");
    }

    expect(runDenoise.mock.calls.length).toBe(2);
    expect(outcome.batch?.worstExitCode).toBe(ExitCode.processingFailure);
    expect(outcome.batch?.document.items[2]?.outcome).toBe("skipped");

    rmSync(dir, { recursive: true });
  });
});
