import type { LogicalPipelineStep } from "./audio-pipeline-plan";
import type { MediaProbe } from "./media-probe";

/** Batch job position included on progress events when `runDenoiseRequest` is invoked from batch. */
export type DenoiseProgressBatch = {
  readonly index: number;
  readonly total: number;
};

export type DenoiseProgressEvent =
  | { readonly kind: "probe"; readonly batch?: DenoiseProgressBatch }
  | { readonly kind: "verify"; readonly batch?: DenoiseProgressBatch }
  | {
      readonly kind: "step";
      readonly stepIndex: number;
      readonly stepTotal: number;
      readonly label: string;
      /** Wall time for the immediately prior step, when known (ms). */
      readonly previousStepElapsedMs?: number;
      readonly batch?: DenoiseProgressBatch;
    }
  | {
      readonly kind: "ffmpeg";
      readonly timeSec?: number;
      readonly durationSec?: number;
      readonly speed?: string;
      readonly percent?: number;
      readonly batch?: DenoiseProgressBatch;
    };

/** Parses `time=HH:MM:SS.xx` and `speed=Nx` from a typical FFmpeg status line. */
export function parseFfmpegStatusLine(
  line: string,
): { readonly timeSec?: number; readonly speed?: string } | null {
  const timeMatch = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(line);

  if (timeMatch === null) {
    return null;
  }

  const h = Number.parseInt(timeMatch[1] ?? "0", 10);
  const m = Number.parseInt(timeMatch[2] ?? "0", 10);
  const s = Number.parseFloat(timeMatch[3] ?? "0");

  if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) {
    return null;
  }

  const timeSec = h * 3600 + m * 60 + s;
  const speedMatch = /speed=\s*([^\s]+)/.exec(line);
  let speed: string | undefined;

  if (speedMatch !== null) {
    const raw = (speedMatch[1] ?? "").trim();

    speed = raw.length > 0 ? raw : undefined;
  }

  return { timeSec, speed };
}

/** Best-effort input duration in seconds from ffprobe JSON. */
export function probeDurationSeconds(probe: MediaProbe): number | undefined {
  const raw = probe.format?.duration;

  if (raw === undefined || raw === "") {
    return undefined;
  }

  const n = Number.parseFloat(raw);

  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function labelForLogicalStep(step: LogicalPipelineStep): string {
  if (step.tool === "ffmpeg") {
    switch (step.step.kind) {
      case "extract-pcm-wav":
        return "Extract PCM (WAV)";
      case "afftdn":
        return "Denoise (afftdn)";
      case "ladspa-apply":
        return `LADSPA (${step.step.label})`;
      case "encode-deliverable":
        return `Encode audio (${step.step.audioCodec})`;
      default:
        return "FFmpeg";
    }
  }

  if (step.tool === "sox") {
    return "SoX dynamics";
  }

  if (step.tool === "demucs") {
    return `Demucs (${step.step.model})`;
  }

  if (step.tool === "audacity") {
    return `Audacity macro:${step.step.macroName}`;
  }

  return "Pipeline step";
}

export function videoExtractStepLabel(): string {
  return "Extract primary audio (WAV)";
}

export function videoRemuxStepLabel(mode: "copy" | "reencode-hevc"): string {
  if (mode === "copy") {
    return "Remux (copy video)";
  }

  return "Remux + encode video (HEVC)";
}

/** Matches spinner / execution-timing milestone for `kind: "probe"`. */
export const denoiseProgressMilestoneProbeLabel = "Probing…";

/** Matches spinner / execution-timing milestone for `kind: "verify"`. */
export const denoiseProgressMilestoneVerifyLabel = "Verifying output…";

const SPINNER_MAX = 48;

export function formatElapsed(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  return `${(ms / 1000).toFixed(1)}s`;
}

/** Multi-line timing section for guided transcript or logs. */
export function formatExecutionTimingBlock(timing: {
  readonly entries: readonly {
    readonly label: string;
    readonly elapsedMs: number;
  }[];
  readonly totalMs: number;
}): string {
  const lines: string[] = ["Timing:"];

  for (const e of timing.entries) {
    lines.push(`  ${e.label} · ${formatElapsed(e.elapsedMs)}`);
  }

  lines.push(`  Total · ${formatElapsed(timing.totalMs)}`);

  return `${lines.join("\n")}\n`;
}

/**
 * Spinner line with elapsed suffix; truncates base so total length stays within {@link SPINNER_MAX}.
 */
export function formatSpinnerMessageWithElapsed(
  baseMessage: string,
  phaseElapsedMs: number,
): string {
  const suffix = ` · ${formatElapsed(phaseElapsedMs)}`;
  const maxBase = SPINNER_MAX - suffix.length;

  if (maxBase < 1) {
    return suffix.trimStart();
  }

  if (baseMessage.length <= maxBase) {
    return `${baseMessage}${suffix}`;
  }

  return `${baseMessage.slice(0, maxBase - 1)}…${suffix}`;
}

/** One-line message for @clack spinner / constrained terminals. */
export function formatProgressForSpinner(event: DenoiseProgressEvent): string {
  const batchPrefix =
    event.batch !== undefined
      ? `[${event.batch.index}/${event.batch.total}] `
      : "";

  if (event.kind === "probe") {
    return `${batchPrefix}${denoiseProgressMilestoneProbeLabel}`;
  }

  if (event.kind === "verify") {
    return `${batchPrefix}${denoiseProgressMilestoneVerifyLabel}`;
  }

  if (event.kind === "ffmpeg") {
    const parts: string[] = [];

    if (event.percent !== undefined) {
      parts.push(`${Math.round(event.percent)}%`);
    } else if (event.timeSec !== undefined) {
      parts.push(`${event.timeSec.toFixed(1)}s`);
    }

    if (event.speed !== undefined) {
      parts.push(event.speed);
    }

    const detail = parts.length > 0 ? ` · ${parts.join(" ")}` : "";
    return truncateSpinner(`${batchPrefix}ffmpeg${detail}`);
  }

  const prev =
    event.previousStepElapsedMs !== undefined && event.previousStepElapsedMs > 0
      ? ` · prev ${formatElapsed(event.previousStepElapsedMs)}`
      : "";

  const body = `Step ${event.stepIndex + 1}/${event.stepTotal} · ${event.label}${prev}`;

  return truncateSpinner(`${batchPrefix}${body}`);
}

function truncateSpinner(s: string): string {
  if (s.length <= SPINNER_MAX) {
    return s;
  }

  return `${s.slice(0, SPINNER_MAX - 1)}…`;
}

/** Stable JSON-serializable snapshot for NDJSON progress lines. */
export function denoiseProgressEventToJson(
  event: DenoiseProgressEvent,
): Record<string, unknown> {
  const base: Record<string, unknown> = { kind: event.kind };

  if (event.batch !== undefined) {
    base.batchIndex = event.batch.index;
    base.batchTotal = event.batch.total;
  }

  if (event.kind === "step") {
    base.stepIndex = event.stepIndex;
    base.stepTotal = event.stepTotal;
    base.label = event.label;
    if (event.previousStepElapsedMs !== undefined) {
      base.previousStepElapsedMs = event.previousStepElapsedMs;
    }
  } else if (event.kind === "ffmpeg") {
    if (event.timeSec !== undefined) {
      base.timeSec = event.timeSec;
    }
    if (event.durationSec !== undefined) {
      base.durationSec = event.durationSec;
    }
    if (event.speed !== undefined) {
      base.speed = event.speed;
    }
    if (event.percent !== undefined) {
      base.percent = event.percent;
    }
  }

  return base;
}
