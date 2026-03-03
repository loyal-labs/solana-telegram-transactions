"use client";

import {
  AddressType,
  darkTheme,
  PhantomProvider as PhantomSdkProvider,
} from "@phantom/react-sdk";
import { Connection } from "@solana/web3.js";
import {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

type ConnectionContextValue = {
  connection: Connection;
};

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("useConnection must be used within PhantomWalletProvider");
  }
  return context;
};

type PhantomWalletProviderProps = {
  children: ReactNode;
};

const PHANTOM_APP_ID = "4b74c407-6337-44e5-bf42-eae48c9c35a7";

export const PhantomWalletProvider: FC<PhantomWalletProviderProps> = ({
  children,
}) => {
  const endpoint = useMemo(() => {
    const rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT;
    if (!rpcEndpoint) {
      throw new Error(
        "NEXT_PUBLIC_SOLANA_RPC_ENDPOINT environment variable is not set. Please add it to your .env file."
      );
    }
    return rpcEndpoint;
  }, []);

  const connection = useMemo(
    () =>
      new Connection(endpoint, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60_000,
      }),
    [endpoint]
  );

  const connectionValue = useMemo(() => ({ connection }), [connection]);

  // Get redirect URL for OAuth callbacks
  const redirectUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/auth/callback`;
    }
    return "https://askloyal.com/auth/callback";
  }, []);

  return (
    <PhantomSdkProvider
      appIcon="https://askloyal.com/favicon.png"
      appName="Loyal"
      config={{
        providers: ["google", "apple", "phantom", "injected", "deeplink"],
        appId: PHANTOM_APP_ID,
        addressTypes: [AddressType.solana],
        authOptions: {
          redirectUrl,
        },
      }}
      theme={darkTheme}
    >
      <ConnectionContext.Provider value={connectionValue}>
        {children}
      </ConnectionContext.Provider>
    </PhantomSdkProvider>
  );
};
