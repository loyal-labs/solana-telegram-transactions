import { useAccounts, usePhantom } from "@phantom/react-sdk";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";

import { useConnection } from "@/components/solana/phantom-provider";

export type TokenBalance = {
  symbol: string;
  balance: number;
  mint: string;
  decimals: number;
};

// Known token mints for Solana mainnet
const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  So11111111111111111111111111111111111111112: { symbol: "SOL", decimals: 9 },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    symbol: "USDC",
    decimals: 6,
  },
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: {
    symbol: "USDT",
    decimals: 6,
  },
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: {
    symbol: "BONK",
    decimals: 5,
  },
  LYLikzBQtpa9ZgVrJsqYGQpR3cC1WMJrBHaXGrQmeta: {
    symbol: "LOYAL",
    decimals: 6,
  },
};

export function useWalletBalances() {
  const { connection } = useConnection();
  const { isConnected } = usePhantom();
  const accounts = useAccounts();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get Solana address from accounts
  const solanaAddress = accounts?.find(
    (acc) => acc.addressType === "Solana"
  )?.address;

  const fetchBalances = useCallback(async () => {
    if (!(isConnected && solanaAddress)) {
      setBalances([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const publicKey = new PublicKey(solanaAddress);
      const tokenBalances: TokenBalance[] = [];

      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey);
      if (solBalance > 0) {
        tokenBalances.push({
          symbol: "SOL",
          balance: solBalance / LAMPORTS_PER_SOL,
          mint: "So11111111111111111111111111111111111111112",
          decimals: 9,
        });
      }

      // Fetch SPL token balances
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
        }
      );

      for (const { account } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        const balance = parsedInfo.tokenAmount.uiAmount;

        // Only include tokens with balance > 0
        if (balance > 0) {
          const tokenInfo = KNOWN_TOKENS[mintAddress];

          // Include all tokens with balance > 0, not just known ones
          tokenBalances.push({
            symbol:
              tokenInfo?.symbol ||
              `${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`,
            balance,
            mint: mintAddress,
            decimals: parsedInfo.tokenAmount.decimals,
          });
        }
      }

      setBalances(tokenBalances);
      setLoading(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch balances";
      setError(errorMessage);
      console.error("Error fetching wallet balances:", err);
      setLoading(false);
    }
  }, [isConnected, solanaAddress, connection]);

  // Fetch balances when wallet connects
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    loading,
    error,
    isConnected: Boolean(isConnected && solanaAddress),
    refetch: fetchBalances,
  };
}
