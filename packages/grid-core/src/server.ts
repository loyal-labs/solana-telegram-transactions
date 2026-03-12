import { GridClient } from "@sqds/grid";

import type { GridServerRuntimeConfig } from "./types";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function resolveGridServerClientConfig(config: GridServerRuntimeConfig) {
  const resolved = {
    environment: config.environment,
    ...(config.apiKey ? { apiKey: config.apiKey } : {}),
  };

  if (!config.baseUrl) {
    return resolved;
  }

  return {
    ...resolved,
    baseUrl: trimTrailingSlash(config.baseUrl),
  };
}

export function createGridServerClient(config: GridServerRuntimeConfig): GridClient {
  return new GridClient(resolveGridServerClientConfig(config));
}
