import { z } from "zod";

const dispositionSchema = z
  .object({
    default: z.number().optional(),
  })
  .passthrough();

const ffprobeStreamSchema = z
  .object({
    index: z.number(),
    codec_type: z.string(),
    codec_name: z.string(),
    disposition: dispositionSchema.optional(),
    channels: z.union([z.number(), z.string()]).optional(),
    sample_rate: z.string().optional(),
  })
  .passthrough();

const ffprobeFormatSchema = z
  .object({
    duration: z.string().optional(),
  })
  .passthrough();

const ffprobeRootSchema = z.object({
  streams: z.array(ffprobeStreamSchema),
  format: ffprobeFormatSchema.optional(),
});

export type MediaProbe = z.infer<typeof ffprobeRootSchema>;

export type FfprobeParseError =
  | { readonly kind: "invalid-json" }
  | {
      readonly kind: "schema-mismatch";
      readonly message: string;
    };

export type ParseFfprobeJsonResult =
  | { readonly ok: true; readonly value: MediaProbe }
  | { readonly ok: false; readonly error: FfprobeParseError };

/** Parses FFprobe JSON emitted with `-print_format json -show_format -show_streams`. */
export function parseFfprobeJson(raw: string): ParseFfprobeJsonResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: { kind: "invalid-json" } };
  }

  const result = ffprobeRootSchema.safeParse(parsed);

  if (!result.success) {
    return {
      ok: false,
      error: {
        kind: "schema-mismatch",
        message: result.error.message,
      },
    };
  }

  return { ok: true, value: result.data };
}
