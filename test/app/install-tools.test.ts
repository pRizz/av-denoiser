import { describe, expect, test } from "bun:test";

import type { ProcessRunner } from "../../src/adapters/process-runner";
import { runInstallToolsRequest } from "../../src/app/install-tools";

function brewOkRunProcess(): ProcessRunner {
  return async (cmd) => {
    if (cmd.args[0] === "--version") {
      return {
        kind: "exited",
        exitCode: 0,
        stdout: "Homebrew 4\n",
        stderr: "",
      };
    }

    return {
      kind: "exited",
      exitCode: 0,
      stdout: "",
      stderr: "",
    };
  };
}

function stubWhich(
  map: Record<string, string | null>,
): (name: string) => string | null {
  return (name: string) => map[name] ?? null;
}

describe("runInstallToolsRequest", () => {
  test("rejects non-darwin", async () => {
    const outcome = await runInstallToolsRequest(
      { dryRun: false, includeOptional: false, assumeYes: false },
      {
        platform: "linux",
        maybeWhich: () => null,
        runBrewInherit: async () => 0,
      },
    );

    expect(outcome.kind).toBe("failure");
    if (outcome.kind === "failure") {
      expect(outcome.reason.kind).toBe("invalid-input");
      if (outcome.reason.kind === "invalid-input") {
        expect(outcome.reason.message).toContain("macOS");
      }
    }
  });

  test("dry-run does not invoke brew or require brew on PATH", async () => {
    let brewCalls = 0;

    const outcome = await runInstallToolsRequest(
      { dryRun: true, includeOptional: false, assumeYes: false },
      {
        platform: "darwin",
        maybeWhich: () => null,
        runBrewInherit: async () => {
          brewCalls += 1;

          return 0;
        },
      },
    );

    expect(brewCalls).toBe(0);
    expect(outcome.kind).toBe("success");
    if (outcome.kind === "success") {
      expect(outcome.message).toContain("--dry-run");
      expect(outcome.message).toContain("brew install ffmpeg uv");
      expect(outcome.message).not.toContain("pip install");
      expect(outcome.message).toContain("Homebrew installs include `uv`");
    }
  });

  test("dry-run with optional includes demucs hint and uv automation summary", async () => {
    const outcome = await runInstallToolsRequest(
      { dryRun: true, includeOptional: true, assumeYes: false },
      {
        platform: "darwin",
        maybeWhich: () => null,
        runBrewInherit: async () => 0,
      },
    );

    expect(outcome.kind).toBe("success");
    if (outcome.kind === "success") {
      expect(outcome.message).toContain("brew install --cask audacity");
      expect(outcome.message).toContain("brew install ffmpeg");
      expect(outcome.message).toContain("uv");
      expect(outcome.message).toContain("uv tool install demucs");
      expect(outcome.message).not.toContain("pipx");
    }
  });

  test("fails when brew is not on PATH", async () => {
    const outcome = await runInstallToolsRequest(
      { dryRun: false, includeOptional: false, assumeYes: false },
      {
        platform: "darwin",
        maybeWhich: () => null,
        runBrewInherit: async () => 0,
      },
    );

    expect(outcome.kind).toBe("failure");
    if (outcome.kind === "failure") {
      expect(outcome.reason.kind).toBe("invalid-input");
      if (outcome.reason.kind === "invalid-input") {
        expect(outcome.reason.message).toContain("Homebrew");
      }
    }
  });

  test("propagates brew install non-zero exit", async () => {
    const stubRunProcess = brewOkRunProcess();

    const outcome = await runInstallToolsRequest(
      { dryRun: false, includeOptional: false, assumeYes: false },
      {
        platform: "darwin",
        maybeWhich: (name) =>
          name === "brew" ? "/opt/homebrew/bin/brew" : null,
        runBrewInherit: async () => 1,
        runProcess: stubRunProcess,
      },
    );

    expect(outcome.kind).toBe("failure");
    if (outcome.kind === "failure") {
      expect(outcome.reason.kind).toBe("processing-failure");
      if (outcome.reason.kind === "processing-failure") {
        expect(outcome.reason.message).toContain("Homebrew formulae");
      }
    }
  });

  test("ffmpeg-only tier fails when uv missing after brew", async () => {
    const outcome = await runInstallToolsRequest(
      { dryRun: false, includeOptional: false, assumeYes: false },
      {
        platform: "darwin",
        maybeWhich: stubWhich({
          brew: "/opt/homebrew/bin/brew",
          uv: null,
        }),
        runBrewInherit: async () => 0,
        runProcess: brewOkRunProcess(),
      },
    );

    expect(outcome.kind).toBe("failure");
    if (outcome.kind === "failure") {
      expect(outcome.reason.kind).toBe("missing-tools");
      if (outcome.reason.kind === "missing-tools") {
        expect(outcome.reason.tools).toEqual(["uv"]);
      }
    }
  });

  test("ffmpeg-only tier succeeds when uv on PATH after brew", async () => {
    const outcome = await runInstallToolsRequest(
      { dryRun: false, includeOptional: false, assumeYes: false },
      {
        platform: "darwin",
        maybeWhich: stubWhich({
          brew: "/opt/homebrew/bin/brew",
          uv: "/opt/homebrew/bin/uv",
        }),
        runBrewInherit: async () => 0,
        runProcess: brewOkRunProcess(),
      },
    );

    expect(outcome.kind).toBe("success");
  });

  test("full tier non-TTY without assumeYes skips Demucs automation and keeps manual hint", async () => {
    let demucsStepCalls = 0;

    const outcome = await runInstallToolsRequest(
      { dryRun: false, includeOptional: true, assumeYes: false },
      {
        platform: "darwin",
        maybeWhich: stubWhich({
          brew: "/opt/homebrew/bin/brew",
          uv: "/opt/homebrew/bin/uv",
        }),
        runBrewInherit: async () => 0,
        runProcess: brewOkRunProcess(),
        isTTY: false,
        confirmDemucsPip: async () => {
          throw new Error("should not prompt when non-TTY");
        },
        runPythonPipInherit: async () => {
          demucsStepCalls += 1;

          return 0;
        },
      },
    );

    expect(demucsStepCalls).toBe(0);
    expect(outcome.kind).toBe("success");
    if (outcome.kind === "success") {
      expect(outcome.message).toContain("uv tool install");
      expect(outcome.message).toContain("Demucs");
      expect(outcome.message).not.toContain("installed via uv");
    }
  });

  test("full tier non-TTY with assumeYes runs uv tool install demucs", async () => {
    const calls: string[][] = [];

    const outcome = await runInstallToolsRequest(
      { dryRun: false, includeOptional: true, assumeYes: true },
      {
        platform: "darwin",
        maybeWhich: stubWhich({
          brew: "/opt/homebrew/bin/brew",
          uv: "/opt/homebrew/bin/uv",
        }),
        runBrewInherit: async () => 0,
        runProcess: brewOkRunProcess(),
        isTTY: false,
        runPythonPipInherit: async (argv) => {
          calls.push([...argv]);

          return 0;
        },
      },
    );

    expect(outcome.kind).toBe("success");
    expect(calls).toEqual([
      ["/opt/homebrew/bin/uv", "tool", "install", "demucs"],
    ]);
    if (outcome.kind === "success") {
      expect(outcome.message).toContain("uv tool install demucs");
    }
  });

  test("full tier assumeYes fails when uv missing after brew", async () => {
    const outcome = await runInstallToolsRequest(
      { dryRun: false, includeOptional: true, assumeYes: true },
      {
        platform: "darwin",
        maybeWhich: stubWhich({
          brew: "/opt/homebrew/bin/brew",
          uv: null,
        }),
        runBrewInherit: async () => 0,
        runProcess: brewOkRunProcess(),
        isTTY: false,
      },
    );

    expect(outcome.kind).toBe("failure");
    if (outcome.kind === "failure") {
      expect(outcome.reason.kind).toBe("missing-tools");
    }
  });

  test("full tier Demucs step non-zero yields processing failure with PEP 668 hints", async () => {
    const outcome = await runInstallToolsRequest(
      { dryRun: false, includeOptional: true, assumeYes: true },
      {
        platform: "darwin",
        maybeWhich: stubWhich({
          brew: "/opt/homebrew/bin/brew",
          uv: "/opt/homebrew/bin/uv",
        }),
        runBrewInherit: async () => 0,
        runProcess: brewOkRunProcess(),
        isTTY: false,
        runPythonPipInherit: async () => 7,
      },
    );

    expect(outcome.kind).toBe("failure");
    if (outcome.kind === "failure") {
      expect(outcome.reason.kind).toBe("processing-failure");
      if (outcome.reason.kind === "processing-failure") {
        expect(outcome.reason.message).toContain("exit 7");
        expect(outcome.reason.message).toContain("PEP 668");
        expect(outcome.reason.message).toContain("uv tool install");
      }
    }
  });

  test("full tier TTY confirm false skips Demucs automation and keeps manual hint", async () => {
    let demucsStepCalls = 0;

    const outcome = await runInstallToolsRequest(
      { dryRun: false, includeOptional: true, assumeYes: false },
      {
        platform: "darwin",
        maybeWhich: stubWhich({
          brew: "/opt/homebrew/bin/brew",
          uv: "/opt/homebrew/bin/uv",
        }),
        runBrewInherit: async () => 0,
        runProcess: brewOkRunProcess(),
        isTTY: true,
        confirmDemucsPip: async () => false,
        runPythonPipInherit: async () => {
          demucsStepCalls += 1;

          return 0;
        },
      },
    );

    expect(demucsStepCalls).toBe(0);
    expect(outcome.kind).toBe("success");
    if (outcome.kind === "success") {
      expect(outcome.message).toContain("uv tool install");
    }
  });

  test("full tier TTY confirm true runs Demucs automation", async () => {
    let demucsStepCalls = 0;

    const outcome = await runInstallToolsRequest(
      { dryRun: false, includeOptional: true, assumeYes: false },
      {
        platform: "darwin",
        maybeWhich: stubWhich({
          brew: "/opt/homebrew/bin/brew",
          uv: "/opt/homebrew/bin/uv",
        }),
        runBrewInherit: async () => 0,
        runProcess: brewOkRunProcess(),
        isTTY: true,
        confirmDemucsPip: async () => true,
        runPythonPipInherit: async () => {
          demucsStepCalls += 1;

          return 0;
        },
      },
    );

    expect(demucsStepCalls).toBe(1);
    expect(outcome.kind).toBe("success");
    if (outcome.kind === "success") {
      expect(outcome.message).toContain("uv");
    }
  });
});
