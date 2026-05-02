import { expect, test } from "bun:test";
import {
  type AudacityPipeRoundTripDeps,
  probeAudacityPipe,
  runAudacityMacro,
} from "../../src/adapters/audacity-pipe";
import type { AudacityPipePaths } from "../../src/domain/audacity";

test("probeAudacityPipe errors when pipe paths are missing", async () => {
  const paths: AudacityPipePaths = {
    toServerPath: "/nonexistent/pipe-to",
    fromServerPath: "/nonexistent/pipe-from",
  };

  const result = await probeAudacityPipe(paths);

  expect(result).toEqual({
    kind: "error",
    diagnostic: "pipe-unavailable",
    detail: expect.stringContaining("AUDACITY_PIPE_TO"),
  });
});

test("runAudacityMacro succeeds with mocked transport", async () => {
  const scriptLog: string[] = [];
  const responses = ["OK", "OK", "OK"];

  const transport: AudacityPipeRoundTripDeps = {
    writeLine: async (_path: string, line: string) => {
      scriptLog.push(line);
    },
    readLine: async () => {
      const next = responses.shift();

      return next ?? "";
    },
  };

  const pipes: AudacityPipePaths = {
    toServerPath: "/tmp/mock-to",
    fromServerPath: "/tmp/mock-from",
  };

  const result = await runAudacityMacro({
    macroName: "TestMacro",
    inputAudioPath: "/in.wav",
    outputAudioPath: "/out.wav",
    pipes,
    transport: {
      writeLine: transport.writeLine,
      readLine: transport.readLine,
    },
  });

  expect(result).toEqual({ kind: "ok" });
  expect(scriptLog).toEqual([
    "Import2:/in.wav",
    "Macro:TestMacro",
    "Export2:/out.wav",
  ]);
});
