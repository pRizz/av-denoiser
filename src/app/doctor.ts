import {
  discoverTools,
  type ToolDiscoveryDeps,
} from "../adapters/tool-discovery";
import type { DoctorReport } from "../domain/doctor-report";

export type DoctorDeps = Partial<ToolDiscoveryDeps>;

export async function createDoctorReport(
  deps: DoctorDeps = {},
): Promise<DoctorReport> {
  // Optional FFmpeg `ladspa` filter facts (plus Demucs python fallback, etc.) are emitted from discoverTools / tool-discovery.ts.
  return discoverTools(deps);
}
