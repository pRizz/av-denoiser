import {
  type MediaProbe,
  type ParseFfprobeJsonResult,
  parseFfprobeJson,
} from "../domain/media-probe";
import {
  createProcessCommand,
  type ProcessCommandResult,
} from "../domain/process-command";
import type { ProcessResult, ProcessRunner } from "./process-runner";

export function createFfprobeJsonCommand(input: {
  readonly ffprobePath: string;
  readonly inputPath: string;
}): ProcessCommandResult {
  return createProcessCommand({
    executable: input.ffprobePath,
    args: [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      input.inputPath,
    ],
  });
}

export type FfprobeProbeError =
  | { readonly kind: "invalid-command" }
  | { readonly kind: "spawn-failed"; readonly message: string }
  | { readonly kind: "signaled"; readonly signalCode: string }
  | {
      readonly kind: "non-zero-exit";
      readonly exitCode: number;
      readonly stderr: string;
    }
  | { readonly kind: "empty-output" }
  | Extract<ParseFfprobeJsonResult, { readonly ok: false }>["error"];

export type RunFfprobeProbeResult =
  | { readonly ok: true; readonly value: MediaProbe }
  | { readonly ok: false; readonly error: FfprobeProbeError };

export type RunFfprobeProbeDeps = {
  readonly ffprobePath: string;
  readonly inputPath: string;
  readonly runProcess: ProcessRunner;
};

export async function runFfprobeProbe(
  deps: RunFfprobeProbeDeps,
): Promise<RunFfprobeProbeResult> {
  const commandResult = createFfprobeJsonCommand({
    ffprobePath: deps.ffprobePath,
    inputPath: deps.inputPath,
  });

  if (commandResult.kind === "invalid") {
    return { ok: false, error: { kind: "invalid-command" } };
  }

  const processResult = await deps.runProcess(commandResult.command);

  return mapProcessResultToProbe(processResult);
}

function mapProcessResultToProbe(result: ProcessResult): RunFfprobeProbeResult {
  if (result.kind === "spawn-failed") {
    return {
      ok: false,
      error: { kind: "spawn-failed", message: result.error.message },
    };
  }

  if (result.kind === "signaled") {
    return {
      ok: false,
      error: { kind: "signaled", signalCode: result.signalCode },
    };
  }

  if (result.exitCode !== 0) {
    return {
      ok: false,
      error: {
        kind: "non-zero-exit",
        exitCode: result.exitCode,
        stderr: result.stderr,
      },
    };
  }

  if (result.stdout.trim().length === 0) {
    return { ok: false, error: { kind: "empty-output" } };
  }

  const parsed = parseFfprobeJson(result.stdout);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  return { ok: true, value: parsed.value };
}
