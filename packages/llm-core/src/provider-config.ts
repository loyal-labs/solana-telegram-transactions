import { LlmValidationError } from "./errors";
import type { LlmProviderConfig } from "./types";

type OptionalString = string | null | undefined;

export type ResolveLlmProviderConfigParams = {
  defaults: {
    apiKey?: OptionalString;
    model: OptionalString;
  };
  overrides?: {
    apiKey?: OptionalString;
    model?: OptionalString;
  };
  provider: Omit<LlmProviderConfig, "apiKey"> & {
    apiKey?: OptionalString;
  };
};

export type ResolvedLlmProviderConfig = {
  config: LlmProviderConfig;
  model: string;
};

export function resolveLlmProviderConfig(
  params: ResolveLlmProviderConfigParams
): ResolvedLlmProviderConfig {
  const apiURL = toNonEmptyString(params.provider.apiURL);
  if (!apiURL) {
    throw new LlmValidationError("LLM provider apiURL is required", {
      field: "provider.apiURL",
    });
  }

  const defaultModel = toNonEmptyString(params.defaults.model);
  if (!defaultModel) {
    throw new LlmValidationError("LLM default model is required", {
      field: "defaults.model",
    });
  }

  const resolvedApiKey =
    toNonEmptyString(params.overrides?.apiKey) ??
    toNonEmptyString(params.provider.apiKey) ??
    toNonEmptyString(params.defaults.apiKey);

  if (!resolvedApiKey) {
    throw new LlmValidationError("LLM provider apiKey is required", {
      field: "apiKey",
    });
  }

  return {
    config: {
      apiKey: resolvedApiKey,
      apiURL,
      headers: params.provider.headers,
      name: params.provider.name,
    },
    model: toNonEmptyString(params.overrides?.model) ?? defaultModel,
  };
}

function toNonEmptyString(value: OptionalString): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized;
}
