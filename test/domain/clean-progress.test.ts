import { describe, expect, test } from "bun:test";
import { runProcessCommand } from "../../src/adapters/process-runner";
import {
  cleanProgressEventToJson,
  formatProgressForSpinner,
  labelForLogicalStep,
  parseFfmpegStatusLine,
  probeDurationSeconds,
  videoExtractStepLabel,
  videoRemuxStepLabel,
} from "../../src/domain/clean-progress";

describe("parseFfmpegStatusLine", () => {
  test("parses time and speed from typical ffmpeg status", () => {
    const line =
      "frame=  123 fps= 30 q=-1.0 size=     512kB time=00:00:05.12 bitrate= 819.2kbits/s speed=1.05x";

    expect(parseFfmpegStatusLine(line)).toEqual({
      timeSec: 5.12,
      speed: "1.05x",
    });
  });

  test("returns null when time is absent", () => {
    expect(parseFfmpegStatusLine("foo=bar")).toBeNull();
  });

  test("parses hour-length timestamps", () => {
    const line = "time=01:02:03.45 speed=2x";

    expect(parseFfmpegStatusLine(line)).toEqual({
      timeSec: 3723.45,
      speed: "2x",
    });
  });
});

describe("probeDurationSeconds", () => {
  test("reads format.duration", () => {
    expect(
      probeDurationSeconds({
        streams: [],
        format: { duration: "12.5" },
      }),
    ).toBe(12.5);
  });

  test("returns undefined when missing or invalid", () => {
    expect(probeDurationSeconds({ streams: [] })).toBeUndefined();
    expect(
      probeDurationSeconds({
        streams: [],
        format: { duration: "nope" },
      }),
    ).toBeUndefined();
  });
});

describe("formatProgressForSpinner", () => {
  test("includes batch prefix", () => {
    const msg = formatProgressForSpinner({
      kind: "step",
      stepIndex: 0,
      stepTotal: 3,
      label: "Encode audio (aac)",
      batch: { index: 2, total: 5 },
    });

    expect(msg).toContain("[2/5]");
    expect(msg).toContain("1/3");
    expect(msg).toContain("aac");
  });

  test("ffmpeg kind shows percent when present", () => {
    const msg = formatProgressForSpinner({
      kind: "ffmpeg",
      percent: 42,
      speed: "1.2x",
    });

    expect(msg).toContain("42%");
    expect(msg).toContain("1.2x");
  });
});

describe("cleanProgressEventToJson", () => {
  test("flattens batch into batchIndex fields", () => {
    const j = cleanProgressEventToJson({
      kind: "probe",
      batch: { index: 1, total: 4 },
    });

    expect(j).toEqual({
      kind: "probe",
      batchIndex: 1,
      batchTotal: 4,
    });
  });
});

describe("labels", () => {
  test("labelForLogicalStep covers ffmpeg extract", () => {
    expect(
      labelForLogicalStep({
        tool: "ffmpeg",
        step: { kind: "extract-pcm-wav", interchange: "wav-pcm-s16le" },
      }),
    ).toContain("WAV");
  });

  test("video helper labels", () => {
    expect(videoExtractStepLabel()).toContain("Extract");
    expect(videoRemuxStepLabel("copy")).toContain("copy");
    expect(videoRemuxStepLabel("reencode-hevc")).toContain("HEVC");
  });
});

describe("runProcessCommand onStderrLine", () => {
  test("streams stderr lines while capturing full stderr", async () => {
    const lines: string[] = [];
    const result = await runProcessCommand({
      executable: process.execPath,
      args: ["-e", 'process.stderr.write("a\\nb\\n"); process.exit(0);'],
      onStderrLine: (line) => {
        lines.push(line);
      },
    });

    expect(result.kind).toBe("exited");
    if (result.kind !== "exited") {
      return;
    }

    expect(result.exitCode).toBe(0);
    expect(lines).toEqual(["a", "b"]);
    expect(result.stderr.trim().split("\n")).toEqual(["a", "b"]);
  });
});
