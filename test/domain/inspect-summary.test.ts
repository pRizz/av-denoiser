import { expect, test } from "bun:test";

import {
  buildPreservationNotesFromPlan,
  MAX_PRESERVATION_NOTES,
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
