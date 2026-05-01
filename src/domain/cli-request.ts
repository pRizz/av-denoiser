export type CliRequest =
  | { readonly kind: "show-default" }
  | { readonly kind: "show-help" }
  | { readonly kind: "doctor" }
  | {
      readonly kind: "inspect";
      readonly inputPath: string;
      readonly maybeOutputPath?: string;
      readonly force: boolean;
      readonly json: boolean;
    };

export type CliRequestResult =
  | { readonly kind: "parsed"; readonly request: CliRequest }
  | { readonly kind: "parse-error"; readonly message: string };
