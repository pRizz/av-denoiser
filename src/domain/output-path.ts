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

function normalizeImplicitExtMaybe(
  implicitOutputExtWithDot?: string,
): string | undefined {
  if (implicitOutputExtWithDot === undefined) {
    return undefined;
  }

  const t = implicitOutputExtWithDot.trim();

  if (t.length === 0 || !t.startsWith(".")) {
    return undefined;
  }

  return t;
}

export type ResolveOutputPathInput = {
  readonly cwd: string;
  readonly inputPath: string;
  readonly maybeExplicitOutput?: string;
  /** When unset / explicit output path omitted, replaces input extension beside `stem.avdn.*`. Ignored when `maybeExplicitOutput` is set (must start with "."). Malformed → treated as omitted. */
  readonly implicitOutputExtWithDot?: string;
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

const MAX_SHELL_QUOTE_STRIP_ITERATIONS = 4;

/** Strips matching outer `'` or `"` pairs from pasted/drag-dropped paths (terminal shell escaping). */
export function trimUserProvidedPathForResolve(raw: string): string {
  let t = raw.trim();

  for (let i = 0; i < MAX_SHELL_QUOTE_STRIP_ITERATIONS; i += 1) {
    if (t.length < 2) {
      break;
    }

    const open = t[0];
    const close = t[t.length - 1];

    if ((open === "'" && close === "'") || (open === '"' && close === '"')) {
      t = t.slice(1, -1).trim();
    } else {
      break;
    }
  }

  return t;
}

function canonicalPath(cwd: string, maybePath: string): string {
  const cleaned = trimUserProvidedPathForResolve(maybePath);

  return normalize(resolve(cwd, cleaned));
}

/** Absolute normalized input path; matches planning resolution used by `resolveOutputPath`. */
export function canonicalInputPath(cwd: string, inputPath: string): string {
  return canonicalPath(cwd, inputPath);
}

/** User-facing planning failure line when `canonicalInputPath` does not exist on disk. */
export function describeMissingInputPath(
  resolvedPath: string,
  maybeDidYouMean?: string | null,
): string {
  const chunks = [
    `Input file not found: ${resolvedPath}`,
    "Confirm that path exists on disk (Finder path vs terminal path, iCloud-only placeholders, or renamed files often cause this).",
    "Shell note: paths with spaces must be quoted, e.g. av-denoiser inspect 'my clip.mp4'.",
  ];

  if (
    maybeDidYouMean !== undefined &&
    maybeDidYouMean !== null &&
    maybeDidYouMean.length > 0
  ) {
    chunks.push(`Did you mean: ${maybeDidYouMean}`);
  }

  return chunks.join(" ");
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

  const normalizedImplicit =
    explicit === undefined
      ? normalizeImplicitExtMaybe(input.implicitOutputExtWithDot)
      : undefined;

  const resolvedOutputPath =
    explicit === undefined
      ? defaultOutputPathBesideInput(resolvedInputPath, {
          implicitExtWithDot: normalizedImplicit,
        })
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

export type DefaultOutputPathBesideInputOptions = {
  readonly implicitExtWithDot?: string;
};

/**
 * Default cleaned output path beside the resolved input (`clip.m4a` → `clip.avdn.m4a`).
 *
 * With `implicitExtWithDot` (normalized: non-empty string starting with "."), replaces
 * the input extension (`clip.mov` + `.mp4` → `clip.avdn.mp4`).
 */
export function defaultOutputPathBesideInput(
  resolvedInputPath: string,
  options?: DefaultOutputPathBesideInputOptions,
): string {
  const dir = dirname(resolvedInputPath);
  const base = basename(resolvedInputPath);
  const inputExt = extname(base);
  const stem = inputExt.length > 0 ? base.slice(0, -inputExt.length) : base;
  const implicit = normalizeImplicitExtMaybe(options?.implicitExtWithDot);
  const suffixExt = implicit ?? (inputExt.length > 0 ? inputExt : "");

  const nextBase = `${stem}.${DEFAULT_OUTPUT_SUFFIX_SEGMENT}${suffixExt}`;

  return normalize(join(dir, nextBase));
}
