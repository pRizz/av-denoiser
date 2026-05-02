export const BATCH_MANIFEST_SCHEMA_VERSION = 1;

export type BatchManifestOutcome = "success" | "failure" | "skipped";

/** Mirrors `CommandFailureReason.kind` for audit alignment. */
export type BatchManifestFailureKind =
  | "invalid-input"
  | "missing-tools"
  | "planning-failure"
  | "processing-failure"
  | "fallback-required";

export type BatchManifestItemV1 = {
  readonly inputPath: string;
  readonly resolvedOutputPath: string;
  readonly outcome: BatchManifestOutcome;
  readonly maybeFailureKind: BatchManifestFailureKind | null;
  readonly message: string;
  readonly plannedSummary: unknown;
  readonly argvSnapshot: readonly string[][];
};

export type BatchManifestDocumentV1 = {
  readonly schemaVersion: typeof BATCH_MANIFEST_SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly items: readonly BatchManifestItemV1[];
  readonly maybeDoctorFacts: unknown | null;
};

export function emptyBatchManifestDraft(
  nowIso: string,
): BatchManifestDocumentV1 {
  return {
    schemaVersion: BATCH_MANIFEST_SCHEMA_VERSION,
    generatedAt: nowIso,
    items: [],
    maybeDoctorFacts: null,
  };
}
