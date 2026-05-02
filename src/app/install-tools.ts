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
  /**
   * When true, prefix the on-PATH success line with ANSI green + checkmark.
   * Default: `process.stdout.isTTY === true`. Set false in tests that assert plain text.
   */
  readonly useStdoutColor?: boolean;
};

/** Demucs row in the post-install summary (full tier only). */
type DemucsSummaryKind =
  | { readonly kind: "none" }
  | { readonly kind: "skipped" }
  | { readonly kind: "already"; readonly path: string }
  | {
      readonly kind: "installed";
      /** Resolved PATH after install, if any. */
      readonly path: string | null;
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

function demucsAutomationFailureMessage(detail: string): string {
  return [
    detail,
    "PEP 668: avoid `pip install` into the OS interpreter; prefer isolated installs.",
    "Try: `brew install uv` then `uv tool install demucs`,",
    "or as a last resort create a dedicated venv and `pip install demucs` inside it.",
  ].join("\n");
}

function greenCheckMarkPrefix(useColor: boolean): string {
  if (useColor) {
    return "\u001b[32m\u2713\u001b[0m ";
  }

  return "\u2713 ";
}

function summaryToolLine(
  useColor: boolean,
  label: string,
  maybePath: string | null,
): string {
  const path =
    maybePath !== null && maybePath.trim() !== "" ? maybePath.trim() : null;
  const suffix =
    path !== null ? ` (${path})` : " (not found on PATH — open a new shell?)";

  return `${greenCheckMarkPrefix(useColor)}${label}${suffix}`;
}

/** Post-install checklist: tools this command is responsible for. */
export function buildInstallToolsSummaryLines(deps: {
  readonly includeOptional: boolean;
  readonly maybeWhich: (name: string) => string | null;
  readonly useStdoutColor: boolean;
  readonly demucs: DemucsSummaryKind;
}): string[] {
  const { includeOptional, maybeWhich, useStdoutColor, demucs } = deps;
  const lines: string[] = ["", "Summary:"];

  lines.push(summaryToolLine(useStdoutColor, "FFmpeg", maybeWhich("ffmpeg")));
  lines.push(summaryToolLine(useStdoutColor, "ffprobe", maybeWhich("ffprobe")));
  lines.push(summaryToolLine(useStdoutColor, "uv", maybeWhich("uv")));

  if (includeOptional) {
    lines.push(summaryToolLine(useStdoutColor, "SoX_ng", maybeWhich("sox_ng")));
    lines.push(
      `${greenCheckMarkPrefix(useStdoutColor)}Audacity (Homebrew cask)`,
    );

    switch (demucs.kind) {
      case "none":
        break;
      case "skipped":
        lines.push("Demucs: not installed (skipped or non-interactive run).");
        break;
      case "already":
        lines.push(
          `${greenCheckMarkPrefix(useStdoutColor)}Demucs already on PATH (${demucs.path})`,
        );
        break;
      case "installed": {
        const demucsPath = demucs.path;
        if (demucsPath !== null) {
          lines.push(
            `${greenCheckMarkPrefix(useStdoutColor)}Demucs installed via uv (${demucsPath})`,
          );
        } else {
          lines.push(
            `${greenCheckMarkPrefix(useStdoutColor)}Demucs installed via uv — not on PATH yet; try \`~/.local/bin\` and a new shell`,
          );
        }
        break;
      }
    }
  }

  return lines;
}

type DemucsAutomationResult =
  | { readonly kind: "success"; readonly pathAfterInstall: string | null }
  | { readonly kind: "failure"; readonly message: string };

async function runAutomatedDemucsInstall(deps: {
  readonly uvPath: string;
  readonly runDemucsStep: (argv: readonly string[]) => Promise<number>;
  readonly maybeWhich: (name: string) => string | null;
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

  const maybeDemucsPath = deps.maybeWhich("demucs");
  const demucsPath =
    maybeDemucsPath !== null && maybeDemucsPath.trim() !== ""
      ? maybeDemucsPath.trim()
      : null;

  return {
    kind: "success",
    pathAfterInstall: demucsPath,
  };
}

function successCompletedMessage(bodyLines: readonly string[]): CommandOutcome {
  return {
    kind: "success",
    message: `${cliName} install-tools: completed.${bodyLines.join("\n")}`,
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
  const useStdoutColor =
    deps.useStdoutColor ??
    (typeof process !== "undefined" && process.stdout.isTTY === true);

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
        "Full tier: when you accept Demucs automation (or pass --yes), this CLI runs `uv tool install demucs`. If `demucs` is already on PATH, that step is skipped.",
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
    const summaryLines = buildInstallToolsSummaryLines({
      includeOptional: false,
      maybeWhich,
      useStdoutColor,
      demucs: { kind: "none" },
    });

    return successCompletedMessage([
      "",
      "Homebrew installs finished.",
      ...summaryLines,
    ]);
  }

  const maybeDemucsPre = maybeWhich("demucs");
  const demucsPrePath =
    maybeDemucsPre !== null && maybeDemucsPre.trim() !== ""
      ? maybeDemucsPre.trim()
      : null;

  if (demucsPrePath !== null) {
    const detailLines = [
      "",
      "Homebrew installs finished.",
      "",
      `${greenCheckMarkPrefix(useStdoutColor)}\`demucs\` already on PATH (${demucsPrePath}) — skipped install.`,
    ];
    const summaryLines = buildInstallToolsSummaryLines({
      includeOptional: true,
      maybeWhich,
      useStdoutColor,
      demucs: { kind: "already", path: demucsPrePath },
    });

    return successCompletedMessage([...detailLines, ...summaryLines]);
  }

  let runDemucsAutomated = false;

  if (request.assumeYes) {
    runDemucsAutomated = true;
  } else if (isTTY) {
    runDemucsAutomated = await confirmDemucsPip();
  }

  if (!runDemucsAutomated) {
    const summaryLines = buildInstallToolsSummaryLines({
      includeOptional: true,
      maybeWhich,
      useStdoutColor,
      demucs: { kind: "skipped" },
    });

    return successCompletedMessage([
      "",
      "Homebrew installs finished.",
      "",
      "Optional Demucs: run `uv tool install demucs` when you want vocal-isolation presets (or re-run this command).",
      ...summaryLines,
    ]);
  }

  const demucsResult = await runAutomatedDemucsInstall({
    uvPath,
    runDemucsStep,
    maybeWhich,
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

  const pathAfter = demucsResult.pathAfterInstall;
  const detailLines: string[] = ["", "Homebrew installs finished.", ""];

  detailLines.push("Demucs: installed via uv (`uv tool install demucs`).");

  if (pathAfter !== null) {
    detailLines.push(
      `${greenCheckMarkPrefix(useStdoutColor)}\`demucs\` is on PATH (${pathAfter}) — good to go for \`doctor\` and Demucs presets.`,
    );
  } else {
    detailLines.push(
      "If `demucs` is not on PATH, ensure uv's tool bin directory is on PATH (often `~/.local/bin`); open a new shell and retry.",
    );
  }

  const summaryLines = buildInstallToolsSummaryLines({
    includeOptional: true,
    maybeWhich,
    useStdoutColor,
    demucs: { kind: "installed", path: pathAfter },
  });

  return successCompletedMessage([...detailLines, ...summaryLines]);
}
