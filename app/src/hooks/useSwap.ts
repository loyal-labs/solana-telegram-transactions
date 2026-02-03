"use client";

import { Keypair } from "@solana/web3.js";
import { useCallback, useState } from "react";

import { fetchJson } from "@/lib/core/http";
import { executeSwapTransaction, SWAP_ERRORS, type SwapParams, type SwapResult } from "@/lib/dflow";

type QuoteApiResponse = {
  transaction: string;
  lastValidBlockHeight: number;
  expectedOutAmount: number;
  priceImpactPct: number;
  inAmount: number;
  outAmount: number;
  error?: string;
};

type SwapState = "idle" | "quoting" | "signing" | "confirming";

export function useSwap(getKeypair: () => Promise<Keypair>) {
  const [state, setState] = useState<SwapState>("idle");
  const [error, setError] = useState<string | null>(null);

  const executeSwap = useCallback(
    async (params: SwapParams): Promise<SwapResult> => {
      setError(null);
      setState("quoting");

      try {
        const keypair = await getKeypair();
        const userPublicKey = keypair.publicKey.toBase58();

        const quoteResponse = await fetchJson<QuoteApiResponse>(
          "/api/dflow/quote",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromMint: params.fromMint,
              toMint: params.toMint,
              fromAmount: params.fromAmount,
              fromDecimals: params.fromDecimals,
              toDecimals: params.toDecimals,
              userPublicKey,
            }),
          }
        );

        if (quoteResponse.error) {
          setError(quoteResponse.error);
          setState("idle");
          return { success: false, error: quoteResponse.error };
        }

        setState("signing");

        const result = await executeSwapTransaction(
          quoteResponse.transaction,
          keypair,
          quoteResponse.lastValidBlockHeight,
          params.fromAmount,
          params.fromSymbol,
          quoteResponse.expectedOutAmount,
          params.toSymbol
        );

        setState("idle");

        if (!result.success && result.error) {
          setError(result.error);
        }

        return result;
      } catch (err) {
        console.error("[useSwap] Error:", err);
        const errorMessage =
          err instanceof Error ? err.message : SWAP_ERRORS.TRANSACTION_FAILED;
        setError(errorMessage);
        setState("idle");
        return { success: false, error: errorMessage };
      }
    },
    [getKeypair]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    executeSwap,
    state,
    isLoading: state !== "idle",
    isQuoting: state === "quoting",
    isSigning: state === "signing",
    isConfirming: state === "confirming",
    error,
    resetError,
  };
}
