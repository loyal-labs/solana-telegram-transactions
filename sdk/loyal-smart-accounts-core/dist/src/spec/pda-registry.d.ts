export declare const PDA_REGISTRY: {
    readonly programConfig: {
        readonly seeds: readonly ["smart_account", "program_config"];
    };
    readonly settings: {
        readonly seeds: readonly ["smart_account", "settings", "accountIndex:u128"];
    };
    readonly smartAccount: {
        readonly seeds: readonly ["smart_account", "settingsPda:pubkey", "smart_account", "accountIndex:u8"];
    };
    readonly transaction: {
        readonly seeds: readonly ["smart_account", "settingsPda:pubkey", "transaction", "transactionIndex:u64"];
    };
    readonly proposal: {
        readonly seeds: readonly ["smart_account", "settingsPda:pubkey", "transaction", "transactionIndex:u64", "proposal"];
    };
    readonly batchTransaction: {
        readonly seeds: readonly ["smart_account", "settingsPda:pubkey", "transaction", "batchIndex:u64", "batch_transaction", "transactionIndex:u32"];
    };
    readonly ephemeralSigner: {
        readonly seeds: readonly ["smart_account", "transactionPda:pubkey", "ephemeral_signer", "ephemeralSignerIndex:u8"];
    };
    readonly spendingLimit: {
        readonly seeds: readonly ["smart_account", "settingsPda:pubkey", "spending_limit", "seed:pubkey"];
    };
    readonly transactionBuffer: {
        readonly seeds: readonly ["smart_account", "consensusPda:pubkey", "transaction_buffer", "creator:pubkey", "bufferIndex:u8"];
    };
    readonly policy: {
        readonly seeds: readonly ["smart_account", "policy", "settingsPda:pubkey", "policySeed:u64"];
    };
};
