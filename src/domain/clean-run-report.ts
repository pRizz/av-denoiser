import type { MediaProbe } from "./media-probe";

export type VideoPolicyLabel = "copied" | "re-encoded" | "n/a-audio-only";

export type CleanRunReport = {
  readonly videoPolicy: VideoPolicyLabel;
  readonly audioCodecSummary: string;
  readonly droppedStreamsLabels: readonly string[];
  readonly verificationOk: boolean;
  readonly fallbackReasonCodes?: readonly string[];
};

export function labelsForDroppedStreams(
  probe: MediaProbe,
  selectedAudioStreamIndex: number,
): string[] {
  const primaryVideo = probe.streams.find((s) => s.codec_type === "video");
  const primaryVideoIndex = primaryVideo?.index;
  const labels: string[] = [];

  for (const s of probe.streams) {
    if (s.codec_type === "video" && s.index === primaryVideoIndex) {
      continue;
    }

    if (s.codec_type === "audio" && s.index === selectedAudioStreamIndex) {
      continue;
    }

    labels.push(`${s.codec_type}:${s.index}`);
  }

  return labels;
}

export function renderCleanRunReportText(report: CleanRunReport): string {
  const lines: string[] = [];

  const videoLine =
    report.videoPolicy === "re-encoded"
      ? "re-encoded (HEVC, libx265)"
      : report.videoPolicy;

  lines.push(`Video: ${videoLine}`);

  lines.push(`Audio: ${report.audioCodecSummary}`);

  if (report.droppedStreamsLabels.length > 0) {
    lines.push(`Dropped: ${report.droppedStreamsLabels.join(", ")}`);
  }

  if (
    report.fallbackReasonCodes !== undefined &&
    report.fallbackReasonCodes.length > 0
  ) {
    lines.push(`Fallbacks: ${report.fallbackReasonCodes.join(", ")}`);
  }

  lines.push(`Verified: ${report.verificationOk ? "yes" : "no"}`);

  return `${lines.join("\n")}\n`;
}
