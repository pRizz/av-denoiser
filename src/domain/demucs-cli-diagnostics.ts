export function isLikelyTqdmProgressNoise(line: string): boolean {
  const t = line.trim();

  if (t.length === 0) {
    return true;
  }

  if (t.includes("%|") && t.includes("|")) {
    return true;
  }

  if (/\d+\.\d+s\/it/.test(t)) {
    return true;
  }

  if (/^\d+%\s*\|/.test(t)) {
    return true;
  }

  return false;
}

/**
 * Prefer tracebacks and real errors over tqdm bars in captured Demucs logs
 * (progress bars use `\r` and dominate head-truncated snippets).
 */
export function formatDemucsFailureSnippet(
  stderr: string,
  stdout: string,
  cap: number,
): string {
  const normalized = stderr.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isLikelyTqdmProgressNoise(l));

  let body = lines.join("\n").trim();

  if (body.length === 0) {
    body = normalized.replace(/\s+/g, " ").trim();
  }

  const stdoutTail = stdout.trim().slice(-Math.min(400, cap));

  if (stdoutTail.length > 0) {
    const suffix =
      stdoutTail.length >= stdout.trim().length ? stdoutTail : `…${stdoutTail}`;

    body = body.length > 0 ? `${body}\nstdout: ${suffix}` : `stdout: ${suffix}`;
  }

  if (body.length === 0) {
    body =
      "(Demucs produced no parseable error text in stderr; check GPU/CPU memory, model cache, and that the WAV input is valid.)";
  }

  if (body.length > cap) {
    return `${body.slice(-cap)}…`;
  }

  return body;
}
