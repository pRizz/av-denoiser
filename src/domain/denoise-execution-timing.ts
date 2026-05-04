import type { DenoiseProgressEvent } from "./denoise-progress";
import {
  denoiseProgressMilestoneProbeLabel,
  denoiseProgressMilestoneVerifyLabel,
} from "./denoise-progress";

export type DenoiseExecutionTimingEntry = {
  readonly label: string;
  readonly elapsedMs: number;
};

export type DenoiseExecutionTiming = {
  readonly entries: readonly DenoiseExecutionTimingEntry[];
  readonly totalMs: number;
};

export type ExecutionTimingTracker = {
  readonly onEvent: (event: DenoiseProgressEvent) => void;
  /** Close the open phase and return entries (no totalMs). Idempotent after first finalize. */
  readonly finalize: () => { readonly entries: DenoiseExecutionTimingEntry[] };
};

/**
 * Tracks wall durations between progress milestones (probe / steps / verify).
 * FFmpeg ticks do not advance milestones.
 */
export function createExecutionTimingTracker(options?: {
  readonly now?: () => number;
}): ExecutionTimingTracker {
  const now = options?.now ?? (() => performance.now());
  const entries: DenoiseExecutionTimingEntry[] = [];
  let maybeOpenLabel: string | null = null;
  let openStartedAt = 0;
  let finalized = false;

  const transitionTo = (label: string) => {
    if (maybeOpenLabel !== null) {
      entries.push({
        label: maybeOpenLabel,
        elapsedMs: Math.round(now() - openStartedAt),
      });
    }

    maybeOpenLabel = label;
    openStartedAt = now();
  };

  const onEvent = (event: DenoiseProgressEvent) => {
    if (finalized) {
      return;
    }

    if (event.kind === "probe") {
      transitionTo(denoiseProgressMilestoneProbeLabel);
      return;
    }

    if (event.kind === "step") {
      transitionTo(event.label);
      return;
    }

    if (event.kind === "verify") {
      transitionTo(denoiseProgressMilestoneVerifyLabel);
    }
  };

  const finalize = () => {
    if (finalized) {
      return { entries: [...entries] };
    }

    finalized = true;

    if (maybeOpenLabel !== null) {
      entries.push({
        label: maybeOpenLabel,
        elapsedMs: Math.round(now() - openStartedAt),
      });
      maybeOpenLabel = null;
    }

    return { entries: [...entries] };
  };

  return { onEvent, finalize };
}
