import { expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { type CleanRunInput, runCleanRequest } from "../../src/app/clean";

const toolsOnPath =
  Bun.which("ffmpeg") !== null && Bun.which("ffprobe") !== null;

const fixtureSpeechNoisyWav = join(
  import.meta.dir,
  "../fixtures/audio/speech-hush-with-brown-noise-cc0.wav",
);

function baseFixtureInput(overrides: Partial<CleanRunInput>): CleanRunInput {
  return {
    inputPath: fixtureSpeechNoisyWav,
    maybeOutputPath: undefined,
    force: false,
    dryRun: true,
    json: false,
    presetId: "speech-light",
    knobs: { noiseStrength: 0.35 },
    allowVideoFallback: false,
    acceptAudacityPipeRisk: false,
    ...overrides,
  };
}

test("bundled speech+noise fixture exists on disk", async () => {
  expect(await Bun.file(fixtureSpeechNoisyWav).exists()).toBe(true);

  const header = readFileSync(fixtureSpeechNoisyWav)
    .subarray(0, 4)
    .toString("utf8");
  expect(header).toBe("RIFF");
});

test.skipIf(!toolsOnPath)(
  "runCleanRequest speech-light dry-run succeeds for bundled noisy speech fixture",
  async () => {
    const cwd = join(tmpdir(), `avdn-fixture-cwd-${crypto.randomUUID()}`);
    mkdirSync(cwd, { recursive: true });

    try {
      const outcome = await runCleanRequest(
        baseFixtureInput({ dryRun: true, inputPath: fixtureSpeechNoisyWav }),
        { cwd },
      );

      expect(outcome.kind).toBe("success");
      if (outcome.kind !== "success" || outcome.clean === undefined) {
        return;
      }

      expect(outcome.clean.dryRun).toBe(true);
      expect(outcome.clean.summary.modality).toBe("audio-only");
      expect(outcome.clean.summary.presetId).toBe("speech-light");
      expect(outcome.clean.summary.steps.length).toBeGreaterThanOrEqual(3);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  },
);

test.skipIf(!toolsOnPath)(
  "runCleanRequest speech-light executes and verifies for bundled noisy speech fixture",
  async () => {
    const workDir = mkdtempSync(join(tmpdir(), "avdn-fixture-exec-"));
    const outputPath = join(workDir, `out-${crypto.randomUUID()}.m4a`);

    try {
      const outcome = await runCleanRequest(
        baseFixtureInput({
          dryRun: false,
          force: true,
          maybeOutputPath: outputPath,
          inputPath: fixtureSpeechNoisyWav,
        }),
        { cwd: workDir },
      );

      expect(outcome.kind).toBe("success");
      if (outcome.kind !== "success" || outcome.clean === undefined) {
        return;
      }

      expect(existsSync(outputPath)).toBe(true);
      expect(outcome.clean.maybeReportText).toContain("Video:");
      expect(outcome.clean.maybeReportText).toContain("Audio:");
      expect(outcome.clean.maybeReportText).toContain("Verified: yes");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  },
);
