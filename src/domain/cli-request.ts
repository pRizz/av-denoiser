export type CliRequest =
  | { readonly kind: "show-default" }
  | { readonly kind: "show-help" }
  | { readonly kind: "doctor" };

export type CliRequestResult =
  | { readonly kind: "parsed"; readonly request: CliRequest }
  | { readonly kind: "parse-error"; readonly message: string };
