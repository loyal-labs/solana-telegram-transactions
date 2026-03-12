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

import { usePublicEnv } from "@/contexts/public-env-context";

type WalletConnectionProviderProps = {
  children: ReactNode;
};

export const WalletConnectionProvider: FC<WalletConnectionProviderProps> = ({
  children,
}) => {
  const { solanaRpcEndpoint } = usePublicEnv();
  const endpoint = useMemo(() => solanaRpcEndpoint, [solanaRpcEndpoint]);

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
