import "server-only";

import { privateTransferVaultHoldings } from "@loyal-labs/db-core/schema";
import { lt } from "drizzle-orm";

import { getDatabase } from "@/lib/core/database";

import type {
  PrivateTransferVaultHoldingRow,
  PrivateTransferVaultSnapshotStats,
} from "../types";
import { getPrivateMainnetConnection } from "./connection";
import {
  PRIVATE_TRANSFER_PROGRAM_ID,
  PRIVATE_TRANSFER_VAULT_ACCOUNT_SPACE,
  RPC_CONCURRENCY_LIMIT,
} from "./constants";
import {
  getTokenAccountsByOwner,
  mapWithConcurrency,
} from "./helius";
import { buildTokenCatalogUpserts, upsertTokenCatalog } from "./token-catalog";

async function loadCurrentVaultHoldings(): Promise<{
  holdings: PrivateTransferVaultHoldingRow[];
  vaultCount: number;
}> {
  const connection = getPrivateMainnetConnection();
  const vaultAccounts = await connection.getProgramAccounts(
    PRIVATE_TRANSFER_PROGRAM_ID,
    {
      commitment: "confirmed",
      filters: [{ dataSize: PRIVATE_TRANSFER_VAULT_ACCOUNT_SPACE }],
    }
  );

  const holdingsByVault = await mapWithConcurrency(
    vaultAccounts,
    RPC_CONCURRENCY_LIMIT,
    async (vaultAccount) => {
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
    }
  );

  return {
    holdings: holdingsByVault.flat(),
    vaultCount: vaultAccounts.length,
  };
}

export async function refreshPrivateTransferVaultSnapshot(): Promise<PrivateTransferVaultSnapshotStats> {
  const { holdings, vaultCount } = await loadCurrentVaultHoldings();
  const db = getDatabase();

  const snapshotAt = new Date();

  if (holdings.length > 0) {
    const taggedHoldings = holdings.map((h) => ({ ...h, snapshotAt }));
    await db.insert(privateTransferVaultHoldings).values(taggedHoldings);
    await db
      .delete(privateTransferVaultHoldings)
      .where(lt(privateTransferVaultHoldings.snapshotAt, snapshotAt));
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
