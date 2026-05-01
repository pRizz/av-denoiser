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

  program
    .command("inspect")
    .description(
      "Probe input media with ffprobe and print a planned output summary (no transcoding)",
    )
    .argument("<input>", "Path to the input audio or video file")
    .option("-o, --output <path>", "Explicit output path (optional)")
    .option("--force", "Allow overwriting an existing output file", false)
    .option("--json", "Print machine-readable JSON instead of text", false)
    .action(
      (
        input: string,
        options: { output?: string; force?: boolean; json?: boolean },
      ) => {
        handleRequest({
          kind: "inspect",
          inputPath: input,
          maybeOutputPath: options.output,
          force: Boolean(options.force),
          json: Boolean(options.json),
        });
      },
    );

  return program;
}
