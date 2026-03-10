import type { SessionKey, SessionKeyBackend } from "@sqds/grid";

import { getGridBrowserSdkClient } from "@/lib/passkeys/grid-browser-sdk";

export function toSessionKeyObject(
  sessionKey: string,
  expirationInSeconds: number
): SessionKey {
  return getGridBrowserSdkClient().getSessionKeyObject(
    sessionKey,
    String(expirationInSeconds)
  );
}

export function toSessionKeyBackendObject(
  sessionKey: string,
  expirationInSeconds: number
): SessionKeyBackend {
  return getGridBrowserSdkClient().getSessionKeyObject(
    sessionKey,
    String(expirationInSeconds)
  );
}
