import {
  basename,
  dirname,
  extname,
  join,
  normalize,
  resolve,
} from "node:path";

/** Literal suffix segment inserted before the preserved extension (`clip.m4a` → `clip.avdn.m4a`). */
export const DEFAULT_OUTPUT_SUFFIX_SEGMENT = "avdn";

export type ResolveOutputPathInput = {
  readonly cwd: string;
  readonly inputPath: string;
  readonly maybeExplicitOutput?: string;
  readonly force: boolean;
  readonly doesOutputExist: (absolutePath: string) => boolean;
};

export type OutputPathSuccess = {
  readonly kind: "ok";
  readonly resolvedInputPath: string;
  readonly resolvedOutputPath: string;
};

export type OutputPathFailure =
  | {
      readonly kind: "output-equals-input";
      readonly resolvedInputPath: string;
      readonly resolvedOutputPath: string;
    }
  | {
      readonly kind: "output-exists";
      readonly resolvedOutputPath: string;
    };

export type ResolveOutputPathResult = OutputPathSuccess | OutputPathFailure;

function canonicalPath(cwd: string, maybePath: string): string {
  return normalize(resolve(cwd, maybePath));
}

/**
 * Resolves a deterministic default output next to the input:
 * `<stem>.avdn.<ext>` (example: `clip.m4a` → `clip.avdn.m4a`).
 */
export function resolveOutputPath(
  input: ResolveOutputPathInput,
): ResolveOutputPathResult {
  const resolvedInputPath = canonicalPath(input.cwd, input.inputPath);

  const explicit =
    input.maybeExplicitOutput === undefined ||
    input.maybeExplicitOutput.trim().length === 0
      ? undefined
      : input.maybeExplicitOutput.trim();

  const resolvedOutputPath =
    explicit === undefined
      ? defaultOutputPathBesideInput(resolvedInputPath)
      : canonicalPath(input.cwd, explicit);

  if (resolvedOutputPath === resolvedInputPath) {
    return {
      kind: "output-equals-input",
      resolvedInputPath,
      resolvedOutputPath,
    };
  }

  if (input.doesOutputExist(resolvedOutputPath) && !input.force) {
    return {
      kind: "output-exists",
      resolvedOutputPath,
    };
  }

  return {
    kind: "ok",
    resolvedInputPath,
    resolvedOutputPath,
  };
}

/**
 * Default cleaned output path beside the resolved input (`clip.m4a` → `clip.avdn.m4a`).
 */
export function defaultOutputPathBesideInput(
  resolvedInputPath: string,
): string {
  const dir = dirname(resolvedInputPath);
  const base = basename(resolvedInputPath);
  const ext = extname(base);
  const stem = ext.length > 0 ? base.slice(0, -ext.length) : base;

  const nextBase = `${stem}.${DEFAULT_OUTPUT_SUFFIX_SEGMENT}${ext}`;

  return normalize(join(dir, nextBase));
}
