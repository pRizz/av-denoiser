import { Command } from "@commander-js/extra-typings";

import type { CliRequest } from "../domain/cli-request";
import { cliName } from "../domain/product";

export type CliRequestHandler = (request: CliRequest) => void;

export function createCommandProgram(handleRequest: CliRequestHandler) {
  const program = new Command()
    .name(cliName)
    .description(
      "Clean noisy audio in local media files through a safe typed pipeline",
    )
    .showHelpAfterError();

  program.action(() => {
    handleRequest({ kind: "show-default" });
  });

  program
    .command("doctor")
    .description("Inspect local tool readiness for future media processing")
    .action(() => {
      handleRequest({ kind: "doctor" });
    });

  return program;
}
