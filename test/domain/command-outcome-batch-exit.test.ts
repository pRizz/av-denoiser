import { expect, test } from "bun:test";

import { aggregateBatchExitCodes } from "../../src/domain/command-outcome";
import { ExitCode } from "../../src/domain/exit-codes";

test("aggregateBatchExitCodes returns 0 for empty", () => {
  expect(aggregateBatchExitCodes([])).toBe(ExitCode.success);
});

test("aggregateBatchExitCodes returns max of mixed codes", () => {
  expect(
    aggregateBatchExitCodes([
      ExitCode.processingFailure,
      ExitCode.invalidInput,
    ]),
  ).toBe(ExitCode.processingFailure);
});

test("aggregateBatchExitCodes returns 0 when all success", () => {
  expect(aggregateBatchExitCodes([ExitCode.success, ExitCode.success])).toBe(
    ExitCode.success,
  );
});
