import type { GridClient } from "@sqds/grid";
import { createGridServerClient } from "@loyal-labs/grid-core/server";

import { getServerConfig } from "@/lib/core/config/server";

let cachedGridClient: GridClient | null = null;

export function getGridServerClient(): GridClient {
  if (cachedGridClient) {
    return cachedGridClient;
  }

  const config = getServerConfig();
  cachedGridClient = createGridServerClient({
    environment: config.gridEnvironment,
    baseUrl: config.gridApiBaseUrl,
    apiKey: config.gridApiKey,
  });

  return cachedGridClient;
}

export function resetGridServerClientForTests(): void {
  cachedGridClient = null;
}
