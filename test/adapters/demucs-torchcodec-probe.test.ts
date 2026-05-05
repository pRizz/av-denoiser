import { describe, expect, test } from "bun:test";

import { probeTorchcodecImportWithPython } from "../../src/adapters/demucs-torchcodec-probe";
import type { ProcessRunner } from "../../src/adapters/process-runner";

describe("probeTorchcodecImportWithPython", () => {
  test("maps exit 0 to available", async () => {
    const run: ProcessRunner = async () => ({
      kind: "exited",
      exitCode: 0,
      stdout: "",
      stderr: "",
    });

    expect(await probeTorchcodecImportWithPython("/fake/python", run)).toEqual({
      kind: "available",
    });
  });

  test("maps non-zero exit to missing with trimmed stderr", async () => {
    const run: ProcessRunner = async () => ({
      kind: "exited",
      exitCode: 1,
      stdout: "",
      stderr: "ModuleNotFoundError: No module named 'torchcodec'\n",
    });

    const r = await probeTorchcodecImportWithPython("/py", run);
    expect(r.kind).toBe("missing");
    if (r.kind === "missing") {
      expect(r.detail).toContain("torchcodec");
    }
  });
});
