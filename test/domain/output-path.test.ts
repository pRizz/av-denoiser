import { expect, test } from "bun:test";

import {
  canonicalInputPath,
  DEFAULT_OUTPUT_SUFFIX_SEGMENT,
  resolveOutputPath,
} from "../../src/domain/output-path";

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
