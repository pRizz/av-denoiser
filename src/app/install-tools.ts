import { confirm, isCancel } from "@clack/prompts";
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
  readonly includeOptional: boolean;
  readonly assumeYes: boolean;
};

export type InstallToolsDeps = {
  readonly platform: NodeJS.Platform;
  readonly maybeWhich: (name: string) => string | null;
  readonly runBrewInherit: (argv: readonly string[]) => Promise<number>;
  readonly runProcess?: ProcessRunner;
  readonly isTTY?: boolean;
  readonly confirmDemucsPip?: () => Promise<boolean>;
  /** Runs Demucs automation (`uv tool install demucs`); default inherits stdio. */
  readonly runPythonPipInherit?: (argv: readonly string[]) => Promise<number>;
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

function defaultRunDemucsStepInherit(argv: readonly string[]): Promise<number> {
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

async function defaultConfirmDemucsPip(): Promise<boolean> {
  const answer = await confirm({
    message:
      "Install Demucs now with `uv tool install demucs`? (large download may include PyTorch; requires `uv` on PATH after Homebrew)",
    initialValue: false,
  });

  if (isCancel(answer)) {
    return false;
  }

  return answer;
}

function fullTierManualSuffix(demucsBlock: string): string[] {
  return ["", "Homebrew installs finished.", demucsBlock.replace(/^\n+/, "")];
}

function demucsAutomationFailureMessage(detail: string): string {
  return [
    detail,
    "PEP 668: avoid `pip install` into the OS interpreter; prefer isolated installs.",
    "Try: `brew install uv` then `uv tool install demucs`,",
    "or as a last resort create a dedicated venv and `pip install demucs` inside it.",
  ].join("\n");
}

type DemucsAutomationResult =
  | { readonly kind: "success"; readonly tailLines: readonly string[] }
  | { readonly kind: "failure"; readonly message: string };

async function runAutomatedDemucsInstall(deps: {
  readonly uvPath: string;
  readonly runDemucsStep: (argv: readonly string[]) => Promise<number>;
}): Promise<DemucsAutomationResult> {
  const code = await deps.runDemucsStep([
    deps.uvPath,
    "tool",
    "install",
    "demucs",
  ]);

  if (code !== 0) {
    return {
      kind: "failure",
      message: demucsAutomationFailureMessage(
        `uv tool install demucs failed (exit ${code}).`,
      ),
    };
  }

  return {
    kind: "success",
    tailLines: [
      "Demucs: installed via uv (`uv tool install demucs`).",
      "If `demucs` is not on PATH, ensure uv's tool bin directory is on PATH (often `~/.local/bin`); open a new shell and retry.",
    ],
  };
}

export async function runInstallToolsRequest(
  request: InstallToolsInput,
  deps: Partial<InstallToolsDeps> = {},
): Promise<CommandOutcome> {
  const platform = deps.platform ?? process.platform;
  const maybeWhich = deps.maybeWhich ?? ((name: string) => Bun.which(name));
  const runBrewInherit = deps.runBrewInherit ?? defaultRunBrewInherit;
  const runProcess = deps.runProcess ?? runProcessCommand;
  const isTTY =
    deps.isTTY ??
    (typeof process !== "undefined" && process.stdin.isTTY === true);
  const confirmDemucsPip = deps.confirmDemucsPip ?? defaultConfirmDemucsPip;
  const runDemucsStep = deps.runPythonPipInherit ?? defaultRunDemucsStepInherit;

  if (platform !== "darwin") {
    return {
      kind: "failure",
      reason: {
        kind: "invalid-input",
        message: `${cliName} install-tools only supports macOS (Homebrew). On this OS, install FFmpeg and other tools using your package manager; run "${cliName} doctor" for hints.`,
      },
    };
  }

  const steps = planBrewInstallSteps(request.includeOptional);
  const demucsBlock = manualPostBrewHints(request.includeOptional);

  if (request.dryRun) {
    const lines = [
      `${cliName} install-tools --dry-run`,
      "",
      "Would run:",
      formatBrewInstallDryRunLines(steps),
      demucsBlock,
      "",
      "After a real run: Homebrew installs include `uv`; `uv` must be on PATH before Demucs automation.",
    ];

    if (request.includeOptional) {
      lines.push(
        "",
        "Full tier: when you accept Demucs automation (or pass --yes), this CLI runs `uv tool install demucs`.",
      );
    }

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

  const uvPath = maybeWhich("uv");

  if (uvPath === null || uvPath.trim() === "") {
    return {
      kind: "failure",
      reason: {
        kind: "missing-tools",
        tools: ["uv"],
      },
    };
  }

  if (!request.includeOptional) {
    const doneLines = ["", "Homebrew installs finished."];

    return {
      kind: "success",
      message: `${cliName} install-tools: completed.${doneLines.join("\n")}`,
    };
  }

  let runDemucsAutomated = false;

  if (request.assumeYes) {
    runDemucsAutomated = true;
  } else if (isTTY) {
    runDemucsAutomated = await confirmDemucsPip();
  }

  if (!runDemucsAutomated) {
    const doneLines = fullTierManualSuffix(demucsBlock);

    return {
      kind: "success",
      message: `${cliName} install-tools: completed.${doneLines.join("\n")}`,
    };
  }

  const demucsResult = await runAutomatedDemucsInstall({
    uvPath,
    runDemucsStep,
  });

  if (demucsResult.kind === "failure") {
    return {
      kind: "failure",
      reason: {
        kind: "processing-failure",
        message: demucsResult.message,
      },
    };
  }

  const doneLines = [
    "",
    "Homebrew installs finished.",
    "",
    ...demucsResult.tailLines,
  ];

  return {
    kind: "success",
    message: `${cliName} install-tools: completed.${doneLines.join("\n")}`,
  };
}
