import {
  confirm,
  intro,
  isCancel,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import { renderCleanPlanText } from "../cli/render";
import type { PresetId } from "../domain/audio-pipeline-plan";
import { argvTokensForEquivalentClean } from "../domain/guided-clean-equivalent";
import { parseGuidedNoiseStrength } from "../domain/guided-clean-parse";
import type { GuidedCleanSelections } from "../domain/guided-clean-selection";
import type { CleanCliOutcome, CleanDeps, CleanRunInput } from "./clean";
import { runCleanRequest } from "./clean";
import type { CliCommandOutcome } from "./run-command";

export type GuidedCleanDeps = {
  readonly isTTY?: boolean;
  readonly runClean?: (
    input: CleanRunInput,
    cleanDeps?: Partial<CleanDeps>,
  ) => Promise<CleanCliOutcome>;
  readonly collectSelections?: () => Promise<GuidedCleanSelections | null>;
  readonly askRunClean?: () => Promise<boolean | null>;
};

function selectionsToCleanRunInput(s: GuidedCleanSelections): CleanRunInput {
  return {
    inputPath: s.inputPath,
    maybeOutputPath: s.maybeOutputPath,
    force: s.force,
    dryRun: s.dryRun,
    json: false,
    presetId: s.presetId,
    knobs: { noiseStrength: s.noiseStrength },
    allowVideoFallback: s.allowVideoFallback,
  };
}

async function defaultCollectSelections(): Promise<GuidedCleanSelections | null> {
  intro("av-denoiser guided clean");

  const inputRaw = await text({
    message: "Input media path",
    placeholder: "./recording.wav",
    validate: (value) =>
      value === undefined || value.trim() === ""
        ? "Path is required"
        : undefined,
  });

  if (isCancel(inputRaw)) {
    outro("Cancelled.");
    return null;
  }

  const inputPath = inputRaw.trim();

  const outputRaw = await text({
    message: "Output path (leave empty for default next to input)",
    placeholder: "",
  });

  if (isCancel(outputRaw)) {
    outro("Cancelled.");
    return null;
  }

  const maybeOutputPath =
    outputRaw.trim() === "" ? undefined : outputRaw.trim();

  const presetPick = await select<PresetId>({
    message: "Preset",
    options: [
      { value: "speech-light", label: "speech-light" },
      { value: "speech-soft-sox", label: "speech-soft-sox" },
    ],
    initialValue: "speech-light",
  });

  if (isCancel(presetPick)) {
    outro("Cancelled.");
    return null;
  }

  const noiseRaw = await text({
    message: "Noise reduction strength (0–1)",
    initialValue: "0.35",
    validate: (value) => {
      const parsed = parseGuidedNoiseStrength(value ?? "");

      return parsed === null ? "Enter a number between 0 and 1" : undefined;
    },
  });

  if (isCancel(noiseRaw)) {
    outro("Cancelled.");
    return null;
  }

  const parsedNoise = parseGuidedNoiseStrength(noiseRaw);
  const noiseStrength = parsedNoise ?? 0.35;

  const forcePick = await confirm({
    message: "Overwrite existing output without prompting (--force)?",
    initialValue: false,
  });

  if (isCancel(forcePick)) {
    outro("Cancelled.");
    return null;
  }

  const fallbackPick = await confirm({
    message:
      "Allow video preservation fallback plans (--allow-video-fallback)?",
    initialValue: false,
  });

  if (isCancel(fallbackPick)) {
    outro("Cancelled.");
    return null;
  }

  outro("Selections captured.");

  return {
    inputPath,
    maybeOutputPath,
    force: forcePick,
    dryRun: false,
    presetId: presetPick,
    noiseStrength,
    allowVideoFallback: fallbackPick,
  };
}

async function defaultAskRunClean(): Promise<boolean | null> {
  const answer = await confirm({
    message: "Run clean now (writes output)?",
    initialValue: true,
  });

  if (isCancel(answer)) {
    return null;
  }

  return answer;
}

export async function runGuidedCleanRequest(
  deps: Partial<GuidedCleanDeps> = {},
): Promise<CliCommandOutcome> {
  const runClean = deps.runClean ?? runCleanRequest;
  const tty =
    deps.isTTY ??
    (typeof process !== "undefined" && process.stdin.isTTY === true);

  if (!tty) {
    return {
      kind: "failure",
      reason: {
        kind: "planning-failure",
        message:
          "Guided workflow requires an interactive TTY (stdin is not a TTY). Use av-denoiser clean with explicit flags instead.",
      },
    };
  }

  const collected =
    deps.collectSelections !== undefined
      ? await deps.collectSelections()
      : await defaultCollectSelections();

  if (collected === null) {
    return {
      kind: "success",
      guidedHumanSummary: "av-denoiser guided cancelled.\n",
    };
  }

  const previewOutcome = await runClean(
    selectionsToCleanRunInput({ ...collected, dryRun: true }),
  );

  if (previewOutcome.kind !== "success" || previewOutcome.clean === undefined) {
    return previewOutcome;
  }

  let transcript = renderCleanPlanText(previewOutcome.clean);

  const replaySelections: GuidedCleanSelections = {
    ...collected,
    dryRun: false,
  };

  transcript += `\n\nEquivalent command:\n${argvTokensForEquivalentClean(replaySelections).join(" ")}\n`;

  const ask = deps.askRunClean ?? defaultAskRunClean;
  const decision = await ask();

  if (decision === null) {
    return {
      kind: "success",
      guidedHumanSummary: `${transcript}\nCancelled before execution.\n`,
    };
  }

  if (!decision) {
    return {
      kind: "success",
      guidedHumanSummary: `${transcript}\nSkipped execution.\n`,
    };
  }

  const spin = spinner();

  spin.start("Cleaning…");

  let executeOutcome: CleanCliOutcome;
  let okForSpinner = false;

  try {
    executeOutcome = await runClean(
      selectionsToCleanRunInput({ ...collected, dryRun: false }),
      {
        reportProgress: (phase) => {
          const label = phase.length > 48 ? `${phase.slice(0, 45)}…` : phase;

          spin.message(label);
        },
      },
    );
    okForSpinner = executeOutcome.kind === "success";
  } finally {
    spin.stop(okForSpinner ? "Finished clean." : "Stopped.");
  }

  if (executeOutcome.kind !== "success" || executeOutcome.clean === undefined) {
    return executeOutcome;
  }

  transcript += `\n---\n\n${renderCleanPlanText(executeOutcome.clean)}`;

  if (executeOutcome.clean.maybeReportText !== undefined) {
    transcript += `\n${executeOutcome.clean.maybeReportText}`;
  }

  return {
    kind: "success",
    clean: executeOutcome.clean,
    guidedHumanSummary: transcript,
  };
}
