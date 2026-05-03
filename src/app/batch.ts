import { existsSync } from "node:fs";
import { extname, resolve } from "node:path";

import { expandBatchInputs } from "../adapters/batch-input-expand";
import { runFfprobeProbe } from "../adapters/ffprobe";
import { runProcessCommand } from "../adapters/process-runner";
import {
  type BatchManifestDocumentV1,
  type BatchManifestItemV1,
  emptyBatchManifestDraft,
} from "../domain/batch-manifest";
import {
  allocateBatchOutputPaths,
  canonicalBatchResolvedInputPath,
} from "../domain/batch-output-path";
import type { CliRequest } from "../domain/cli-request";
import {
  aggregateBatchExitCodes,
  type CommandOutcome,
  mapOutcomeToExitCode,
} from "../domain/command-outcome";
import type { DoctorReport } from "../domain/doctor-report";
import type { ExitCodeValue } from "../domain/exit-codes";
import { ExitCode } from "../domain/exit-codes";
import { resolveDidYouMeanMediaPath } from "../domain/input-path-hint";
import { describeMissingInputPath } from "../domain/output-path";
import {
  implicitDefaultOutputExtWithDot,
  planMediaOutputPrelude,
} from "../domain/output-plan";
import {
  type CleanCliOutcome,
  type CleanDeps,
  type CleanRunInput,
  runCleanRequest,
} from "./clean";
import { describeFfprobeFailure } from "./inspect";

export type BatchCliPayload = {
  readonly manifestPath: string;
  readonly worstExitCode: ExitCodeValue;
  readonly document: BatchManifestDocumentV1;
};

export type BatchOrchestratorDeps = {
  readonly discoverTools?: () => Promise<DoctorReport>;
  readonly clean?: Partial<CleanDeps>;
  readonly batch?: {
    readonly runClean?: (
      input: CleanRunInput,
      deps?: Partial<CleanDeps>,
    ) => Promise<CleanCliOutcome>;
  };
};

function manifestItemSkipped(
  inputPath: string,
  resolvedOutputPath: string,
): BatchManifestItemV1 {
  return {
    inputPath,
    resolvedOutputPath,
    outcome: "skipped",
    maybeFailureKind: null,
    message: "Skipped due to --fail-fast after an earlier failure.",
    plannedSummary: null,
    argvSnapshot: [],
  };
}

function manifestItemFromCleanOutcome(
  outcome: CleanCliOutcome,
  inputPath: string,
  resolvedOutputPath: string,
): BatchManifestItemV1 {
  if (outcome.kind === "success" && outcome.clean !== undefined) {
    const summary = outcome.clean.summary;

    return {
      inputPath,
      resolvedOutputPath,
      outcome: "success",
      maybeFailureKind: null,
      message: "",
      plannedSummary: summary,
      argvSnapshot: summary.steps.map((s) => [s.tool, s.displayCommand]),
    };
  }

  if (outcome.kind === "failure") {
    const message =
      outcome.reason.kind === "missing-tools"
        ? outcome.reason.tools.join(", ")
        : outcome.reason.message;

    return {
      inputPath,
      resolvedOutputPath,
      outcome: "failure",
      maybeFailureKind: outcome.reason.kind,
      message,
      plannedSummary: null,
      argvSnapshot: [],
    };
  }

  if (outcome.kind === "internal-error") {
    const err = outcome.error;

    return {
      inputPath,
      resolvedOutputPath,
      outcome: "failure",
      maybeFailureKind: null,
      message: err instanceof Error ? err.message : String(err),
      plannedSummary: null,
      argvSnapshot: [],
    };
  }

  return {
    inputPath,
    resolvedOutputPath,
    outcome: "success",
    maybeFailureKind: null,
    message: "",
    plannedSummary: null,
    argvSnapshot: [],
  };
}

function outcomeFromMaybeThrow(thrown: unknown): CommandOutcome {
  if (thrown instanceof Error) {
    return {
      kind: "failure",
      reason: { kind: "invalid-input", message: thrown.message },
    };
  }

  return {
    kind: "failure",
    reason: { kind: "invalid-input", message: "Invalid batch input." },
  };
}

export async function runBatchRequest(
  request: Extract<CliRequest, { kind: "batch" }>,
  deps: BatchOrchestratorDeps = {},
): Promise<
  CommandOutcome & {
    readonly batch?: BatchCliPayload;
  }
> {
  const cwd = deps.clean?.cwd ?? process.cwd();
  const outputExists =
    deps.clean?.outputExists ?? ((p: string) => existsSync(p));

  const runClean =
    deps.batch?.runClean ??
    ((input: CleanRunInput, cleanDeps?: Partial<CleanDeps>) =>
      runCleanRequest(input, cleanDeps));

  let expanded: readonly string[];

  try {
    expanded = await expandBatchInputs({
      cwd,
      inputPaths: request.inputPaths,
      globs: request.globs,
      maybeFromDir: request.maybeFromDir,
      acceptGlobRisk: request.acceptGlobRisk,
    });
  } catch (error: unknown) {
    return outcomeFromMaybeThrow(error);
  }

  if (expanded.length === 0) {
    return {
      kind: "failure",
      reason: {
        kind: "invalid-input",
        message:
          "No input files resolved. Pass --input, --glob (with --accept-glob-risk), or --from-dir.",
      },
    };
  }

  let doctorFacts: unknown | null = null;

  if (deps.discoverTools !== undefined) {
    try {
      doctorFacts = await deps.discoverTools();
    } catch (error: unknown) {
      return outcomeFromMaybeThrow(error);
    }
  }

  const maybeWhich =
    deps.clean?.maybeWhich ?? ((name: string) => Bun.which(name));
  const runProcess = deps.clean?.runProcess ?? runProcessCommand;
  const ffprobePath = maybeWhich("ffprobe");

  if (ffprobePath === null) {
    return {
      kind: "failure",
      reason: { kind: "missing-tools", tools: ["ffprobe"] },
    };
  }

  const implicitExtByResolved = new Map<string, string>();

  for (const rawInput of expanded) {
    const resolvedInputPath = canonicalBatchResolvedInputPath(cwd, rawInput);

    if (!outputExists(resolvedInputPath)) {
      return {
        kind: "failure",
        reason: {
          kind: "planning-failure",
          message: describeMissingInputPath(
            resolvedInputPath,
            resolveDidYouMeanMediaPath(resolvedInputPath),
          ),
        },
      };
    }

    const probeResult = await runFfprobeProbe({
      ffprobePath,
      inputPath: resolvedInputPath,
      runProcess,
    });

    if (!probeResult.ok) {
      return {
        kind: "failure",
        reason: {
          kind: "planning-failure",
          message: describeFfprobeFailure(probeResult.error),
        },
      };
    }

    const prelude = planMediaOutputPrelude(probeResult.value);

    if (prelude.kind === "unsupported") {
      return {
        kind: "failure",
        reason: {
          kind: "invalid-input",
          message:
            "Unsupported input for batch. Run av-denoiser inspect to review this file and confirm modality before processing.",
        },
      };
    }

    implicitExtByResolved.set(
      resolvedInputPath,
      implicitDefaultOutputExtWithDot({
        modality: prelude.modality,
        plannedContainer: prelude.plannedContainer,
        resolvedInputPath,
      }),
    );
  }

  const pairs = allocateBatchOutputPaths({
    cwd,
    orderedInputPaths: expanded,
    maybeOutputDir: request.maybeOutputDir,
    doesOutputExist: outputExists,
    force: request.force,
    getImplicitExtWithDot: (p) => {
      const hit = implicitExtByResolved.get(p);

      if (hit !== undefined) {
        return hit;
      }

      const fb = extname(p);

      return fb.length > 0 ? fb : "";
    },
  });

  const n = pairs.length;
  const items: BatchManifestItemV1[] = pairs.map((pair) =>
    manifestItemSkipped(pair.inputPath, pair.resolvedOutputPath),
  );

  const codes: ExitCodeValue[] = Array.from(
    { length: n },
    () => ExitCode.success,
  );

  const execOne = async (index: number): Promise<void> => {
    const pair = pairs[index];

    if (pair === undefined) {
      return;
    }

    const outcome = await runClean(
      {
        inputPath: pair.inputPath,
        maybeOutputPath: pair.resolvedOutputPath,
        force: request.force,
        dryRun: request.dryRun,
        json: false,
        presetId: request.presetId,
        knobs: request.knobs,
        allowVideoFallback: request.allowVideoFallback,
        acceptAudacityPipeRisk: request.acceptAudacityPipeRisk,
        maybeAudacityMacro: request.maybeAudacityMacro,
        maybeLadspa: request.maybeLadspa,
      },
      deps.clean,
    );

    codes[index] = mapOutcomeToExitCode(outcome);
    items[index] = manifestItemFromCleanOutcome(
      outcome,
      pair.inputPath,
      pair.resolvedOutputPath,
    );
  };

  if (request.failFast) {
    for (let i = 0; i < n; i++) {
      await execOne(i);

      if (codes[i] !== ExitCode.success) {
        for (let j = i + 1; j < n; j++) {
          const pair = pairs[j];

          if (pair === undefined) {
            continue;
          }

          items[j] = manifestItemSkipped(
            pair.inputPath,
            pair.resolvedOutputPath,
          );
          codes[j] = ExitCode.success;
        }

        break;
      }
    }
  } else {
    const pLimit = (await import("p-limit")).default;
    const limit = pLimit(request.concurrency);

    await Promise.all(
      Array.from({ length: n }, (_, index) => limit(() => execOne(index))),
    );
  }

  const generatedAt = new Date().toISOString();
  const document: BatchManifestDocumentV1 = {
    ...emptyBatchManifestDraft(generatedAt),
    maybeDoctorFacts: doctorFacts,
    items,
  };

  const manifestPath = resolve(
    cwd,
    request.maybeManifestPath ?? "batch-manifest.json",
  );

  await Bun.write(manifestPath, `${JSON.stringify(document, null, 2)}\n`);

  const worstExitCode = aggregateBatchExitCodes(codes);

  return {
    kind: "success",
    batch: {
      manifestPath,
      worstExitCode,
      document,
    },
  };
}
