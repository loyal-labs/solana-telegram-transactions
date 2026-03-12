"use client";

import { LoyalPrivateTransactionsClient } from "@loyal-labs/private-transactions";
import {
  createSolanaWalletDataClient,
  NATIVE_SOL_MINT,
  type AssetBalance,
  type SecureBalanceMap,
  type SolanaWalletDataClient,
} from "@loyal-labs/solana-wallet";
import { getPerEndpoints, getSolanaEndpoints } from "@loyal-labs/solana-rpc";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

import { usePublicEnv } from "@/contexts/public-env-context";

export function useSolanaWalletDataClient(): SolanaWalletDataClient {
  const publicEnv = usePublicEnv();
  const wallet = useWallet();
  const walletPublicKey = wallet.publicKey ?? null;

  return useMemo(() => {
    let privateClientPromise: Promise<LoyalPrivateTransactionsClient | null> | null =
      null;

    const getPrivateClient = async (): Promise<LoyalPrivateTransactionsClient | null> => {
      if (privateClientPromise) {
        return privateClientPromise;
      }

      if (
        !walletPublicKey ||
        typeof wallet.signTransaction !== "function" ||
        typeof wallet.signAllTransactions !== "function" ||
        typeof wallet.signMessage !== "function"
      ) {
        return null;
      }

      const { rpcEndpoint, websocketEndpoint } = getSolanaEndpoints(
        publicEnv.solanaEnv
      );
      const { perRpcEndpoint, perWsEndpoint } = getPerEndpoints(
        publicEnv.solanaEnv
      );
      const signer = {
        publicKey: walletPublicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
        signMessage: wallet.signMessage,
      };

      privateClientPromise = LoyalPrivateTransactionsClient.fromConfig({
        signer,
        baseRpcEndpoint: rpcEndpoint,
        baseWsEndpoint: websocketEndpoint,
        ephemeralRpcEndpoint: perRpcEndpoint,
        ephemeralWsEndpoint: perWsEndpoint,
      }).catch((error) => {
        console.warn("Failed to create secure wallet client", error);
        return null;
      });

      return privateClientPromise;
    };

    return createSolanaWalletDataClient({
      env: publicEnv.solanaEnv,
      secureBalanceProvider: async ({ owner, tokenMints, assetBalances }) => {
        const privateClient = await getPrivateClient();
        if (!privateClient) {
          return new Map<string, bigint>();
        }

        const nativeMint = new PublicKey(NATIVE_SOL_MINT);
        const uniqueMints = new Map<string, PublicKey>();
        uniqueMints.set(nativeMint.toBase58(), nativeMint);
        for (const mint of tokenMints) {
          uniqueMints.set(mint.toBase58(), mint);
        }

        const rawDeposits = new Map<string, bigint>();
        const results = await Promise.allSettled(
          Array.from(uniqueMints.values()).map(async (mint) => {
            const deposit = await privateClient.getEphemeralDeposit(owner, mint);
            if (deposit && deposit.amount > BigInt(0)) {
              rawDeposits.set(mint.toBase58(), deposit.amount);
            }
          })
        );

        for (const result of results) {
          if (result.status === "rejected") {
            console.warn("Failed to fetch secure holding", result.reason);
          }
        }

        return new Map<string, bigint>(
          [...rawDeposits.entries()].filter(([mint]) =>
            assetBalances.some(
              (assetBalance: AssetBalance) => assetBalance.asset.mint === mint
            )
          )
        ) as SecureBalanceMap;
      },
    });
  }, [
    publicEnv.solanaEnv,
    walletPublicKey,
    wallet.signAllTransactions,
    wallet.signMessage,
    wallet.signTransaction,
  ]);
}
