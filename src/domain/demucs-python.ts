import { closeSync, existsSync, openSync, readSync } from "node:fs";

const shebangReadBytes = 512;

export type ResolveDemucsPythonResult =
  | { readonly kind: "ok"; readonly pythonPath: string }
  | { readonly kind: "not-available"; readonly reason: string };

/** True when basename looks like a Python interpreter (incl. python.exe). */
export function pathLooksLikePythonInterpreter(toolPath: string): boolean {
  const base =
    toolPath.replaceAll("\\", "/").split("/").pop()?.trim().toLowerCase() ?? "";
  if (base.length === 0) {
    return false;
  }

  return (
    base === "python" ||
    base === "python3" ||
    /^python\d+(?:\.\d+)?$/.test(base) ||
    /^python(?:\d+(?:\.\d+)?)?\.exe$/.test(base)
  );
}

/**
 * Reads the shebang of `demucsPath` and returns the Python executable that runs that script.
 * For `#!/usr/bin/env python3`, resolves `python3` via `maybeWhich` when provided.
 */
export function resolveDemucsPythonFromExecutable(
  demucsPath: string,
  maybeWhich?: (name: string) => string | null,
): ResolveDemucsPythonResult {
  const trimmedPath = demucsPath.trim();

  if (trimmedPath === "") {
    return { kind: "not-available", reason: "empty demucs path" };
  }

  if (!existsSync(trimmedPath)) {
    return {
      kind: "not-available",
      reason: `demucs path does not exist: ${trimmedPath}`,
    };
  }

  const leading = readLeadingUtf8(trimmedPath, shebangReadBytes);
  const firstLine =
    leading.split(/\r?\n/).find((line) => line.trim() !== "") ?? "";

  if (!firstLine.startsWith("#!")) {
    return {
      kind: "not-available",
      reason:
        "demucs is not a text script with a shebang; cannot infer Python automatically (try `python3 -m demucs` / manual torchcodec install)",
    };
  }

  const afterBang = firstLine.slice(2).trim();
  if (afterBang.length === 0) {
    return { kind: "not-available", reason: "empty shebang" };
  }

  const tokens = afterBang.split(/\s+/).filter((t) => t.length > 0);

  if (tokens.length === 0) {
    return { kind: "not-available", reason: "could not parse shebang" };
  }

  const head = tokens[0];
  if (head === undefined || head.length === 0) {
    return { kind: "not-available", reason: "could not parse shebang" };
  }

  const isEnv =
    head === "env" ||
    head.endsWith("/env") ||
    head.toLowerCase().endsWith("\\env.exe");

  if (isEnv) {
    const envArgs = tokens.slice(1);
    if (envArgs.length === 0) {
      return { kind: "not-available", reason: "shebang `env` has no target" };
    }

    const interpreterName = envArgs[0];
    if (interpreterName === undefined || interpreterName.length === 0) {
      return { kind: "not-available", reason: "shebang `env` target is empty" };
    }

    if (interpreterName.startsWith("-")) {
      return {
        kind: "not-available",
        reason: "shebang uses `env` with flags; cannot infer Python reliably",
      };
    }

    if (interpreterName.includes("/") || interpreterName.includes("\\")) {
      if (existsSync(interpreterName)) {
        return { kind: "ok", pythonPath: interpreterName };
      }

      return {
        kind: "not-available",
        reason: `shebang interpreter not found: ${interpreterName}`,
      };
    }

    const resolved =
      maybeWhich !== undefined ? maybeWhich(interpreterName) : null;
    if (resolved !== null && resolved.trim() !== "") {
      return { kind: "ok", pythonPath: resolved.trim() };
    }

    return {
      kind: "not-available",
      reason: `could not resolve \`${interpreterName}\` from shebang (not on PATH)`,
    };
  }

  const interpreter = head;

  if (existsSync(interpreter)) {
    return { kind: "ok", pythonPath: interpreter };
  }

  return {
    kind: "not-available",
    reason: `shebang interpreter does not exist: ${interpreter}`,
  };
}

export function resolveDemucsPythonForTorchcodec(
  demucsOrPythonPath: string,
  maybeWhich?: (name: string) => string | null,
): ResolveDemucsPythonResult {
  if (pathLooksLikePythonInterpreter(demucsOrPythonPath)) {
    const p = demucsOrPythonPath.trim();
    if (existsSync(p)) {
      return { kind: "ok", pythonPath: p };
    }

    return { kind: "not-available", reason: `Python path not found: ${p}` };
  }

  return resolveDemucsPythonFromExecutable(demucsOrPythonPath, maybeWhich);
}

function readLeadingUtf8(path: string, maxBytes: number): string {
  const fd = openSync(path, "r");

  try {
    const buf = Buffer.alloc(Math.max(1, maxBytes));
    const bytesRead = readSync(fd, buf, 0, buf.length, 0);

    return buf.subarray(0, bytesRead).toString("utf8");
  } finally {
    closeSync(fd);
  }
}
