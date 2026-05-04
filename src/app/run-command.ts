import type { CliRequest } from "../domain/cli-request";
import type { CommandOutcome } from "../domain/command-outcome";
import {
  type DoctorReport,
  doctorReportToOutcome,
} from "../domain/doctor-report";
import {
  type BatchCliPayload,
  type BatchOrchestratorDeps,
  runBatchRequest,
} from "./batch";
import { type CleanCliSuccess, type CleanDeps, runCleanRequest } from "./clean";
import { createDoctorReport } from "./doctor";
import { type GuidedCleanDeps, runGuidedCleanRequest } from "./guided-clean";
import {
  type InspectCliSuccess,
  type InspectDeps,
  runInspectRequest,
} from "./inspect";
import { type InstallToolsDeps, runInstallToolsRequest } from "./install-tools";

export type CliCommandOutcome = CommandOutcome & {
  readonly doctorReport?: DoctorReport;
  readonly inspect?: InspectCliSuccess;
  readonly clean?: CleanCliSuccess;
  readonly guidedHumanSummary?: string;
  readonly batch?: BatchCliPayload;
};

export type CliRequestDeps = {
  readonly discoverTools?: () => Promise<DoctorReport>;
  readonly inspect?: Partial<InspectDeps>;
  readonly clean?: Partial<CleanDeps>;
  readonly guided?: Partial<GuidedCleanDeps>;
  readonly batch?: BatchOrchestratorDeps["batch"];
  readonly installTools?: Partial<InstallToolsDeps>;
};

export async function runCliRequest(
  request: CliRequest,
  deps: CliRequestDeps = {},
): Promise<CliCommandOutcome> {
  switch (request.kind) {
    case "show-default":
    case "show-help":
      return { kind: "success" };
    case "doctor": {
      const report = await (deps.discoverTools ?? createDoctorReport)();
      const outcome = doctorReportToOutcome(report);

      return { ...outcome, doctorReport: report };
    }
    case "install-tools":
      return runInstallToolsRequest(
        {
          dryRun: request.dryRun,
          includeOptional: request.includeOptional,
          assumeYes: request.assumeYes,
        },
        deps.installTools,
      );
    case "inspect":
      return runInspectRequest(request, deps.inspect);
    case "guided-clean":
      return runGuidedCleanRequest({
        ...deps.guided,
        runClean: (input, partialCleanDeps) =>
          runCleanRequest(input, { ...deps.clean, ...partialCleanDeps }),
      });
    case "clean":
      return runCleanRequest(
        {
          inputPath: request.inputPath,
          maybeOutputPath: request.maybeOutputPath,
          force: request.force,
          dryRun: request.dryRun,
          json: request.json,
          presetId: request.presetId,
          knobs: request.knobs,
          allowVideoReencode: request.allowVideoReencode,
          acceptAudacityPipeRisk: request.acceptAudacityPipeRisk,
          maybeAudacityMacro: request.maybeAudacityMacro,
          maybeLadspa: request.maybeLadspa,
        },
        deps.clean,
      );
    case "batch":
      return runBatchRequest(request, {
        discoverTools: deps.discoverTools ?? createDoctorReport,
        clean: deps.clean,
        batch: deps.batch,
      });
  }
}
