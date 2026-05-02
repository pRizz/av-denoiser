import type { MediaProbe } from "./media-probe";

export const DURATION_VERIFY_RELATIVE_FRACTION = 0.005;
export const DURATION_VERIFY_MIN_ABS_SECONDS = 0.5;

export function durationVerificationToleranceSeconds(
  inputDurationSec: number,
): number {
  return Math.max(
    inputDurationSec * DURATION_VERIFY_RELATIVE_FRACTION,
    DURATION_VERIFY_MIN_ABS_SECONDS,
  );
}

export type CleanVerifyFailureReason =
  | "missing-file"
  | "empty-output"
  | "probe-parse"
  | "duration-mismatch"
  | "video-copy-mismatch"
  | "missing-video-stream";

export type CleanVerifyParams = {
  readonly outputPath: string;
  readonly outputExists: (p: string) => boolean;
  readonly outputFileSize: (p: string) => number;
  readonly inputProbe: MediaProbe;
  readonly outputProbe: MediaProbe;
  readonly plannedModality:
    | "audio-only"
    | "video-copy-safe"
    | "fallback-required";
  readonly claimedVideoCopied: boolean;
};

export type CleanVerifyResult =
  | { readonly kind: "ok" }
  | {
      readonly kind: "failure";
      readonly reason: CleanVerifyFailureReason;
      readonly detail: string;
    };

function parseDurationSeconds(probe: MediaProbe): number | null {
  const raw = probe.format?.duration?.trim();

  if (raw === undefined || raw.length === 0) {
    return null;
  }

  const value = Number.parseFloat(raw);

  return Number.isFinite(value) ? value : null;
}

function firstVideoStream(
  probe: MediaProbe,
): MediaProbe["streams"][number] | null {
  const video = probe.streams.find((s) => s.codec_type === "video");

  return video ?? null;
}

export function verifyCleanOutput(
  params: CleanVerifyParams,
): CleanVerifyResult {
  const { outputPath, outputExists, outputFileSize } = params;

  if (!outputExists(outputPath)) {
    return {
      kind: "failure",
      reason: "missing-file",
      detail: `Output file missing: ${outputPath}`,
    };
  }

  let size = 0;

  try {
    size = outputFileSize(outputPath);
  } catch (error: unknown) {
    return {
      kind: "failure",
      reason: "missing-file",
      detail:
        error instanceof Error
          ? error.message
          : "Could not read output file size.",
    };
  }

  if (size <= 0) {
    return {
      kind: "failure",
      reason: "empty-output",
      detail: "empty-output: output file has zero size",
    };
  }

  const inputDur = parseDurationSeconds(params.inputProbe);
  const outputDur = parseDurationSeconds(params.outputProbe);

  if (inputDur === null || outputDur === null) {
    return {
      kind: "failure",
      reason: "probe-parse",
      detail: "probe-parse: missing or invalid format.duration on input/output",
    };
  }

  const tolerance =
    inputDur > 0
      ? durationVerificationToleranceSeconds(inputDur)
      : DURATION_VERIFY_MIN_ABS_SECONDS;

  if (Math.abs(outputDur - inputDur) > tolerance) {
    return {
      kind: "failure",
      reason: "duration-mismatch",
      detail: `duration-mismatch: input ${inputDur}s vs output ${outputDur}s (tolerance ${tolerance}s)`,
    };
  }

  if (
    params.plannedModality === "video-copy-safe" &&
    params.claimedVideoCopied
  ) {
    const inVideo = firstVideoStream(params.inputProbe);
    const outVideo = firstVideoStream(params.outputProbe);

    if (inVideo === null || outVideo === null) {
      return {
        kind: "failure",
        reason: "missing-video-stream",
        detail: "missing-video-stream: expected video on input and output",
      };
    }

    if (inVideo.codec_name !== outVideo.codec_name) {
      return {
        kind: "failure",
        reason: "video-copy-mismatch",
        detail: `video-copy-mismatch: input video ${inVideo.codec_name} vs output ${outVideo.codec_name}`,
      };
    }
  }

  return { kind: "ok" };
}
