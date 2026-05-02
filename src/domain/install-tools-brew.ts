/** Homebrew argv plans for macOS `install-tools` (doctor-aligned). */

export type BrewInstallStep = {
  readonly argv: readonly string[];
  /** One-line label for dry-run / logs */
  readonly label: string;
};

export function planBrewInstallSteps(
  withOptional: boolean,
): readonly BrewInstallStep[] {
  const formulaPkgs = withOptional
    ? (["ffmpeg", "sox_ng", "mlt"] as const)
    : (["ffmpeg"] as const);

  const steps: BrewInstallStep[] = [
    {
      argv: ["brew", "install", ...formulaPkgs],
      label: "Homebrew formulae",
    },
  ];

  if (withOptional) {
    steps.push({
      argv: ["brew", "install", "--cask", "audacity"],
      label: "Audacity (cask)",
    });
  }

  return steps;
}

export function formatBrewInstallDryRunLines(
  steps: readonly BrewInstallStep[],
): string {
  return steps.map((s) => s.argv.map(quoteArg).join(" ")).join("\n");
}

function quoteArg(a: string): string {
  if (a.length === 0) {
    return "''";
  }

  if (/^[A-Za-z0-9_./@%+:~-]+$/.test(a)) {
    return a;
  }

  return `'${a.replace(/'/g, `'\\''`)}'`;
}

export function manualPostBrewHints(includeDemucsHint: boolean): string {
  const lines = [
    "",
    "Manual next steps (not run automatically):",
    "- Demucs (optional preset): python3 -m pip install -U demucs",
    "  or install a Demucs CLI another way, then ensure `demucs` or `python3 -m demucs` is on PATH.",
  ];

  if (!includeDemucsHint) {
    return "";
  }

  return lines.join("\n");
}
