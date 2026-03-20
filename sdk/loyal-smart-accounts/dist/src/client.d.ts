import type { Signer } from "@solana/web3.js";
import { type LoyalSmartAccountsClientConfig, type LoyalSmartAccountsSendOptions, type PreparedLoyalSmartAccountsOperation } from "@loyal-labs/loyal-smart-accounts-core";
export type { LoyalSmartAccountsClientConfig, LoyalSmartAccountsSendOptions, PreparedLoyalSmartAccountsOperation, } from "@loyal-labs/loyal-smart-accounts-core";
export declare function createLoyalSmartAccountsClient(config: LoyalSmartAccountsClientConfig): {
    connection: import("@solana/web3.js").Connection;
    programId: import("@solana/web3.js").PublicKey;
    send(prepared: PreparedLoyalSmartAccountsOperation<string>, args: {
        signers: Signer[];
        sendOptions?: LoyalSmartAccountsSendOptions;
    }): Promise<string>;
    programConfig: Record<string, unknown>;
    smartAccounts: Record<string, unknown>;
    proposals: Record<string, unknown>;
    transactions: Record<string, unknown>;
    batches: Record<string, unknown>;
    policies: Record<string, unknown>;
    spendingLimits: Record<string, unknown>;
    execution: Record<string, unknown>;
    features: {
        programConfig: import("./feature-factory.js").FeatureModule;
        smartAccounts: import("./feature-factory.js").FeatureModule;
        proposals: import("./feature-factory.js").FeatureModule;
        transactions: import("./feature-factory.js").FeatureModule;
        batches: import("./feature-factory.js").FeatureModule;
        policies: import("./feature-factory.js").FeatureModule;
        spendingLimits: import("./feature-factory.js").FeatureModule;
        execution: import("./feature-factory.js").FeatureModule;
    };
};
export type LoyalSmartAccountsClient = ReturnType<typeof createLoyalSmartAccountsClient>;
