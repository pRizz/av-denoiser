#!/usr/bin/env bun

import { runCliRequest } from "../app/run-command";
import type { CliRequest } from "../domain/cli-request";
import { mapOutcomeToExitCode } from "../domain/command-outcome";
import { ExitCode } from "../domain/exit-codes";
import { createCommandProgram } from "./command";
import { renderCommandOutcome, renderFailureOutcome } from "./render";

function isHelpFlag(argument: string): boolean {
  return argument === "--help" || argument === "-h";
}

export function parseCliRequest(rawArgs: readonly string[]): CliRequest {
  if (rawArgs.some(isHelpFlag)) {
    return { kind: "show-help" };
  }

  let maybeRequest: CliRequest | undefined;
  const program = createCommandProgram((request) => {
    maybeRequest = request;
  });

  program.exitOverride();
  program.configureOutput({
    writeOut: () => {},
    writeErr: () => {},
  });
  program.parse([...rawArgs], { from: "user" });

  return maybeRequest ?? { kind: "show-default" };
}

export async function runCli(
  rawArgs: readonly string[] = Bun.argv.slice(2),
): Promise<number> {
  const program = createCommandProgram(() => {});
  const requestResult = safeParseCliRequest(rawArgs);

  if (requestResult.kind === "parse-error") {
    const outcome = {
      kind: "failure",
      reason: {
        kind: "invalid-input",
        message: requestResult.message,
      },
    } as const;

    process.stderr.write(`${renderFailureOutcome(outcome)}\n`);

    return ExitCode.invalidInput;
  }

  const outcome = await runCliRequest(requestResult.request);
  const output = renderCommandOutcome(
    requestResult.request,
    outcome,
    program.helpInformation(),
  );
  const exitCode = mapOutcomeToExitCode(outcome);
  const outputStream =
    exitCode === ExitCode.success ? process.stdout : process.stderr;

  outputStream.write(`${output}\n`);

  return exitCode;
}

if (import.meta.main) {
  const exitCode = await runCli().catch((error: unknown) => {
    const outcome = { kind: "internal-error", error } as const;

    process.stderr.write(`${renderFailureOutcome(outcome)}\n`);

    return ExitCode.internalError;
  });

  process.exit(exitCode);
}

type CliRequestParseResult =
  | { readonly kind: "parsed"; readonly request: CliRequest }
  | { readonly kind: "parse-error"; readonly message: string };

function safeParseCliRequest(
  rawArgs: readonly string[],
): CliRequestParseResult {
  try {
    return { kind: "parsed", request: parseCliRequest(rawArgs) };
  } catch (error) {
    return {
      kind: "parse-error",
      message: error instanceof Error ? error.message : "Invalid CLI input.",
    };
  }
}
