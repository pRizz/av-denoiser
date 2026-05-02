import { createProcessCommand } from "../domain/process-command";
import type { ProcessRunner } from "./process-runner";

const probeTimeoutMs = 8_000;

/** Shared by doctor (`discoverTools`) and clean-time planning when LADSPA flags are used. */
export async function probeFfmpegLadspaFilter(input: {
  readonly ffmpegPath: string;
  readonly runProcess: ProcessRunner;
}): Promise<boolean> {
  const created = createProcessCommand({
    executable: input.ffmpegPath,
    args: ["-hide_banner", "-filters"],
    timeoutMs: probeTimeoutMs,
    stdin: "ignore",
  });

  if (created.kind !== "created") {
    return false;
  }

  const result = await input.runProcess(created.command);

  if (result.kind !== "exited" || result.exitCode !== 0) {
    return false;
  }

  const text = `${result.stdout}\n${result.stderr}`;

  return /\bladspa\b/i.test(text);
}
