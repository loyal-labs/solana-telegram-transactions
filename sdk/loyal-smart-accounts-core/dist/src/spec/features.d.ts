export declare const FEATURE_INSTRUCTION_COVERAGE: {
    readonly programConfig: readonly ["initializeProgramConfig", "setProgramConfigAuthority", "setProgramConfigSmartAccountCreationFee", "setProgramConfigTreasury"];
    readonly smartAccounts: readonly ["createSmartAccount", "addSignerAsAuthority", "removeSignerAsAuthority", "setTimeLockAsAuthority", "changeThresholdAsAuthority", "setNewSettingsAuthorityAsAuthority", "setArchivalAuthorityAsAuthority", "createSettingsTransaction", "closeSettingsTransaction"];
    readonly proposals: readonly ["createProposal", "activateProposal", "approveProposal", "rejectProposal", "cancelProposal"];
    readonly transactions: readonly ["createTransaction", "createTransactionBuffer", "closeTransactionBuffer", "extendTransactionBuffer", "createTransactionFromBuffer", "closeTransaction", "logEvent"];
    readonly batches: readonly ["createBatch", "addTransactionToBatch", "closeBatchTransaction", "closeBatch"];
    readonly policies: readonly ["closeEmptyPolicyTransaction"];
    readonly spendingLimits: readonly ["addSpendingLimitAsAuthority", "removeSpendingLimitAsAuthority", "useSpendingLimit"];
    readonly execution: readonly ["executeSettingsTransaction", "executeTransaction", "executeBatchTransaction", "executeTransactionSync", "executeTransactionSyncV2", "executeSettingsTransactionSync"];
};
export declare const EXTRA_FEATURE_ACTIONS: {
    readonly policies: readonly ["createPolicyTransaction"];
    readonly execution: readonly ["executePolicyTransaction", "executePolicyPayloadSync"];
};
export declare const PUBLIC_FEATURE_EXPORTS: readonly ["programConfig", "smartAccounts", "proposals", "transactions", "batches", "policies", "spendingLimits", "execution"];
