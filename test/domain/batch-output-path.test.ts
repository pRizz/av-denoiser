import { expect, test } from "bun:test";

import { allocateBatchOutputPaths } from "../../src/domain/batch-output-path";
import { DEFAULT_OUTPUT_SUFFIX_SEGMENT } from "../../src/domain/output-path";

const cwd = "/proj";

function existsNever(): boolean {
  return false;
}

test("single input gets default avdn suffix without numeric stem tweak", () => {
  const [row] = allocateBatchOutputPaths({
    cwd,
    orderedInputPaths: ["/media/foo.wav"],
    doesOutputExist: existsNever,
    force: false,
  });

  expect(row?.resolvedOutputPath).toBe(
    `/media/foo.${DEFAULT_OUTPUT_SUFFIX_SEGMENT}.wav`,
  );
});

test("two basename collisions under output-dir get -2 before avdn segment", () => {
  const rows = allocateBatchOutputPaths({
    cwd,
    orderedInputPaths: ["/a/foo.wav", "/b/foo.wav"],
    maybeOutputDir: "/out",
    doesOutputExist: existsNever,
    force: false,
  });

  expect(rows).toHaveLength(2);
  expect(rows[0]?.resolvedOutputPath).toBe(
    `/out/foo.${DEFAULT_OUTPUT_SUFFIX_SEGMENT}.wav`,
  );
  expect(rows[1]?.resolvedOutputPath).toBe(
    `/out/foo-2.${DEFAULT_OUTPUT_SUFFIX_SEGMENT}.wav`,
  );
});

test("triple basename collision yields -3 on third output", () => {
  const rows = allocateBatchOutputPaths({
    cwd,
    orderedInputPaths: ["/x/foo.wav", "/y/foo.wav", "/z/foo.wav"],
    maybeOutputDir: "/out",
    doesOutputExist: existsNever,
    force: false,
  });

  expect(rows).toHaveLength(3);
  expect(rows[2]?.resolvedOutputPath).toBe(
    `/out/foo-3.${DEFAULT_OUTPUT_SUFFIX_SEGMENT}.wav`,
  );
});
