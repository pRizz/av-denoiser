import {
  type ProcessRunner,
  runProcessCommand,
} from "../adapters/process-runner";
import type { CommandOutcome } from "../domain/command-outcome";
import {
  formatBrewInstallDryRunLines,
  manualPostBrewHints,
  planBrewInstallSteps,
} from "../domain/install-tools-brew";
import { createProcessCommand } from "../domain/process-command";
import { cliName } from "../domain/product";

export type InstallToolsInput = {
  readonly dryRun: boolean;
  readonly withOptional: boolean;
};

export type InstallToolsDeps = {
  readonly platform: NodeJS.Platform;
  readonly maybeWhich: (name: string) => string | null;
  readonly runBrewInherit: (argv: readonly string[]) => Promise<number>;
  readonly runProcess?: ProcessRunner;
};

function defaultRunBrewInherit(argv: readonly string[]): Promise<number> {
  const [executable, ...args] = argv;

  if (executable === undefined || executable.length === 0) {
    return Promise.resolve(1);
  }

  const child = Bun.spawn([executable, ...args], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  return child.exited;
}

export async function runInstallToolsRequest(
  request: InstallToolsInput,
  deps: Partial<InstallToolsDeps> = {},
): Promise<CommandOutcome> {
  const platform = deps.platform ?? process.platform;
  const maybeWhich = deps.maybeWhich ?? ((name: string) => Bun.which(name));
  const runBrewInherit = deps.runBrewInherit ?? defaultRunBrewInherit;
  const runProcess = deps.runProcess ?? runProcessCommand;

  if (platform !== "darwin") {
    return {
      kind: "failure",
      reason: {
        kind: "invalid-input",
        message: `${cliName} install-tools only supports macOS (Homebrew). On this OS, install FFmpeg and other tools using your package manager; run "${cliName} doctor" for hints.`,
      },
    };
  }

  const steps = planBrewInstallSteps(request.withOptional);
  const demucsBlock = manualPostBrewHints(request.withOptional);

  if (request.dryRun) {
    const lines = [
      `${cliName} install-tools --dry-run`,
      "",
      "Would run:",
      formatBrewInstallDryRunLines(steps),
      demucsBlock,
    ];

    return { kind: "success", message: lines.join("\n") };
  }

  const brewPath = maybeWhich("brew");

  if (brewPath === null || brewPath.trim() === "") {
    return {
      kind: "failure",
      reason: {
        kind: "invalid-input",
        message:
          "Homebrew (`brew`) not found on PATH. Install from https://brew.sh/ then re-run this command.",
      },
    };
  }

  const versionCmd = createProcessCommand({
    executable: brewPath,
    args: ["--version"],
  });

  if (versionCmd.kind !== "created") {
    return {
      kind: "failure",
      reason: {
        kind: "processing-failure",
        message: "Could not build brew --version command.",
      },
    };
  }

  const versionRun = await runProcess(versionCmd.command);

  if (versionRun.kind !== "exited" || versionRun.exitCode !== 0) {
    const detail =
      versionRun.kind === "exited"
        ? `exit ${versionRun.exitCode}: ${versionRun.stderr.trim()}`
        : versionRun.kind === "signaled"
          ? `signal ${versionRun.signalCode}`
          : versionRun.error.message;

    return {
      kind: "failure",
      reason: {
        kind: "processing-failure",
        message: `brew --version failed (${detail})`,
      },
    };
  }

  for (const step of steps) {
    const [exe, ...rest] = step.argv;

    if (exe !== "brew") {
      return {
        kind: "internal-error",
        error: new Error(`Unexpected brew step: ${step.label}`),
      };
    }

    const exitCode = await runBrewInherit([brewPath, ...rest]);

    if (exitCode !== 0) {
      return {
        kind: "failure",
        reason: {
          kind: "processing-failure",
          message: `brew failed during "${step.label}" (exit ${exitCode}).`,
        },
      };
    }
  }

  const doneLines = request.withOptional
    ? ["", "Homebrew installs finished.", demucsBlock.replace(/^\n+/, "")]
    : ["", "Homebrew installs finished."];

  return {
    kind: "success",
    message: `${cliName} install-tools: completed.${doneLines.join("\n")}`,
  };
}
