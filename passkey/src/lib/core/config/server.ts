import "server-only";

import { parsePasskeyServerConfig } from "@/lib/core/config/schema";
import type { PasskeyServerConfig } from "@/lib/core/config/types";

let cachedConfig: PasskeyServerConfig | null = null;

export function getServerConfig(): PasskeyServerConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = parsePasskeyServerConfig(process.env);

  return cachedConfig;
}

export function resetServerConfigCacheForTests(): void {
  cachedConfig = null;
}
