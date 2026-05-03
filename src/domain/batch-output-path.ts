import {
  basename,
  dirname,
  extname,
  join,
  normalize,
  resolve,
} from "node:path";

import { DEFAULT_OUTPUT_SUFFIX_SEGMENT } from "./output-path";

export type AllocateBatchOutputPathsInput = {
  readonly cwd: string;
  readonly orderedInputPaths: readonly string[];
  readonly maybeOutputDir?: string;
  readonly doesOutputExist: (absolutePath: string) => boolean;
  readonly force: boolean;
  readonly getImplicitExtWithDot?: (resolvedInputPath: string) => string;
};

export type BatchAllocatedPath = {
  readonly inputPath: string;
  readonly resolvedOutputPath: string;
};

/** Normalized absolute path for batch resolution (same semantics as prior `canonicalAbsolutePath`). */
export function canonicalBatchResolvedInputPath(
  cwd: string,
  maybePath: string,
): string {
  return normalize(resolve(cwd, maybePath.trim()));
}

/** Stem + media extension from the original input basename (`clip.m4a` → stem `clip`, `.m4a`). */
function stemAndExtFromInputBasename(resolvedInputPath: string): {
  stem: string;
  extWithDot: string;
} {
  const base = basename(resolvedInputPath);
  const ext = extname(base);
  const stem = ext.length > 0 ? base.slice(0, -ext.length) : base;

  return { stem, extWithDot: ext.length > 0 ? ext : "" };
}

export function allocateBatchOutputPaths(
  input: AllocateBatchOutputPathsInput,
): readonly BatchAllocatedPath[] {
  const claimedOutputs = new Set<string>();
  const results: BatchAllocatedPath[] = [];

  const maybeOutDirAbs =
    input.maybeOutputDir !== undefined && input.maybeOutputDir.trim().length > 0
      ? canonicalBatchResolvedInputPath(input.cwd, input.maybeOutputDir.trim())
      : undefined;

  const seg = DEFAULT_OUTPUT_SUFFIX_SEGMENT;

  for (const rawInput of input.orderedInputPaths) {
    const resolvedInputPath = canonicalBatchResolvedInputPath(
      input.cwd,
      rawInput,
    );
    const { stem, extWithDot } = stemAndExtFromInputBasename(resolvedInputPath);

    const outputDir =
      maybeOutDirAbs === undefined
        ? dirname(resolvedInputPath)
        : maybeOutDirAbs;

    let bump: number | undefined;

    let candidate: string;

    while (true) {
      let suffixExtWithDot = extWithDot;

      if (input.getImplicitExtWithDot !== undefined) {
        const fromCb = input.getImplicitExtWithDot(resolvedInputPath).trim();

        suffixExtWithDot =
          fromCb.startsWith(".") && fromCb.length > 1 ? fromCb : extWithDot;
      }

      const baseName =
        bump === undefined
          ? `${stem}.${seg}${suffixExtWithDot}`
          : `${stem}-${bump}.${seg}${suffixExtWithDot}`;

      candidate = normalize(join(outputDir, baseName));

      const blocked =
        claimedOutputs.has(candidate) ||
        (!input.force && input.doesOutputExist(candidate));

      if (!blocked) {
        break;
      }

      bump = bump === undefined ? 2 : bump + 1;
    }

    claimedOutputs.add(candidate);
    results.push({
      inputPath: resolvedInputPath,
      resolvedOutputPath: candidate,
    });
  }

  return results;
}
