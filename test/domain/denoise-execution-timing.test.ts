import { describe, expect, test } from "bun:test";
import { createExecutionTimingTracker } from "../../src/domain/denoise-execution-timing";
import {
  denoiseProgressMilestoneProbeLabel,
  denoiseProgressMilestoneVerifyLabel,
} from "../../src/domain/denoise-progress";

describe("createExecutionTimingTracker", () => {
  test("records sequential milestones and finalize closes the last phase", () => {
    let clock = 0;
    const tracker = createExecutionTimingTracker({ now: () => clock });

    tracker.onEvent({ kind: "probe" });
    clock = 100;
    tracker.onEvent({
      kind: "step",
      stepIndex: 0,
      stepTotal: 2,
      label: "Step one",
    });
    clock = 400;
    tracker.onEvent({
      kind: "step",
      stepIndex: 1,
      stepTotal: 2,
      label: "Step two",
    });
    clock = 700;
    tracker.onEvent({ kind: "verify" });
    clock = 1200;

    const { entries } = tracker.finalize();

    expect(entries).toEqual([
      { label: denoiseProgressMilestoneProbeLabel, elapsedMs: 100 },
      { label: "Step one", elapsedMs: 300 },
      { label: "Step two", elapsedMs: 300 },
      { label: denoiseProgressMilestoneVerifyLabel, elapsedMs: 500 },
    ]);
  });

  test("ignores ffmpeg events without starting a phase", () => {
    let clock = 0;
    const tracker = createExecutionTimingTracker({ now: () => clock });

    tracker.onEvent({ kind: "probe" });
    clock = 50;
    tracker.onEvent({
      kind: "ffmpeg",
      percent: 10,
    });
    clock = 150;
    const { entries } = tracker.finalize();

    expect(entries).toEqual([
      { label: denoiseProgressMilestoneProbeLabel, elapsedMs: 150 },
    ]);
  });

  test("finalize is idempotent", () => {
    let clock = 0;
    const tracker = createExecutionTimingTracker({ now: () => clock });
    tracker.onEvent({ kind: "probe" });
    clock = 10;
    const first = tracker.finalize();
    const second = tracker.finalize();
    expect(first.entries).toEqual(second.entries);
  });
});
