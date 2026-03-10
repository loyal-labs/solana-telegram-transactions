"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import type { FC, ReactNode } from "react";
import { useMemo } from "react";

const DEFAULT_SOLANA_RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";

type WalletConnectionProviderProps = {
  children: ReactNode;
};

export const WalletConnectionProvider: FC<WalletConnectionProviderProps> = ({
  children,
}) => {
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || DEFAULT_SOLANA_RPC_ENDPOINT;
  }, []);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider
      config={{ commitment: "confirmed", confirmTransactionInitialTimeout: 60_000 }}
      endpoint={endpoint}
    >
      <WalletProvider autoConnect wallets={wallets}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
