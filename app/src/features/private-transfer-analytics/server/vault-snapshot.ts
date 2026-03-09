import "server-only";

import { privateTransferVaultHoldings } from "@loyal-labs/db-core/schema";

import { getDatabase } from "@/lib/core/database";

import type {
  PrivateTransferVaultHoldingRow,
  PrivateTransferVaultSnapshotStats,
} from "../types";
import {
  PRIVATE_TRANSFER_PROGRAM_ID,
  PRIVATE_TRANSFER_VAULT_ACCOUNT_SPACE,
} from "./constants";
import {
  getPrivateTransferMainnetConnection,
  getTokenAccountsByOwner,
} from "./helius";
import { buildTokenCatalogUpserts, upsertTokenCatalog } from "./token-catalog";

async function loadCurrentVaultHoldings(): Promise<{
  holdings: PrivateTransferVaultHoldingRow[];
  vaultCount: number;
}> {
  const connection = getPrivateTransferMainnetConnection();
  const vaultAccounts = await connection.getProgramAccounts(
    PRIVATE_TRANSFER_PROGRAM_ID,
    {
      commitment: "confirmed",
      filters: [{ dataSize: PRIVATE_TRANSFER_VAULT_ACCOUNT_SPACE }],
    }
  );

  const holdingsByVault = await Promise.all(
    vaultAccounts.map(async (vaultAccount) => {
      const vaultAddress = vaultAccount.pubkey.toBase58();
      const tokenAccounts = await getTokenAccountsByOwner(vaultAddress);

      return tokenAccounts
        .filter((tokenAccount) => tokenAccount.amountRaw !== "0")
        .map((tokenAccount) => ({
          amountRaw: tokenAccount.amountRaw,
          snapshotAt: new Date(),
          tokenAccountAddress: tokenAccount.address,
          tokenMint: tokenAccount.mint,
          vaultAddress,
        }));
    })
  );

  return {
    holdings: holdingsByVault.flat(),
    vaultCount: vaultAccounts.length,
  };
}

export async function refreshPrivateTransferVaultSnapshot(): Promise<PrivateTransferVaultSnapshotStats> {
  const { holdings, vaultCount } = await loadCurrentVaultHoldings();
  const db = getDatabase();

  if (holdings.length > 0) {
    await db.batch([
      db.delete(privateTransferVaultHoldings),
      db.insert(privateTransferVaultHoldings).values(holdings),
    ]);
  } else {
    await db.delete(privateTransferVaultHoldings);
  }

  const tokenCatalogEntries = await buildTokenCatalogUpserts(
    holdings.map((holding) => holding.tokenMint)
  );
  const tokenCatalogUpdated = await upsertTokenCatalog(tokenCatalogEntries);

  return {
    holdingsUpserted: holdings.length,
    tokenCatalogUpdated,
    vaultsDiscovered: vaultCount,
  };
}
