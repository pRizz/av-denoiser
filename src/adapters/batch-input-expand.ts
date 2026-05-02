import { normalize, resolve } from "node:path";
import fg from "fast-glob";

/** Lowercase extensions scanned when `--from-dir` is used (recursive). */
export const BATCH_FROM_DIR_EXTENSIONS = new Set([
  ".wav",
  ".mp4",
  ".m4a",
  ".mov",
  ".mkv",
  ".flac",
  ".aac",
]);

export type ExpandBatchInputsParams = {
  readonly cwd: string;
  readonly inputPaths: readonly string[];
  readonly globs: readonly string[];
  readonly maybeFromDir?: string;
  readonly acceptGlobRisk: boolean;
};

export async function expandBatchInputs(
  params: ExpandBatchInputsParams,
): Promise<readonly string[]> {
  if (params.globs.length > 0 && !params.acceptGlobRisk) {
    throw new Error(
      "Glob patterns require accepting expansion risk; pass --accept-glob-risk (see --help).",
    );
  }

  const absoluteExplicit = params.inputPaths.map((p) =>
    normalize(resolve(params.cwd, p)),
  );

  const globResults: string[] = [];

  if (params.globs.length > 0 && params.acceptGlobRisk) {
    for (const pattern of params.globs) {
      const hits = await fg(pattern, {
        cwd: params.cwd,
        absolute: true,
        onlyFiles: true,
        unique: true,
      });
      globResults.push(...hits);
    }
  }

  let dirResults: string[] = [];

  if (
    params.maybeFromDir !== undefined &&
    params.maybeFromDir.trim().length > 0
  ) {
    const root = normalize(resolve(params.cwd, params.maybeFromDir.trim()));
    const hits = await fg("**/*", {
      cwd: root,
      absolute: true,
      onlyFiles: true,
      unique: true,
    });
    dirResults = hits.filter((p) => {
      const lower = p.toLowerCase();

      for (const ext of BATCH_FROM_DIR_EXTENSIONS) {
        if (lower.endsWith(ext)) {
          return true;
        }
      }

      return false;
    });
  }

  const merged = [...absoluteExplicit, ...globResults, ...dirResults];
  const unique = [...new Set(merged)].sort((a, b) => a.localeCompare(b));

  return unique;
}
