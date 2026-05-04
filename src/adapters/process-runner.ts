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

/** Merge overrides into the current process env so spawned tools keep PATH and related vars. */
function spawnEnv(
  overrides: Readonly<Record<string, string>>,
): Record<string, string> {
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }

  Object.assign(out, overrides);

  return out;
}

async function readStream(
  stream: ReadableStream<Uint8Array> | null,
): Promise<string> {
  if (stream === null) {
    return "";
  }

  return await new Response(stream).text();
}

/** FFmpeg and some tools emit `\r` to rewrite the same terminal line; keep the latest segment. */
function afterLastCarriageReturn(line: string): string {
  const idx = line.lastIndexOf("\r");

  if (idx === -1) {
    return line;
  }

  return line.slice(idx + 1);
}

async function readStreamLines(
  stream: ReadableStream<Uint8Array> | null,
  onLine?: (line: string) => void,
): Promise<string> {
  if (stream === null) {
    return "";
  }

  const reader = stream.getReader();
  const dec = new TextDecoder();
  let carry = "";
  let full = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = dec.decode(value, { stream: true });
      full += chunk;
      carry += chunk;
      const lines = carry.split("\n");
      carry = lines.pop() ?? "";

      for (const raw of lines) {
        const logical = afterLastCarriageReturn(raw);

        if (onLine !== undefined && logical.length > 0) {
          onLine(logical);
        }
      }
    }

    if (carry.length > 0) {
      const logical = afterLastCarriageReturn(carry);

      if (onLine !== undefined && logical.length > 0) {
        onLine(logical);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return full;
}

/** Runs external tools through Bun argv arrays only; shell command strings are not accepted. */
export async function runProcessCommand(
  command: ProcessCommand,
): Promise<ProcessResult> {
  try {
    const process = Bun.spawn([command.executable, ...command.args], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: command.cwd,
      env: command.env === undefined ? undefined : spawnEnv(command.env),
      timeout: command.timeoutMs,
      stdin: command.stdin ?? "ignore",
    });

    const stderrPromise =
      command.onStderrLine !== undefined
        ? readStreamLines(process.stderr, command.onStderrLine)
        : readStream(process.stderr);

    const [exitCode, stdout, stderr] = await Promise.all([
      process.exited,
      readStream(process.stdout),
      stderrPromise,
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

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}
