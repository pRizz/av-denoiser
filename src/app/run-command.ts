import type { CliRequest } from "../domain/cli-request";
import type { CommandOutcome } from "../domain/command-outcome";
import {
  type DoctorReport,
  doctorReportToOutcome,
} from "../domain/doctor-report";
import { createDoctorReport } from "./doctor";
import {
  type InspectCliSuccess,
  type InspectDeps,
  runInspectRequest,
} from "./inspect";

export type CliCommandOutcome = CommandOutcome & {
  readonly doctorReport?: DoctorReport;
  readonly inspect?: InspectCliSuccess;
};

export type CliRequestDeps = {
  readonly discoverTools?: () => Promise<DoctorReport>;
  readonly inspect?: Partial<InspectDeps>;
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
    case "inspect":
      return runInspectRequest(request, deps.inspect);
  }
}
