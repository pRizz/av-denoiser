import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  pathLooksLikePythonInterpreter,
  resolveDemucsPythonForTorchcodec,
  resolveDemucsPythonFromExecutable,
} from "../../src/domain/demucs-python";

describe("pathLooksLikePythonInterpreter", () => {
  test("accepts common interpreter basenames", () => {
    expect(pathLooksLikePythonInterpreter("/opt/homebrew/bin/python3")).toBe(
      true,
    );
    expect(pathLooksLikePythonInterpreter("C:\\Python311\\python.exe")).toBe(
      true,
    );
    expect(pathLooksLikePythonInterpreter("/usr/bin/python3.12")).toBe(true);
  });

  test("rejects demucs-like names", () => {
    expect(pathLooksLikePythonInterpreter("/users/x/.local/bin/demucs")).toBe(
      false,
    );
  });
});

describe("resolveDemucsPythonFromExecutable", () => {
  test("parses absolute shebang", () => {
    const dir = mkdtempSync(join(tmpdir(), "demucs-py-"));
    const fakePy = join(dir, "fake-python");
    writeFileSync(fakePy, "#!/bin/sh\necho py\n", { mode: 0o755 });
    const demucs = join(dir, "demucs");
    writeFileSync(demucs, `#!${fakePy}\n`, { mode: 0o755 });

    expect(resolveDemucsPythonFromExecutable(demucs)).toEqual({
      kind: "ok",
      pythonPath: fakePy,
    });
  });

  test("parses env shebang via maybeWhich", () => {
    const dir = mkdtempSync(join(tmpdir(), "demucs-py-"));
    const demucs = join(dir, "demucs");
    writeFileSync(demucs, "#!/usr/bin/env python3.11\n", { mode: 0o755 });

    expect(
      resolveDemucsPythonFromExecutable(demucs, (name) =>
        name === "python3.11" ? "/x/py311" : null,
      ),
    ).toEqual({ kind: "ok", pythonPath: "/x/py311" });
  });

  test("not-available when not a script", () => {
    const dir = mkdtempSync(join(tmpdir(), "demucs-py-"));
    const bin = join(dir, "demucs");
    writeFileSync(bin, Buffer.from([0x7f, 0x45, 0x4c, 0x46]));

    expect(resolveDemucsPythonFromExecutable(bin).kind).toBe("not-available");
  });
});

describe("resolveDemucsPythonForTorchcodec", () => {
  test("uses path directly when it looks like python", () => {
    const dir = mkdtempSync(join(tmpdir(), "demucs-py-"));
    mkdirSync(join(dir, "bin"));
    const py = join(dir, "bin", "python3");
    writeFileSync(py, "", { mode: 0o755 });

    const r = resolveDemucsPythonForTorchcodec(py);
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.pythonPath).toBe(py);
    }
  });
});
