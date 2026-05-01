#!/usr/bin/env bun

import type { CliRequest } from "../domain/cli-request";
import { createCommandProgram } from "./command";
import { renderCliRequest } from "./render";

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

  program.parse([...rawArgs], { from: "user" });

  return maybeRequest ?? { kind: "show-default" };
}

export function runCli(rawArgs: readonly string[] = Bun.argv.slice(2)): number {
  const request = parseCliRequest(rawArgs);
  const program = createCommandProgram(() => {});
  const output = renderCliRequest(request, program.helpInformation());

  process.stdout.write(`${output}\n`);

  return 0;
}

if (import.meta.main) {
  process.exitCode = runCli();
}
