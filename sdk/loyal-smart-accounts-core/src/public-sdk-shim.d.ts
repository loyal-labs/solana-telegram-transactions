declare module "@loyal-labs/loyal-smart-accounts" {
  import type { Connection, PublicKey } from "@solana/web3.js";
  import type { LoyalSmartAccountsClientConfig } from "./transport.js";

  export function createLoyalSmartAccountsClient(
    config: LoyalSmartAccountsClientConfig
  ): {
    connection: Connection;
    programId: PublicKey;
    [key: string]: unknown;
  };
}
