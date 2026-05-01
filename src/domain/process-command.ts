export type ProcessCommand = {
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly timeoutMs?: number;
  readonly stdin?: "ignore";
};

export type ProcessCommandInput = {
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly timeoutMs?: number;
  readonly stdin?: "ignore";
};

export type ProcessCommandInvalidReason = {
  readonly kind: "empty-executable";
};

export type ProcessCommandResult =
  | { readonly kind: "created"; readonly command: ProcessCommand }
  | { readonly kind: "invalid"; readonly reason: ProcessCommandInvalidReason };

/** Creates an argv-array process command; shell command strings are intentionally unsupported. */
export function createProcessCommand(
  input: ProcessCommandInput,
): ProcessCommandResult {
  const executable = input.executable.trim();

  if (executable.length === 0) {
    return { kind: "invalid", reason: { kind: "empty-executable" } };
  }

  return {
    kind: "created",
    command: {
      executable,
      args: [...input.args],
      ...(input.cwd === undefined ? {} : { cwd: input.cwd }),
      ...(input.env === undefined ? {} : { env: { ...input.env } }),
      ...(input.timeoutMs === undefined ? {} : { timeoutMs: input.timeoutMs }),
      ...(input.stdin === undefined ? {} : { stdin: input.stdin }),
    },
  };
}

/** Renders a command for diagnostics only; do not feed this string to a shell. */
export function renderDisplayCommand(command: ProcessCommand): string {
  return [command.executable, ...command.args].map(quoteForDisplay).join(" ");
}

function quoteForDisplay(value: string): string {
  if (value.length === 0) {
    return "''";
  }

  if (/^[A-Za-z0-9_./:=@%+-]+$/.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", "'\\''")}'`;
}
