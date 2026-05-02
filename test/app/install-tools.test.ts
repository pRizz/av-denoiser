import { describe, expect, test } from "bun:test";

import type { ProcessRunner } from "../../src/adapters/process-runner";
import { runInstallToolsRequest } from "../../src/app/install-tools";

describe("runInstallToolsRequest", () => {
  test("rejects non-darwin", async () => {
    const outcome = await runInstallToolsRequest(
      { dryRun: false, withOptional: false },
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
      { dryRun: true, withOptional: false },
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
      expect(outcome.message).toContain("brew install ffmpeg");
      expect(outcome.message).not.toContain("pip install");
    }
  });

  test("dry-run with optional includes demucs hint", async () => {
    const outcome = await runInstallToolsRequest(
      { dryRun: true, withOptional: true },
      {
        platform: "darwin",
        maybeWhich: () => null,
        runBrewInherit: async () => 0,
      },
    );

    expect(outcome.kind).toBe("success");
    if (outcome.kind === "success") {
      expect(outcome.message).toContain("brew install --cask audacity");
      expect(outcome.message).toContain("pip install");
    }
  });

  test("fails when brew is not on PATH", async () => {
    const outcome = await runInstallToolsRequest(
      { dryRun: false, withOptional: false },
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
    const stubRunProcess: ProcessRunner = async (cmd) => {
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

    const outcome = await runInstallToolsRequest(
      { dryRun: false, withOptional: false },
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
});
