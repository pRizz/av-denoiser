import type { CliRequest } from "../domain/cli-request";

const DEFAULT_GUIDANCE_LINES = [
  "av-denoiser CLI foundation is installed.",
  'Run "av-denoiser doctor" to inspect local tool readiness.',
  "Media processing commands are not available in this phase.",
];

const DOCTOR_GUIDANCE_LINES = [
  "av-denoiser doctor",
  "",
  "Doctor command routing is wired into the typed CLI request model.",
  "Detailed media tool readiness checks are not available in this phase.",
  "Media processing commands are not available in this phase.",
];

export function renderDefaultGuidance(): string {
  return DEFAULT_GUIDANCE_LINES.join("\n");
}

export function renderDoctorGuidance(): string {
  return DOCTOR_GUIDANCE_LINES.join("\n");
}

export function renderHelpGuidance(helpText: string): string {
  return [
    helpText.trimEnd(),
    "",
    "Current phase note:",
    "Media processing commands are not available in this phase.",
  ].join("\n");
}

export function renderCliRequest(
  request: CliRequest,
  helpText: string,
): string {
  switch (request.kind) {
    case "show-default":
      return renderDefaultGuidance();
    case "show-help":
      return renderHelpGuidance(helpText);
    case "doctor":
      return renderDoctorGuidance();
  }
}
