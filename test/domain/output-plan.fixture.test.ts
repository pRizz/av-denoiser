import { expect, test } from "bun:test";

import type { MediaProbe } from "../../src/domain/media-probe";
import { planMediaOutput } from "../../src/domain/output-plan";

const fixtureDir = `${import.meta.dir}/../fixtures/ffprobe`;

function pathOk(input: string, output: string) {
  return {
    kind: "ok" as const,
    resolvedInputPath: input,
    resolvedOutputPath: output,
  };
}

async function loadFixture(filename: string): Promise<MediaProbe> {
  const text = await Bun.file(`${fixtureDir}/${filename}`).text();

  return JSON.parse(text) as MediaProbe;
}

test("fixture minimal-video-vp9-webm-matrix.json yields VP9 WebM copy-safe plan", async () => {
  const probe = await loadFixture("minimal-video-vp9-webm-matrix.json");
  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.webm", "/out.avdn.webm"),
  });

  expect(plan.modality).toBe("video-copy-safe");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.plannedContainer).toBe("webm");
  expect(plan.reasonCodes[0]).toBe("video-copy-vp9-webm-v1");
});

test("fixture minimal-video-theora-matroska-matrix.json yields Theora MKV copy-safe plan", async () => {
  const probe = await loadFixture("minimal-video-theora-matroska-matrix.json");
  const plan = planMediaOutput({
    probe,
    pathOutcome: pathOk("/in.ogv", "/out.avdn.mkv"),
  });

  expect(plan.modality).toBe("video-copy-safe");
  if (plan.modality === "unsupported") {
    return;
  }

  expect(plan.plannedContainer).toBe("matroska");
  expect(plan.reasonCodes[0]).toBe("video-copy-theora-matroska-v1");
});
