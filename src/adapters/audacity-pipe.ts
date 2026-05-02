import { createReadStream, createWriteStream, existsSync } from "node:fs";
import type {
  AudacityDiagnosticKind,
  AudacityPipePaths,
} from "../domain/audacity";

export type AudacityPipeRoundTripDeps = {
  readonly writeLine: (
    path: string,
    line: string,
    timeoutMs: number,
  ) => Promise<void>;
  readonly readLine: (path: string, timeoutMs: number) => Promise<string>;
};

export function defaultAudacityPipePathsFromEnv(): AudacityPipePaths {
  const toRaw = process.env.AUDACITY_PIPE_TO;
  const fromRaw = process.env.AUDACITY_PIPE_FROM;

  if (
    toRaw !== undefined &&
    toRaw !== "" &&
    fromRaw !== undefined &&
    fromRaw !== ""
  ) {
    return { toServerPath: toRaw, fromServerPath: fromRaw };
  }

  return {
    toServerPath: "/tmp/audacity_script_pipe.to",
    fromServerPath: "/tmp/audacity_script_pipe.from",
  };
}

export type AudacityProbeResult =
  | { readonly kind: "ok" }
  | {
      readonly kind: "error";
      readonly diagnostic: AudacityDiagnosticKind;
      readonly detail?: string;
    };

export async function probeAudacityPipe(
  paths: AudacityPipePaths,
): Promise<AudacityProbeResult> {
  if (!existsSync(paths.toServerPath) || !existsSync(paths.fromServerPath)) {
    return {
      kind: "error",
      diagnostic: "pipe-unavailable",
      detail: `Expected mod-script-pipe paths (set AUDACITY_PIPE_TO / AUDACITY_PIPE_FROM if non-default).`,
    };
  }

  return { kind: "ok" };
}

export type AudacityMacroResult =
  | { readonly kind: "ok" }
  | {
      readonly kind: "error";
      readonly diagnostic: AudacityDiagnosticKind;
      readonly detail?: string;
    };

const defaultRoundTripMs = 30_000;

export async function runAudacityMacro(input: {
  readonly macroName: string;
  readonly inputAudioPath: string;
  readonly outputAudioPath: string;
  readonly pipes: AudacityPipePaths;
  readonly roundTripMs?: number;
  readonly transport?: AudacityPipeRoundTripDeps;
}): Promise<AudacityMacroResult> {
  const transport = input.transport ?? createFifoRoundTripDeps();

  if (input.transport === undefined) {
    const pipeProbe = await probeAudacityPipe(input.pipes);

    if (pipeProbe.kind !== "ok") {
      return pipeProbe;
    }
  }

  const budget = input.roundTripMs ?? defaultRoundTripMs;
  const perStep = Math.max(2_000, Math.floor(budget / 4));
  const lines = [
    `Import2:${input.inputAudioPath}`,
    `Macro:${input.macroName}`,
    `Export2:${input.outputAudioPath}`,
  ];

  for (const line of lines) {
    try {
      await transport.writeLine(input.pipes.toServerPath, line, perStep);
      const reply = await transport.readLine(
        input.pipes.fromServerPath,
        perStep,
      );

      if (reply.toLowerCase().startsWith("error")) {
        return {
          kind: "error",
          diagnostic: "feature-unsupported",
          detail: reply,
        };
      }
    } catch (error: unknown) {
      return {
        kind: "error",
        diagnostic: "audacity-not-running",
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return { kind: "ok" };
}

function createFifoRoundTripDeps(): AudacityPipeRoundTripDeps {
  return {
    writeLine: (path: string, line: string, timeoutMs: number) =>
      writeLineToPipe(path, line, timeoutMs),
    readLine: (path: string, timeoutMs: number) =>
      readLineFromPipe(path, timeoutMs),
  };
}

function writeLineToPipe(
  path: string,
  line: string,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(
        new Error(`timeout writing to Audacity pipe after ${timeoutMs}ms`),
      );
    }, timeoutMs);

    const stream = createWriteStream(path);

    stream.on("error", (error) => {
      clearTimeout(t);
      reject(error);
    });

    stream.write(`${line}\n`, (err) => {
      if (err !== null && err !== undefined) {
        clearTimeout(t);
        stream.destroy();
        reject(err);
        return;
      }

      stream.end(() => {
        clearTimeout(t);
        resolve();
      });
    });
  });
}

function readLineFromPipe(path: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(
        new Error(`timeout reading from Audacity pipe after ${timeoutMs}ms`),
      );
    }, timeoutMs);

    const stream = createReadStream(path, { encoding: "utf8" });
    let buffer = "";

    stream.on("data", (chunk: string) => {
      buffer += chunk;
      const ix = buffer.indexOf("\n");

      if (ix !== -1) {
        clearTimeout(t);
        stream.destroy();
        resolve(buffer.slice(0, ix).trim());
      }
    });

    stream.on("error", (error) => {
      clearTimeout(t);
      reject(error);
    });

    stream.on("end", () => {
      clearTimeout(t);
      resolve(buffer.trim());
    });
  });
}
