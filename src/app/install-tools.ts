import { confirm, isCancel } from "@clack/prompts";
import { probeTorchcodecImportWithPython } from "../adapters/demucs-torchcodec-probe";
import {
  type ProcessRunner,
  runProcessCommand,
} from "../adapters/process-runner";
import type { CommandOutcome } from "../domain/command-outcome";
import { resolveDemucsPythonForTorchcodec } from "../domain/demucs-python";
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
  /** Confirms `uv pip install --python … torchcodec` into Demucs' Python. */
  readonly confirmTorchcodecPip?: (pythonPath: string) => Promise<boolean>;
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

/** TorchCodec row in the post-install summary (full tier only, when Demucs is on PATH). */
type TorchcodecSummaryKind =
  | { readonly kind: "none" }
  | { readonly kind: "ok" }
  | { readonly kind: "repaired" }
  | { readonly kind: "skipped"; readonly reason: string }
  | { readonly kind: "missing"; readonly detail: string };

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

async function defaultConfirmTorchcodecPip(
  pythonPath: string,
): Promise<boolean> {
  const displayPath =
    pythonPath.length > 140 ? `${pythonPath.slice(0, 137)}…` : pythonPath;

  const resolved = await confirm({
    message: `Demucs needs the TorchCodec Python package for many current torchaudio builds. Install with uv pip into that interpreter now? (${displayPath})`,
    initialValue: false,
  });

  if (isCancel(resolved)) {
    return false;
  }

  return resolved;
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
  readonly torchcodec: TorchcodecSummaryKind;
}): string[] {
  const { includeOptional, maybeWhich, useStdoutColor, demucs, torchcodec } =
    deps;
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

    switch (torchcodec.kind) {
      case "none":
        break;
      case "ok":
        lines.push(
          `${greenCheckMarkPrefix(useStdoutColor)}TorchCodec (Demucs): import OK`,
        );
        break;
      case "repaired":
        lines.push(
          `${greenCheckMarkPrefix(useStdoutColor)}TorchCodec (Demucs): installed via uv pip`,
        );
        break;
      case "skipped":
        lines.push(`TorchCodec (Demucs): skipped — ${torchcodec.reason}`);
        break;
      case "missing":
        lines.push(`TorchCodec (Demucs): gap — ${torchcodec.detail}`);
        break;
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

type TorchcodecRepairResult = {
  readonly detailLines: string[];
  readonly summary: TorchcodecSummaryKind;
};

async function runTorchcodecOptionalRepairStep(deps: {
  readonly uvPath: string;
  readonly demucsPath: string;
  readonly isTTY: boolean;
  readonly assumeYes: boolean;
  readonly confirmTorchcodecPip: (pythonPath: string) => Promise<boolean>;
  readonly runPythonPipInherit: (argv: readonly string[]) => Promise<number>;
  readonly runProcess: ProcessRunner;
  readonly maybeWhich: (name: string) => string | null;
  readonly useStdoutColor: boolean;
}): Promise<TorchcodecRepairResult> {
  const pythonResolve = resolveDemucsPythonForTorchcodec(
    deps.demucsPath,
    deps.maybeWhich,
  );

  if (pythonResolve.kind !== "ok") {
    return {
      detailLines: [
        `TorchCodec: could not resolve Demucs Python (${pythonResolve.reason}). See docs/doctor.md for manual \`uv pip install --python … torchcodec\` (including \`python3 -m demucs\` layouts).`,
      ],
      summary: {
        kind: "missing",
        detail: pythonResolve.reason,
      },
    };
  }

  const pythonPath = pythonResolve.pythonPath;
  let probeOutcome = await probeTorchcodecImportWithPython(
    pythonPath,
    deps.runProcess,
  );

  if (probeOutcome.kind === "available") {
    return {
      detailLines: [
        `${greenCheckMarkPrefix(deps.useStdoutColor)}TorchCodec: import OK in Demucs Python.`,
      ],
      summary: { kind: "ok" },
    };
  }

  const tryInstall =
    deps.assumeYes ||
    (deps.isTTY && (await deps.confirmTorchcodecPip(pythonPath)));

  if (!tryInstall) {
    const reason = deps.isTTY
      ? "declined the TorchCodec install prompt"
      : "non-interactive terminal; pass --yes to allow `uv pip install torchcodec` without a second prompt";

    return {
      detailLines: [
        `TorchCodec: import check failed — ${probeOutcome.detail}`,
        `Skipped uv pip install (${reason}). Manual: \`uv pip install --python '${pythonPath}' torchcodec\` (docs/doctor.md).`,
      ],
      summary: { kind: "skipped", reason },
    };
  }

  const pipExit = await deps.runPythonPipInherit([
    deps.uvPath,
    "pip",
    "install",
    "--python",
    pythonPath,
    "torchcodec",
  ]);

  if (pipExit !== 0) {
    return {
      detailLines: [
        `uv pip install torchcodec failed (exit ${pipExit}). See docs/doctor.md.`,
      ],
      summary: {
        kind: "missing",
        detail: `uv pip install exited ${pipExit}`,
      },
    };
  }

  probeOutcome = await probeTorchcodecImportWithPython(
    pythonPath,
    deps.runProcess,
  );

  if (probeOutcome.kind === "available") {
    return {
      detailLines: [
        `${greenCheckMarkPrefix(deps.useStdoutColor)}TorchCodec: installed via uv pip; import OK.`,
      ],
      summary: { kind: "repaired" },
    };
  }

  return {
    detailLines: [
      "TorchCodec: uv pip finished but import still fails.",
      probeOutcome.detail,
      "If issues persist, see docs/doctor.md (TorchCodec / FFmpeg compatibility).",
    ],
    summary: { kind: "missing", detail: probeOutcome.detail },
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
  const confirmTorchcodecPip =
    deps.confirmTorchcodecPip ?? defaultConfirmTorchcodecPip;
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
        "When Demucs is on PATH, a TorchCodec import check runs; with `--yes` or an interactive confirm it may run `uv pip install --python <Demucs Python> torchcodec` if that check fails (see docs/doctor.md).",
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
      torchcodec: { kind: "none" },
    });

    return successCompletedMessage([
      "",
      "Homebrew installs finished.",
      ...summaryLines,
    ]);
  }

  const maybeDemucsPre = maybeWhich("demucs");
  let demucsPathFinal =
    maybeDemucsPre !== null && maybeDemucsPre.trim() !== ""
      ? maybeDemucsPre.trim()
      : null;

  let demucsSummary: DemucsSummaryKind;
  let torchcodecSummary: TorchcodecSummaryKind = { kind: "none" };

  const detailLines: string[] = ["", "Homebrew installs finished.", ""];

  if (demucsPathFinal !== null) {
    demucsSummary = { kind: "already", path: demucsPathFinal };
    detailLines.push(
      `${greenCheckMarkPrefix(useStdoutColor)}\`demucs\` already on PATH (${demucsPathFinal}) — skipped \`uv tool install\`.`,
    );
  } else {
    let runDemucsAutomated = false;

    if (request.assumeYes) {
      runDemucsAutomated = true;
    } else if (isTTY) {
      runDemucsAutomated = await confirmDemucsPip();
    }

    if (!runDemucsAutomated) {
      demucsSummary = { kind: "skipped" };
      detailLines.push(
        "Optional Demucs: run `uv tool install demucs` when you want vocal-isolation presets (or re-run this command).",
      );
      const summaryLines = buildInstallToolsSummaryLines({
        includeOptional: true,
        maybeWhich,
        useStdoutColor,
        demucs: demucsSummary,
        torchcodec: { kind: "none" },
      });

      return successCompletedMessage([...detailLines, ...summaryLines]);
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

    const pathAfterInstall = demucsResult.pathAfterInstall;
    demucsPathFinal =
      pathAfterInstall !== null && pathAfterInstall.trim() !== ""
        ? pathAfterInstall.trim()
        : null;

    detailLines.push("Demucs: installed via uv (`uv tool install demucs`).");

    if (demucsPathFinal !== null) {
      detailLines.push(
        `${greenCheckMarkPrefix(useStdoutColor)}\`demucs\` is on PATH (${demucsPathFinal}) — good to go for \`doctor\` and Demucs presets.`,
      );
    } else {
      detailLines.push(
        "If `demucs` is not on PATH, ensure uv's tool bin directory is on PATH (often `~/.local/bin`); open a new shell and retry.",
      );
    }

    demucsSummary = { kind: "installed", path: demucsPathFinal };
  }

  if (demucsPathFinal !== null) {
    const torch = await runTorchcodecOptionalRepairStep({
      uvPath,
      demucsPath: demucsPathFinal,
      isTTY,
      assumeYes: request.assumeYes,
      confirmTorchcodecPip,
      runPythonPipInherit: runDemucsStep,
      runProcess,
      maybeWhich,
      useStdoutColor,
    });

    detailLines.push(...torch.detailLines);
    torchcodecSummary = torch.summary;
  } else {
    torchcodecSummary = {
      kind: "skipped",
      reason:
        "Demucs not on PATH yet — add uv tool bin (often `~/.local/bin`), open a new shell, then re-run for TorchCodec.",
    };
  }

  const summaryLines = buildInstallToolsSummaryLines({
    includeOptional: true,
    maybeWhich,
    useStdoutColor,
    demucs: demucsSummary,
    torchcodec: torchcodecSummary,
  });

  return successCompletedMessage([...detailLines, ...summaryLines]);
}
