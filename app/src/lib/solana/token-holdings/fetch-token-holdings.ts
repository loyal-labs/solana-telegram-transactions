import { PublicKey } from "@solana/web3.js";

import { fetchJson } from "../../core/http";
import { getSolanaEnv } from "../rpc/connection";
import { SECURE_DEVNET_RPC_URL, SECURE_MAINNET_RPC_URL } from "../rpc/constants";
import { CACHE_TTL_MS, NATIVE_SOL_DECIMALS, NATIVE_SOL_MINT } from "./constants";
import type {
  CachedHoldings,
  HeliusAsset,
  HeliusNativeBalance,
  HeliusResponse,
  TokenHolding,
} from "./types";

const holdingsCache = new Map<string, CachedHoldings>();
const inflightRequests = new Map<string, Promise<TokenHolding[]>>();

function isCacheValid(cached: CachedHoldings | undefined): boolean {
  if (!cached) return false;
  return Date.now() - cached.fetchedAt < CACHE_TTL_MS;
}

function getRpcUrl(): string | null {
  const env = getSolanaEnv();
  if (env === "mainnet") return SECURE_MAINNET_RPC_URL;
  if (env === "devnet") return SECURE_DEVNET_RPC_URL;
  return null;
}

function mapAssetToHolding(asset: HeliusAsset): TokenHolding | null {
  const tokenInfo = asset.token_info;
  if (!tokenInfo) return null;

  const { symbol, balance, decimals, price_info } = tokenInfo;

  return {
    mint: asset.id,
    symbol,
    name: asset.content?.metadata?.name ?? symbol,
    balance: balance / Math.pow(10, decimals),
    decimals,
    priceUsd: price_info?.price_per_token ?? null,
    valueUsd: price_info?.total_price ?? null,
    imageUrl: asset.content?.links?.image ?? null,
  };
}

function mapNativeBalance(nativeBalance: HeliusNativeBalance | undefined): TokenHolding | null {
  if (!nativeBalance) return null;

  const { lamports, price_per_sol, total_price } = nativeBalance;

  return {
    mint: NATIVE_SOL_MINT,
    symbol: "SOL",
    name: "Solana",
    balance: lamports / Math.pow(10, NATIVE_SOL_DECIMALS),
    decimals: NATIVE_SOL_DECIMALS,
    priceUsd: price_per_sol ?? null,
    valueUsd: total_price ?? null,
    imageUrl: null,
  };
}

async function fetchHoldingsFromHelius(
  rpcUrl: string,
  publicKey: string
): Promise<TokenHolding[]> {
  const response = await fetchJson<HeliusResponse>(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "token-holdings",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: publicKey,
        page: 1,
        limit: 1000,
        displayOptions: {
          showFungible: true,
          showNativeBalance: true,
        },
      },
    }),
  });

  const holdings: TokenHolding[] = [];

  const nativeSol = mapNativeBalance(response.result.nativeBalance);
  if (nativeSol) {
    holdings.push(nativeSol);
  }

  for (const asset of response.result.items) {
    const holding = mapAssetToHolding(asset);
    if (holding) {
      holdings.push(holding);
    }
  }

  return holdings;
}

export async function fetchTokenHoldings(
  publicKey: string,
  forceRefresh = false
): Promise<TokenHolding[]> {
  try {
    new PublicKey(publicKey);
  } catch {
    throw new Error("Invalid public key");
  }

  const cached = holdingsCache.get(publicKey);
  if (!forceRefresh && isCacheValid(cached)) {
    return cached!.holdings;
  }

  const inflight = inflightRequests.get(publicKey);
  if (inflight) {
    if (!forceRefresh) {
      return inflight;
    }

    // If a force refresh arrives while another request is in flight, wait for
    // it to settle and then issue a fresh request.
    try {
      await inflight;
    } catch {
      // Ignore previous request failure; a fresh forced request is next.
    }

    const nextInflight = inflightRequests.get(publicKey);
    if (nextInflight) {
      return nextInflight;
    }
  }

  const rpcUrl = getRpcUrl();
  if (!rpcUrl) {
    holdingsCache.set(publicKey, { holdings: [], fetchedAt: Date.now() });
    return [];
  }

  const loader = fetchHoldingsFromHelius(rpcUrl, publicKey).then((holdings) => {
    holdingsCache.set(publicKey, { holdings, fetchedAt: Date.now() });
    return holdings;
  });

  inflightRequests.set(publicKey, loader);

  try {
    return await loader;
  } finally {
    if (inflightRequests.get(publicKey) === loader) {
      inflightRequests.delete(publicKey);
    }
  }
}
