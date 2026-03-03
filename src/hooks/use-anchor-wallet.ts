"use client";

import { useAccounts, usePhantom, useSolana } from "@phantom/react-sdk";
import {
  PublicKey,
  type Transaction,
  type VersionedTransaction,
} from "@solana/web3.js";
import { useMemo } from "react";

/**
 * AnchorWallet interface compatible with @coral-xyz/anchor
 * Note: signTransaction is only available for injected provider (Phantom extension)
 * Embedded wallets (OAuth login) do not support signTransaction
 */
export interface AnchorWallet {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[]
  ): Promise<T[]>;
}

/**
 * Hook that provides an AnchorWallet-compatible interface using Phantom SDK
 * This only works with the injected provider (Phantom browser extension)
 * OAuth/embedded wallets do not support the signTransaction method required by Anchor
 */
export function useAnchorWallet(): AnchorWallet | undefined {
  const { solana, isAvailable } = useSolana();
  const { isConnected } = usePhantom();
  const accounts = useAccounts();

  const solanaAddress = accounts?.find(
    (acc) => acc.addressType === "Solana"
  )?.address;

  return useMemo(() => {
    if (!(isConnected && isAvailable && solana && solanaAddress)) {
      return;
    }

    const publicKey = new PublicKey(solanaAddress);

    return {
      publicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(
        tx: T
      ): Promise<T> => {
        // Note: signTransaction is only available for injected provider
        // This will throw for embedded wallets
        if (!solana.signTransaction) {
          throw new Error(
            "signTransaction is not available. This feature requires the Phantom browser extension."
          );
        }
        return solana.signTransaction(tx) as Promise<T>;
      },
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(
        txs: T[]
      ): Promise<T[]> => {
        // Note: signAllTransactions is only available for injected provider
        if (!solana.signTransaction) {
          throw new Error(
            "signAllTransactions is not available. This feature requires the Phantom browser extension."
          );
        }
        // Sign each transaction sequentially
        const signedTxs: T[] = [];
        for (const tx of txs) {
          const signed = await solana.signTransaction(tx);
          signedTxs.push(signed as T);
        }
        return signedTxs;
      },
    };
  }, [isConnected, isAvailable, solana, solanaAddress]);
}
