import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { resolveDidYouMeanMediaPath } from "../../src/domain/input-path-hint";

test("resolveDidYouMeanMediaPath suggests sibling file sharing bracket id", () => {
  const dir = mkdtempSync(join(tmpdir(), "avdn-hint-"));
  try {
    writeFileSync(join(dir, "Correct Name! [999].mp4"), "");
    const wrongPath = join(dir, "Wrong Name [999].mp4");

    expect(resolveDidYouMeanMediaPath(wrongPath)).toBe(
      join(dir, "Correct Name! [999].mp4"),
    );
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("resolveDidYouMeanMediaPath returns null when bracket id absent", () => {
  const dir = mkdtempSync(join(tmpdir(), "avdn-hint-"));
  try {
    writeFileSync(join(dir, "a.mp4"), "");

    expect(resolveDidYouMeanMediaPath(join(dir, "missing.mp4"))).toBe(null);
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("resolveDidYouMeanMediaPath returns null when directory missing", () => {
  expect(resolveDidYouMeanMediaPath("/no/such/dir/video [123].mp4")).toBe(null);
});
