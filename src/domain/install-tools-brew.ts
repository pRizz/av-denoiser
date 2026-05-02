/** Homebrew argv plans for macOS `install-tools` (doctor-aligned). */

export type BrewInstallStep = {
  readonly argv: readonly string[];
  /** One-line label for dry-run / logs */
  readonly label: string;
};

export function planBrewInstallSteps(
  includeOptional: boolean,
): readonly BrewInstallStep[] {
  // `mlt` is omitted: Homebrew's mlt depends on classic `sox`, which conflicts with `sox_ng`.
  const formulaPkgs = includeOptional
    ? (["ffmpeg", "sox_ng", "uv"] as const)
    : (["ffmpeg", "uv"] as const);

  const steps: BrewInstallStep[] = [
    {
      argv: ["brew", "install", ...formulaPkgs],
      label: "Homebrew formulae",
    },
  ];

  if (includeOptional) {
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
  const venvDir = `~/.local/share/av-denoiser/demucs-venv`;
  const lines = [
    "",
    "Manual next steps (not run automatically):",
    "- Demucs (optional preset): `uv tool install demucs` (install `uv` via Homebrew first if needed: `brew install uv`),",
    `  or as a last resort \`python3 -m venv ${venvDir}\` then that venv's \`pip install -U demucs\` (PEP 668 may block system pip);`,
    "  ensure `demucs` or `python3 -m demucs` is discoverable (`uv tool`'s bin dir on PATH, or activated venv).",
  ];

  if (!includeDemucsHint) {
    return "";
  }

  return lines.join("\n");
}
