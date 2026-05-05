import {
  createProcessCommand,
  type ProcessCommand,
} from "../domain/process-command";
import type { ProcessRunner } from "./process-runner";

const torchcodecImportProbeTimeoutMs = 12_000;

export type TorchcodecProbeResult =
  | { readonly kind: "available" }
  | { readonly kind: "missing"; readonly detail: string };

function truncateDetail(text: string, maxLen: number): string {
  const t = text.trim().replaceAll(/\s+/g, " ");

  if (t.length <= maxLen) {
    return t;
  }

  return `${t.slice(0, maxLen - 1)}…`;
}

/** Runs `python -c "import torchcodec"` with bounded timeout. */
export async function probeTorchcodecImportWithPython(
  pythonPath: string,
  runProcess: ProcessRunner,
): Promise<TorchcodecProbeResult> {
  const trimmed = pythonPath.trim();

  if (trimmed === "") {
    return { kind: "missing", detail: "empty python path" };
  }

  const created: ProcessCommand | null = (() => {
    const r = createProcessCommand({
      executable: trimmed,
      args: ["-c", "import torchcodec"],
      timeoutMs: torchcodecImportProbeTimeoutMs,
      stdin: "ignore",
    });

    return r.kind === "created" ? r.command : null;
  })();

  if (created === null) {
    return { kind: "missing", detail: "could not build python -c probe" };
  }

  const outcome = await runProcess(created);

  if (outcome.kind === "spawn-failed") {
    return {
      kind: "missing",
      detail: truncateDetail(outcome.error.message, 240),
    };
  }

  if (outcome.kind === "signaled") {
    return {
      kind: "missing",
      detail: `probe terminated by signal ${outcome.signalCode}`,
    };
  }

  if (outcome.exitCode === 0) {
    return { kind: "available" };
  }

  const combined = `${outcome.stderr}\n${outcome.stdout}`.trim();

  return {
    kind: "missing",
    detail:
      combined.length > 0
        ? truncateDetail(combined, 400)
        : `import torchcodec failed (exit ${outcome.exitCode})`,
  };
}
