import { DEFAULT_FORM_OPTIONS, FormOptions } from "@/types";

declare global {
  // eslint-disable-next-line no-var
  var _fallbackFormOptions: FormOptions | undefined;
}

const fallbackFormOptions = global._fallbackFormOptions ?? {
  reasons: [...DEFAULT_FORM_OPTIONS.reasons],
  sources: [...DEFAULT_FORM_OPTIONS.sources]
};

if (!global._fallbackFormOptions) {
  global._fallbackFormOptions = fallbackFormOptions;
}

export function getFallbackFormOptions(): FormOptions {
  return {
    reasons: [...fallbackFormOptions.reasons],
    sources: [...fallbackFormOptions.sources]
  };
}

export function setFallbackFormOptions(options: FormOptions) {
  fallbackFormOptions.reasons = Array.isArray(options.reasons) ? options.reasons : [];
  fallbackFormOptions.sources = Array.isArray(options.sources) ? options.sources : [];
}
