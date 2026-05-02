export type AudacityDiagnosticKind =
  | "pipe-unavailable"
  | "audacity-not-running"
  | "macro-not-found"
  | "export-failed"
  | "feature-unsupported";

export type AudacityPipePaths = {
  readonly toServerPath: string;
  readonly fromServerPath: string;
};

export function formatAudacityDiagnostic(
  kind: AudacityDiagnosticKind,
  detail?: string,
): string {
  const base: Record<AudacityDiagnosticKind, string> = {
    "pipe-unavailable": "Audacity mod-script-pipe is not reachable",
    "audacity-not-running":
      "Audacity does not appear to be running or is not accepting pipe commands",
    "macro-not-found": "Audacity macro was not found or could not be applied",
    "export-failed": "Audacity export step failed",
    "feature-unsupported":
      "Audacity automation feature is not supported in this configuration",
  };

  const headline = base[kind];

  if (detail === undefined || detail.trim() === "") {
    return `Audacity: ${headline}`;
  }

  return `Audacity: ${headline}: ${detail.trim()}`;
}
