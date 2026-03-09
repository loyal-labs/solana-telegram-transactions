import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";

import { fetchJson } from "@/lib/core/http";

import {
  HeliusAssetBatchLimit,
  PRIVATE_TRANSFER_MAINNET_RPC_URL,
} from "./constants";

type HeliusTokenAccountsResponse = {
  result?: {
    token_accounts?: Array<{
      address: string;
      amount: number | string;
      mint: string;
      owner: string;
    }>;
  };
};

type HeliusAsset = {
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
    };
  };
  id: string;
  token_info?: {
    decimals?: number;
    price_info?: {
      price_per_token?: number;
    };
    symbol?: string;
  };
};

let cachedMainnetConnection: Connection | null = null;

export function getPrivateTransferMainnetConnection(): Connection {
  if (cachedMainnetConnection) {
    return cachedMainnetConnection;
  }

  cachedMainnetConnection = new Connection(PRIVATE_TRANSFER_MAINNET_RPC_URL, {
    commitment: "confirmed",
  });
  return cachedMainnetConnection;
}

async function callHeliusRpc<T>(
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  return fetchJson<T>(PRIVATE_TRANSFER_MAINNET_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: method,
      method,
      params,
    }),
  });
}

export async function getTokenAccountsByOwner(owner: string): Promise<
  Array<{
    address: string;
    amountRaw: string;
    mint: string;
  }>
> {
  const response = await callHeliusRpc<HeliusTokenAccountsResponse>(
    "getTokenAccounts",
    { owner }
  );

  return (response.result?.token_accounts ?? [])
    .filter((account) => account.owner === owner)
    .map((account) => ({
      address: account.address,
      amountRaw: String(account.amount),
      mint: account.mint,
    }));
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export async function getAssetsByMint(mints: string[]): Promise<HeliusAsset[]> {
  if (mints.length === 0) {
    return [];
  }

  const results = await Promise.all(
    chunk(mints, HeliusAssetBatchLimit).map((mintChunk) =>
      callHeliusRpc<{ result?: HeliusAsset[] } | HeliusAsset[]>(
        "getAssetBatch",
        {
          ids: mintChunk,
          displayOptions: { showFungible: true },
        }
      )
    )
  );

  return results.flatMap((response) => {
    if (Array.isArray(response)) {
      return response;
    }
    return response.result ?? [];
  });
}

export async function resolveMintMetadataFallback(mint: string): Promise<{
  decimals: number;
  name: string;
  priceUsd: string | null;
  symbol: string;
}> {
  const connection = getPrivateTransferMainnetConnection();
  const mintInfo = await connection.getParsedAccountInfo(
    new PublicKey(mint),
    "confirmed"
  );
  const decimals =
    (mintInfo.value?.data as { parsed?: { info?: { decimals?: number } } })
      ?.parsed?.info?.decimals ?? 0;

  const shortMint = `${mint.slice(0, 4)}...${mint.slice(-4)}`;
  return {
    decimals,
    name: shortMint,
    priceUsd: null,
    symbol: shortMint,
  };
}

export function mapHeliusAssetToCatalogEntry(asset: HeliusAsset): {
  decimals: number | null;
  name: string;
  priceUsd: string | null;
  symbol: string;
  tokenMint: string;
} {
  const symbol =
    asset.token_info?.symbol?.trim() ||
    asset.content?.metadata?.symbol?.trim() ||
    `${asset.id.slice(0, 4)}...${asset.id.slice(-4)}`;
  const name =
    asset.content?.metadata?.name?.trim() ||
    symbol ||
    `${asset.id.slice(0, 4)}...${asset.id.slice(-4)}`;
  const decimals =
    typeof asset.token_info?.decimals === "number"
      ? asset.token_info.decimals
      : null;
  const priceUsd =
    typeof asset.token_info?.price_info?.price_per_token === "number"
      ? asset.token_info.price_info.price_per_token.toString()
      : null;

  return {
    decimals,
    name,
    priceUsd,
    symbol,
    tokenMint: asset.id,
  };
}
