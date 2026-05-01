import type { CliRequest } from "../domain/cli-request";
import type { CommandOutcome } from "../domain/command-outcome";
import {
  type DoctorReport,
  doctorReportToOutcome,
} from "../domain/doctor-report";
import { createDoctorReport } from "./doctor";

export type CliCommandOutcome = CommandOutcome & {
  readonly doctorReport?: DoctorReport;
};

export type CliRequestDeps = {
  readonly discoverTools?: () => Promise<DoctorReport>;
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
  }
}
