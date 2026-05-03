import { expect, test } from "bun:test";
import { basename } from "node:path";

import {
  canonicalInputPath,
  DEFAULT_OUTPUT_SUFFIX_SEGMENT,
  defaultOutputPathBesideInput,
  resolveOutputPath,
} from "../../src/domain/output-path";

test("resolveOutputPath with implicitOutputExtWithDot yields stem.avdn.mp4 for .mov inputs", () => {
  const cwd = "/proj";

  const result = resolveOutputPath({
    cwd,
    inputPath: "clip.mov",
    force: false,
    implicitOutputExtWithDot: ".mp4",
    doesOutputExist: () => false,
  });

  expect(result.kind).toBe("ok");
  if (result.kind !== "ok") {
    return;
  }

  expect(basename(result.resolvedOutputPath)).toBe(
    `clip.${DEFAULT_OUTPUT_SUFFIX_SEGMENT}.mp4`,
  );
});

test("implicitOutputExtWithDot malformed string falls back to input suffix", () => {
  const p = defaultOutputPathBesideInput("/proj/clip.mov", {
    implicitExtWithDot: "mp4",
  });

  expect(basename(p)).toBe(`clip.${DEFAULT_OUTPUT_SUFFIX_SEGMENT}.mov`);
});

test("defaultOutputPathBesideInput honors implicitExtWithDot", () => {
  expect(basename(defaultOutputPathBesideInput("/x/y/foo.mov", {}))).toContain(
    `.${DEFAULT_OUTPUT_SUFFIX_SEGMENT}.mov`,
  );
  expect(
    basename(
      defaultOutputPathBesideInput("/x/y/foo.mov", {
        implicitExtWithDot: ".mp4",
      }),
    ),
  ).toBe(`foo.${DEFAULT_OUTPUT_SUFFIX_SEGMENT}.mp4`);
});

test("canonicalInputPath trims accidental whitespace from pasted paths", () => {
  expect(canonicalInputPath("/proj", "  clip.m4a  ")).toBe("/proj/clip.m4a");
});

test("resolveOutputPath derives clip.avdn.m4a from clip.m4a", () => {
  // Arrange
  const cwd = "/proj";

  // Act
  const result = resolveOutputPath({
    cwd,
    inputPath: "clip.m4a",
    force: false,
    doesOutputExist: () => false,
  });

  // Assert
  expect(result.kind).toBe("ok");
  if (result.kind !== "ok") {
    return;
  }

  expect(result.resolvedOutputPath).toContain(
    `.${DEFAULT_OUTPUT_SUFFIX_SEGMENT}.`,
  );
  expect(result.resolvedOutputPath).toContain(".m4a");
});

test("resolveOutputPath rejects output-equals-input", () => {
  // Arrange
  const cwd = "/proj";

  // Act
  const result = resolveOutputPath({
    cwd,
    inputPath: "/proj/wav.wav",
    maybeExplicitOutput: "/proj/wav.wav",
    force: false,
    doesOutputExist: () => false,
  });

  // Assert
  expect(result.kind).toBe("output-equals-input");
});

test("resolveOutputPath rejects output-exists without force", () => {
  // Arrange
  const cwd = "/proj";

  // Act
  const result = resolveOutputPath({
    cwd,
    inputPath: "a.wav",
    maybeExplicitOutput: "out.wav",
    force: false,
    doesOutputExist: () => true,
  });

  // Assert
  expect(result.kind).toBe("output-exists");
});

test("resolveOutputPath allows overwrite when force is true", () => {
  // Arrange
  const cwd = "/proj";

  // Act
  const result = resolveOutputPath({
    cwd,
    inputPath: "a.wav",
    maybeExplicitOutput: "out.wav",
    force: true,
    doesOutputExist: () => true,
  });

  // Assert
  expect(result.kind).toBe("ok");
});
