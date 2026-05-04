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
import {
  type DenoiseCliSuccess,
  type DenoiseDeps,
  runDenoiseRequest,
} from "./denoise";
import { createDoctorReport } from "./doctor";
import {
  type GuidedDenoiseDeps,
  runGuidedDenoiseRequest,
} from "./guided-denoise";
import {
  type InspectCliSuccess,
  type InspectDeps,
  runInspectRequest,
} from "./inspect";
import { type InstallToolsDeps, runInstallToolsRequest } from "./install-tools";

export type CliCommandOutcome = CommandOutcome & {
  readonly doctorReport?: DoctorReport;
  readonly inspect?: InspectCliSuccess;
  readonly denoise?: DenoiseCliSuccess;
  readonly guidedHumanSummary?: string;
  readonly batch?: BatchCliPayload;
};

export type CliRequestDeps = {
  readonly discoverTools?: () => Promise<DoctorReport>;
  readonly inspect?: Partial<InspectDeps>;
  readonly denoise?: Partial<DenoiseDeps>;
  readonly guided?: Partial<GuidedDenoiseDeps>;
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
    case "guided-denoise":
      return runGuidedDenoiseRequest({
        ...deps.guided,
        runDenoise: (input, partialDenoiseDeps) =>
          runDenoiseRequest(input, { ...deps.denoise, ...partialDenoiseDeps }),
      });
    case "denoise":
      return runDenoiseRequest(
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
        deps.denoise,
      );
    case "batch":
      return runBatchRequest(request, {
        discoverTools: deps.discoverTools ?? createDoctorReport,
        denoise: deps.denoise,
        batch: deps.batch,
      });
  }
}
