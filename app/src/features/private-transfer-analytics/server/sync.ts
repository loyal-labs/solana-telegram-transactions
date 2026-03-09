import "server-only";

import type { PrivateTransferAnalyticsCronStats } from "../types";
import { syncPrivateTransferHistory } from "./history-sync";
import { refreshPrivateTransferVaultSnapshot } from "./vault-snapshot";

export async function runPrivateTransferAnalyticsCron(): Promise<PrivateTransferAnalyticsCronStats> {
  const history = await syncPrivateTransferHistory();
  const vaults = await refreshPrivateTransferVaultSnapshot();

  return {
    history,
    vaults,
  };
}

export const runPrivateTransferAnalyticsSync = runPrivateTransferAnalyticsCron;
