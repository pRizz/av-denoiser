import { expect, test } from "bun:test";

import {
  buildPreservationNotesFromPlan,
  MAX_PRESERVATION_NOTES,
  outputPlanToInspectSummary,
} from "../../src/domain/inspect-summary";
import type { OutputPlan } from "../../src/domain/output-plan";

test("MAX_PRESERVATION_NOTES is five", () => {
  expect(MAX_PRESERVATION_NOTES).toBe(5);
});

test("buildPreservationNotesFromPlan emits would require for fallback-required", () => {
  const plan: OutputPlan = {
    modality: "fallback-required",
    reasonCodes: ["video-fallback-non-h264-video"],
    resolvedInputPath: "/in.mkv",
    resolvedOutputPath: "/out.avdn.mp4",
    selectedAudioStreamIndex: 1,
    plannedAudioCodec: "aac",
    plannedContainer: "mp4",
  };

  const notes = buildPreservationNotesFromPlan(plan);
  expect(notes.some((n) => n.includes("would require"))).toBe(true);
});

test("buildPreservationNotesFromPlan emits Stream-copy for video-copy-safe", () => {
  const plan: OutputPlan = {
    modality: "video-copy-safe",
    reasonCodes: ["video-copy-h264-mp4-v1"],
    resolvedInputPath: "/in.mp4",
    resolvedOutputPath: "/out.avdn.mp4",
    selectedAudioStreamIndex: 1,
    plannedAudioCodec: "aac",
    plannedContainer: "mp4",
  };

  const notes = buildPreservationNotesFromPlan(plan);
  expect(notes.some((n) => n.includes("Stream-copy"))).toBe(true);
  expect(notes.some((n) => n.includes("HEVC"))).toBe(true);
});

test("buildPreservationNotesFromPlan emits WebM pairing phrasing for VP9 copy-safe", () => {
  const plan: OutputPlan = {
    modality: "video-copy-safe",
    reasonCodes: ["video-copy-vp9-webm-v1"],
    resolvedInputPath: "/in.webm",
    resolvedOutputPath: "/out.avdn.webm",
    selectedAudioStreamIndex: 1,
    plannedAudioCodec: "opus",
    plannedContainer: "webm",
  };

  const notes = buildPreservationNotesFromPlan(plan);
  expect(notes.some((n) => n.toLowerCase().includes("webm"))).toBe(true);
  expect(notes.some((n) => n.includes("Opus"))).toBe(true);
  expect(notes.some((n) => /hdr|transfer|metadata|side/i.test(n))).toBe(true);
});

test("buildPreservationNotesFromPlan emits Matroska Theora caveat with HDR or side-metadata phrasing", () => {
  const plan: OutputPlan = {
    modality: "video-copy-safe",
    reasonCodes: ["video-copy-theora-matroska-v1"],
    resolvedInputPath: "/in.ogv",
    resolvedOutputPath: "/out.avdn.mkv",
    selectedAudioStreamIndex: 1,
    plannedAudioCodec: "aac",
    plannedContainer: "matroska",
  };

  const notes = buildPreservationNotesFromPlan(plan);
  expect(notes.some((n) => /theora|stream-copy/i.test(n))).toBe(true);
  expect(
    notes.some((n) => /hdr|metadata|color|player|best-effort|side/i.test(n)),
  ).toBe(true);
});

test("buildPreservationNotesFromPlan emits audio-only phrasing", () => {
  const plan: OutputPlan = {
    modality: "audio-only",
    reasonCodes: ["phase-2-stub-audio-only"],
    resolvedInputPath: "/in.m4a",
    resolvedOutputPath: "/out.avdn.m4a",
    selectedAudioStreamIndex: 0,
    plannedAudioCodec: "aac",
    plannedContainer: "mp4",
  };

  const notes = buildPreservationNotesFromPlan(plan);
  expect(notes.some((n) => n.toLowerCase().includes("audio-only"))).toBe(true);
});

test("buildPreservationNotesFromPlan marks unsupported probes", () => {
  const plan: OutputPlan = {
    modality: "unsupported",
    reasonCodes: ["no-audio-stream"],
    resolvedInputPath: "/in.mp4",
    resolvedOutputPath: "/out.mp4",
  };

  const notes = buildPreservationNotesFromPlan(plan);
  expect(notes.some((n) => n.toLowerCase().includes("unsupported"))).toBe(true);
});

function mp4WhitelistPlan(code: string): OutputPlan {
  return {
    modality: "video-copy-safe",
    reasonCodes: [code],
    resolvedInputPath: "/in.mp4",
    resolvedOutputPath: "/out.avdn.mp4",
    selectedAudioStreamIndex: 1,
    plannedAudioCodec: "aac",
    plannedContainer: "mp4",
  };
}

test("outputPlanToInspectSummary MP4 whitelist reason codes are frozen literals", () => {
  const trios = [
    "video-copy-h264-mp4-v1",
    "video-copy-hevc-mp4-v1",
    "video-copy-av1-mp4-v1",
  ] as const;

  for (const code of trios) {
    const summary = outputPlanToInspectSummary(mp4WhitelistPlan(code));
    expect(summary.plannedContainer).toBe("mp4");
    expect(summary.reasonCodes.length).toBe(1);
    expect(summary.reasonCodes[0]).toBe(code);
    expect(
      summary.preservationNotes.some((n) => n.includes("Stream-copy")),
    ).toBe(true);
    expect(summary.preservationNotes.length).toBeGreaterThanOrEqual(2);
  }
});
