import { createLoyalSmartAccountsClient } from "@loyal-labs/loyal-smart-accounts";
import { Connection, type Commitment } from "@solana/web3.js";
import { type SolanaEnv } from "@loyal-labs/solana-rpc";
import type { LoyalSmartAccountsClientConfig } from "./transport.js";
type CreateConnection = (rpcEndpoint: string, websocketEndpoint: string, commitment: Commitment) => Connection;
export type CreateLoyalSmartAccountsClientFromEnvConfig = Omit<LoyalSmartAccountsClientConfig, "connection" | "defaultCommitment"> & {
    env: SolanaEnv;
    commitment?: Commitment;
    connection?: Connection;
    createConnection?: CreateConnection;
};
export declare function createLoyalSmartAccountsClientFromEnv(config: CreateLoyalSmartAccountsClientFromEnvConfig): ReturnType<typeof createLoyalSmartAccountsClient>;
export {};
