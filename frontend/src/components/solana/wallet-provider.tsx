"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletConnectWalletAdapter } from "@walletconnect/solana-adapter";
import type { FC, ReactNode } from "react";
import { useMemo } from "react";

import { usePublicEnv } from "@/contexts/public-env-context";
import type { SolanaEnv } from "@loyal-labs/solana-rpc";

const WALLETCONNECT_PROJECT_ID = "9d9f57c5553496b42ac1b9977066559d";

function toWalletAdapterNetwork(env: SolanaEnv): WalletAdapterNetwork {
  switch (env) {
    case "mainnet":
      return WalletAdapterNetwork.Mainnet;
    case "devnet":
    case "localnet":
      return WalletAdapterNetwork.Devnet;
    case "testnet":
      return WalletAdapterNetwork.Testnet;
  }
}

type WalletConnectionProviderProps = {
  children: ReactNode;
};

export const WalletConnectionProvider: FC<WalletConnectionProviderProps> = ({
  children,
}) => {
  const { solanaRpcEndpoint, solanaEnv } = usePublicEnv();
  const endpoint = useMemo(() => solanaRpcEndpoint, [solanaRpcEndpoint]);

  const wallets = useMemo(
    () => [
      new WalletConnectWalletAdapter({
        network: toWalletAdapterNetwork(solanaEnv),
        options: {
          projectId: WALLETCONNECT_PROJECT_ID,
        },
      }),
    ],
    [solanaEnv]
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
