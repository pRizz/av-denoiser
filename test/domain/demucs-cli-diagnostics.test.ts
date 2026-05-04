import { describe, expect, test } from "bun:test";
import { formatDemucsFailureSnippet } from "../../src/domain/demucs-cli-diagnostics";

describe("formatDemucsFailureSnippet", () => {
  test("strips tqdm-style lines and keeps traceback tail", () => {
    const stderr = [
      "0%|…| 0/100 [00:00<?, ?it/s]",
      "Traceback (most recent call last):",
      '  File "x.py", line 1, in <module>',
      "RuntimeError: CUDA out of memory",
    ].join("\n");

    const out = formatDemucsFailureSnippet(stderr, "", 500);

    expect(out).toContain("RuntimeError");
    expect(out).not.toContain("0%|");
  });

  test("includes stdout tail when stderr is only progress noise", () => {
    const stderr = "12%|████      | 1.5/10.0 [00:01<00:08, 1.2s/it]";
    const out = formatDemucsFailureSnippet(
      stderr,
      "Using device: cuda\nError: model checkpoint missing",
      400,
    );

    expect(out).toContain("stdout:");
    expect(out).toContain("checkpoint missing");
  });
});
