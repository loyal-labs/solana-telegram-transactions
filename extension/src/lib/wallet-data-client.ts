import { createSolanaWalletDataClient } from "@loyal-labs/solana-wallet";
import type { SolanaEnv } from "@loyal-labs/solana-rpc";
import type { SolanaWalletDataClient } from "@loyal-labs/solana-wallet";
import type { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";

/**
 * Extension-specific version of useSolanaWalletDataClient.
 * Skips secure balance (private-transactions) since that package
 * is not available in the extension workspace.
 */
export function useExtensionWalletDataClient(
  solanaEnv: SolanaEnv,
  walletPublicKey: PublicKey | null,
): SolanaWalletDataClient {
  return useMemo(() => {
    return createSolanaWalletDataClient({
      env: solanaEnv,
      // No secureBalanceProvider — extension doesn't support PER deposits view yet
    });
  }, [solanaEnv, walletPublicKey]);
}
