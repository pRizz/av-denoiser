import {
  confirm,
  intro,
  isCancel,
  note,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import { renderDenoisePlanText } from "../cli/render";
import {
  type LadspaIntegration,
  type PresetId,
  parseLadspaCliTriple,
} from "../domain/audio-pipeline-plan";
import {
  formatExecutionTimingBlock,
  formatProgressForSpinner,
  formatSpinnerMessageWithElapsed,
} from "../domain/denoise-progress";
import { argvTokensForEquivalentDenoise } from "../domain/guided-denoise-equivalent";
import { parseGuidedNoiseStrength } from "../domain/guided-denoise-parse";
import type { GuidedDenoiseSelections } from "../domain/guided-denoise-selection";
import { cliName } from "../domain/product";
import type {
  DenoiseCliOutcome,
  DenoiseDeps,
  DenoiseRunInput,
} from "./denoise";
import { runDenoiseRequest } from "./denoise";
import type { CliCommandOutcome } from "./run-command";

export type GuidedDenoiseDeps = {
  readonly isTTY?: boolean;
  readonly runDenoise?: (
    input: DenoiseRunInput,
    denoiseDeps?: Partial<DenoiseDeps>,
  ) => Promise<DenoiseCliOutcome>;
  readonly collectSelections?: () => Promise<GuidedDenoiseSelections | null>;
  readonly askRunDenoise?: () => Promise<boolean | null>;
};

function selectionsToDenoiseRunInput(
  s: GuidedDenoiseSelections,
): DenoiseRunInput {
  const trimmedMacro =
    s.maybeAudacityMacro === undefined
      ? undefined
      : s.maybeAudacityMacro.trim();
  const maybeAudacityMacro =
    trimmedMacro === undefined || trimmedMacro === ""
      ? undefined
      : trimmedMacro;

  return {
    inputPath: s.inputPath,
    maybeOutputPath: s.maybeOutputPath,
    force: s.force,
    dryRun: s.dryRun,
    json: false,
    presetId: s.presetId,
    knobs: { noiseStrength: s.noiseStrength },
    allowVideoReencode: s.allowVideoReencode,
    acceptAudacityPipeRisk: s.acceptAudacityPipeRisk,
    ...(maybeAudacityMacro !== undefined ? { maybeAudacityMacro } : {}),
    ...(s.maybeLadspa !== undefined ? { maybeLadspa: s.maybeLadspa } : {}),
  };
}

async function defaultCollectSelections(): Promise<GuidedDenoiseSelections | null> {
  intro("av-denoiser guided denoise");

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
      { value: "speech-vocals-demucs", label: "speech-vocals-demucs" },
    ],
    initialValue: "speech-light",
  });

  if (isCancel(presetPick)) {
    outro("Cancelled.");
    return null;
  }

  if (presetPick === "speech-vocals-demucs") {
    note(
      `This preset uses Demucs; some installs also need the TorchCodec Python package. Run \`${cliName} doctor\` to verify. On macOS, \`${cliName} install-tools\` (with optional packages) can install Demucs and offer a TorchCodec fix with confirmation.`,
      "Demucs",
    );
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
      "Allow video to be re-encoded if necessary? (Adds --allow-video-reencode: HEVC to MP4; slower than keeping video as-is.)",
    initialValue: false,
  });

  if (isCancel(fallbackPick)) {
    outro("Cancelled.");
    return null;
  }

  let audacityAcknowledged = false;
  let maybeAudacityMacro: string | undefined;

  const audacityMacroPick = await confirm({
    message: "Add an Audacity macro step (--audacity-macro)?",
    initialValue: false,
  });

  if (isCancel(audacityMacroPick)) {
    outro("Cancelled.");
    return null;
  }

  if (audacityMacroPick) {
    const macroRaw = await text({
      message: "Audacity macro name",
      placeholder: "noise-reduction",
      validate: (value) =>
        value === undefined || value.trim() === ""
          ? "Macro name is required"
          : undefined,
    });

    if (isCancel(macroRaw)) {
      outro("Cancelled.");
      return null;
    }

    const macroName = macroRaw.trim();

    const riskPick = await confirm({
      message:
        "Audacity mod-script-pipe automates a running GUI instance and weakens local isolation (see docs/doctor.md). Acknowledge --accept-audacity-pipe-risk?",
      initialValue: false,
    });

    if (isCancel(riskPick)) {
      outro("Cancelled.");
      return null;
    }

    if (!riskPick) {
      outro("Cancelled — macro requires accepting Audacity pipe risk.");
      return null;
    }

    audacityAcknowledged = true;
    maybeAudacityMacro = macroName;
  }

  let maybeLadspa: LadspaIntegration | undefined;

  const ladspaPick = await confirm({
    message:
      "Add FFmpeg LADSPA filtering (--ladspa-plugin-path / --ladspa-label)?",
    initialValue: false,
  });

  if (isCancel(ladspaPick)) {
    outro("Cancelled.");
    return null;
  }

  if (ladspaPick) {
    const pluginPathAns = await text({
      message: "LADSPA plugin path (--ladspa-plugin-path)",
      placeholder: "/path/to/plugin.so",
      validate: (value) =>
        value === undefined || value.trim() === ""
          ? "Plugin path is required"
          : undefined,
    });

    if (isCancel(pluginPathAns)) {
      outro("Cancelled.");
      return null;
    }

    const labelAns = await text({
      message: "LADSPA label (--ladspa-label)",
      placeholder: "my_plugin_label",
      validate: (value) =>
        value === undefined || value.trim() === ""
          ? "Label is required"
          : undefined,
    });

    if (isCancel(labelAns)) {
      outro("Cancelled.");
      return null;
    }

    const controlsAns = await text({
      message: "LADSPA controls (--ladspa-controls, optional)",
      placeholder: "",
    });

    if (isCancel(controlsAns)) {
      outro("Cancelled.");
      return null;
    }

    const controlsTrimmed = controlsAns.trim();
    const ladspaParsed = parseLadspaCliTriple({
      pluginPath: pluginPathAns.trim(),
      label: labelAns.trim(),
      controls: controlsTrimmed === "" ? undefined : controlsTrimmed,
    });

    if (ladspaParsed !== null && ladspaParsed.kind === "error") {
      outro(ladspaParsed.message);
      return null;
    }

    if (ladspaParsed !== null && ladspaParsed.kind === "ok") {
      maybeLadspa = ladspaParsed.value;
    }
  }

  outro("Selections captured.");

  return {
    inputPath,
    maybeOutputPath,
    force: forcePick,
    dryRun: false,
    presetId: presetPick,
    noiseStrength,
    allowVideoReencode: fallbackPick,
    acceptAudacityPipeRisk: audacityAcknowledged,
    ...(maybeAudacityMacro !== undefined ? { maybeAudacityMacro } : {}),
    ...(maybeLadspa !== undefined ? { maybeLadspa } : {}),
  };
}

async function defaultAskRunDenoise(): Promise<boolean | null> {
  const answer = await confirm({
    message: "Run denoise now (writes output)?",
    initialValue: true,
  });

  if (isCancel(answer)) {
    return null;
  }

  return answer;
}

export async function runGuidedDenoiseRequest(
  deps: Partial<GuidedDenoiseDeps> = {},
): Promise<CliCommandOutcome> {
  const runDenoise = deps.runDenoise ?? runDenoiseRequest;
  const tty =
    deps.isTTY ??
    (typeof process !== "undefined" && process.stdin.isTTY === true);

  if (!tty) {
    return {
      kind: "failure",
      reason: {
        kind: "planning-failure",
        message:
          "Guided workflow requires an interactive TTY (stdin is not a TTY). Use av-denoiser denoise with explicit flags instead.",
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

  const previewOutcome = await runDenoise(
    selectionsToDenoiseRunInput({ ...collected, dryRun: true }),
  );

  if (
    previewOutcome.kind !== "success" ||
    previewOutcome.denoise === undefined
  ) {
    return previewOutcome;
  }

  let transcript = renderDenoisePlanText(previewOutcome.denoise);

  const replaySelections: GuidedDenoiseSelections = {
    ...collected,
    dryRun: false,
  };

  transcript += `\n\nEquivalent command:\n${argvTokensForEquivalentDenoise(replaySelections).join(" ")}\n`;

  const ask = deps.askRunDenoise ?? defaultAskRunDenoise;
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
  let phaseWallStartMs = Date.now();
  let lastBaseMessage = "Denoising…";
  const spinTickMs = 300;

  const refreshSpinMessage = () => {
    spin.message(
      formatSpinnerMessageWithElapsed(
        lastBaseMessage,
        Date.now() - phaseWallStartMs,
      ),
    );
  };

  spin.start("Denoising…");
  const spinInterval = setInterval(refreshSpinMessage, spinTickMs);

  let executeOutcome: DenoiseCliOutcome;
  let okForSpinner = false;
  let lastSpinnerFfmpegAt = 0;
  const ffmpegSpinThrottleMs = 220;

  try {
    executeOutcome = await runDenoise(
      selectionsToDenoiseRunInput({ ...collected, dryRun: false }),
      {
        reportProgress: (event) => {
          if (
            event.kind === "probe" ||
            event.kind === "step" ||
            event.kind === "verify"
          ) {
            phaseWallStartMs = Date.now();
          }

          if (event.kind === "ffmpeg") {
            const now = Date.now();

            if (now - lastSpinnerFfmpegAt < ffmpegSpinThrottleMs) {
              return;
            }

            lastSpinnerFfmpegAt = now;
          }

          lastBaseMessage = formatProgressForSpinner(event);
          refreshSpinMessage();
        },
      },
    );
    okForSpinner = executeOutcome.kind === "success";
  } finally {
    clearInterval(spinInterval);
    spin.stop(okForSpinner ? "Finished denoise pass." : "Stopped.");
  }

  if (
    executeOutcome.kind !== "success" ||
    executeOutcome.denoise === undefined
  ) {
    return executeOutcome;
  }

  transcript += `\n---\n\n${renderDenoisePlanText(executeOutcome.denoise)}`;

  if (executeOutcome.denoise.maybeReportText !== undefined) {
    transcript += `\n${executeOutcome.denoise.maybeReportText}`;
  }

  if (executeOutcome.denoise.maybeExecutionTiming !== undefined) {
    transcript += `\n${formatExecutionTimingBlock(executeOutcome.denoise.maybeExecutionTiming)}`;
  }

  return {
    kind: "success",
    denoise: executeOutcome.denoise,
    guidedHumanSummary: transcript,
  };
}
