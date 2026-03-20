import type { Commitment, Connection, GetAccountInfoConfig, PublicKey } from "@solana/web3.js";
import type { LoyalSmartAccountsTransport } from "@loyal-labs/loyal-smart-accounts-core";
import type { LoyalSmartAccountsFeatureName, PrepareArgs, RuntimeOperationDefinition } from "./operation-registry.js";
type QueryFunction = (...args: any[]) => Promise<unknown>;
type QueryFactories = Record<string, QueryFunction>;
type AccountsRecord = Record<string, unknown>;
type OperationMap = Record<string, RuntimeOperationDefinition>;
export type FeatureModule = {
    accounts: AccountsRecord;
    instructions: Record<string, (...args: any[]) => unknown>;
    prepare: Record<string, (args: PrepareArgs) => Promise<unknown>>;
    queries: QueryFactories;
    client: (transport: LoyalSmartAccountsTransport) => Record<string, unknown>;
};
export declare function createAccountFetcher<T>(accountClass: {
    fromAccountAddress(connection: Connection, address: PublicKey, commitmentOrConfig?: Commitment | GetAccountInfoConfig): Promise<T>;
}): QueryFunction;
export declare function createFeatureModule(args: {
    feature: LoyalSmartAccountsFeatureName;
    accounts: AccountsRecord;
    operations: OperationMap;
    queries: QueryFactories;
}): FeatureModule;
export {};
