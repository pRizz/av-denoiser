import type { GuidedCleanSelections } from "./guided-clean-selection";
import { cliName } from "./product";

/** Quote a segment for argv display — spawn-safe tokens when parsed back via Commander. */
export function quoteArgvSegment(segment: string): string {
  if (!/[\s"\\]/.test(segment)) {
    return segment;
  }

  return `"${segment.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Builds argv tokens equivalent to `av-denoiser clean …` for replay (`parseCliRequest` uses `slice(1)`).
 */
export function argvTokensForEquivalentClean(
  selections: GuidedCleanSelections,
): readonly string[] {
  const tokens: string[] = [
    cliName,
    "clean",
    quoteArgvSegment(selections.inputPath),
  ];

  if (
    selections.maybeOutputPath !== undefined &&
    selections.maybeOutputPath !== ""
  ) {
    tokens.push("-o", quoteArgvSegment(selections.maybeOutputPath));
  }

  if (selections.force) {
    tokens.push("--force");
  }

  if (selections.dryRun) {
    tokens.push("--dry-run");
  }

  if (selections.allowVideoReencode) {
    tokens.push("--allow-video-reencode");
  }

  tokens.push("--preset", selections.presetId);
  tokens.push(
    "--noise-strength",
    formatNoiseStrength(selections.noiseStrength),
  );

  if (selections.acceptAudacityPipeRisk) {
    tokens.push("--accept-audacity-pipe-risk");
  }

  const trimmedMacro =
    selections.maybeAudacityMacro === undefined
      ? ""
      : selections.maybeAudacityMacro.trim();

  if (trimmedMacro !== "") {
    tokens.push("--audacity-macro", quoteArgvSegment(trimmedMacro));
  }

  if (selections.maybeLadspa !== undefined) {
    tokens.push(
      "--ladspa-plugin-path",
      quoteArgvSegment(selections.maybeLadspa.pluginPath),
      "--ladspa-label",
      quoteArgvSegment(selections.maybeLadspa.label),
    );

    if (selections.maybeLadspa.controls !== "") {
      tokens.push(
        "--ladspa-controls",
        quoteArgvSegment(selections.maybeLadspa.controls),
      );
    }
  }

  return tokens;
}

function formatNoiseStrength(value: number): string {
  return Number.parseFloat(value.toFixed(6)).toString();
}
