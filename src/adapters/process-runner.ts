import type { ProcessCommand } from "../domain/process-command";

export type ProcessResult =
  | {
      readonly kind: "exited";
      readonly exitCode: number;
      readonly stdout: string;
      readonly stderr: string;
    }
  | {
      readonly kind: "signaled";
      readonly signalCode: string;
      readonly stdout: string;
      readonly stderr: string;
    }
  | { readonly kind: "spawn-failed"; readonly error: Error };

export type ProcessRunner = (command: ProcessCommand) => Promise<ProcessResult>;

/** Runs external tools through Bun argv arrays only; shell command strings are not accepted. */
export async function runProcessCommand(
  command: ProcessCommand,
): Promise<ProcessResult> {
  try {
    const process = Bun.spawn([command.executable, ...command.args], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: command.cwd,
      env: command.env,
      timeout: command.timeoutMs,
      stdin: command.stdin ?? "ignore",
    });

    const [exitCode, stdout, stderr] = await Promise.all([
      process.exited,
      readStream(process.stdout),
      readStream(process.stderr),
    ]);

    if (process.signalCode !== null) {
      return {
        kind: "signaled",
        signalCode: process.signalCode,
        stdout,
        stderr,
      };
    }

    return { kind: "exited", exitCode, stdout, stderr };
  } catch (error) {
    return { kind: "spawn-failed", error: toError(error) };
  }
}

async function readStream(
  stream: ReadableStream<Uint8Array> | null,
): Promise<string> {
  if (stream === null) {
    return "";
  }

  return await new Response(stream).text();
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}
