import { FEATURE_INSTRUCTION_COVERAGE } from "./features.js";
export type LoyalSmartAccountsFeature = keyof typeof FEATURE_INSTRUCTION_COVERAGE;
export type LoyalSmartAccountsOperationPhase = "offline" | "online";
export type LoyalSmartAccountsOperationMetadata = {
    feature: LoyalSmartAccountsFeature;
    instruction: string;
    exportName: string;
    phase: LoyalSmartAccountsOperationPhase;
    payerRole: string;
    signerRoles: readonly string[];
    defaultsRentPayerToActor?: boolean;
    requiresLookupTables?: boolean;
    requiresConfirmation?: boolean;
};
export declare const OPERATION_REGISTRY: {
    readonly initializeProgramConfig: {
        readonly feature: "programConfig";
        readonly instruction: "initializeProgramConfig";
        readonly exportName: "initialize";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "initializer"];
    };
    readonly setProgramConfigAuthority: {
        readonly feature: "programConfig";
        readonly instruction: "setProgramConfigAuthority";
        readonly exportName: "setAuthority";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "authority"];
    };
    readonly setProgramConfigSmartAccountCreationFee: {
        readonly feature: "programConfig";
        readonly instruction: "setProgramConfigSmartAccountCreationFee";
        readonly exportName: "setSmartAccountCreationFee";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "authority"];
    };
    readonly setProgramConfigTreasury: {
        readonly feature: "programConfig";
        readonly instruction: "setProgramConfigTreasury";
        readonly exportName: "setTreasury";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "authority"];
    };
    readonly createSmartAccount: {
        readonly feature: "smartAccounts";
        readonly instruction: "createSmartAccount";
        readonly exportName: "create";
        readonly phase: "offline";
        readonly payerRole: "creator";
        readonly signerRoles: readonly ["creator"];
    };
    readonly addSignerAsAuthority: {
        readonly feature: "smartAccounts";
        readonly instruction: "addSignerAsAuthority";
        readonly exportName: "addSigner";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "rentPayer"];
    };
    readonly removeSignerAsAuthority: {
        readonly feature: "smartAccounts";
        readonly instruction: "removeSignerAsAuthority";
        readonly exportName: "removeSigner";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly setTimeLockAsAuthority: {
        readonly feature: "smartAccounts";
        readonly instruction: "setTimeLockAsAuthority";
        readonly exportName: "setTimeLock";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly changeThresholdAsAuthority: {
        readonly feature: "smartAccounts";
        readonly instruction: "changeThresholdAsAuthority";
        readonly exportName: "changeThreshold";
        readonly phase: "offline";
        readonly payerRole: "settingsAuthority";
        readonly signerRoles: readonly ["settingsAuthority", "rentPayer"];
    };
    readonly setNewSettingsAuthorityAsAuthority: {
        readonly feature: "smartAccounts";
        readonly instruction: "setNewSettingsAuthorityAsAuthority";
        readonly exportName: "setNewSettingsAuthority";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly setArchivalAuthorityAsAuthority: {
        readonly feature: "smartAccounts";
        readonly instruction: "setArchivalAuthorityAsAuthority";
        readonly exportName: "setArchivalAuthority";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly createSettingsTransaction: {
        readonly feature: "smartAccounts";
        readonly instruction: "createSettingsTransaction";
        readonly exportName: "createSettingsTransaction";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly closeSettingsTransaction: {
        readonly feature: "smartAccounts";
        readonly instruction: "closeSettingsTransaction";
        readonly exportName: "closeSettingsTransaction";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly createProposal: {
        readonly feature: "proposals";
        readonly instruction: "createProposal";
        readonly exportName: "create";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "creator", "rentPayer"];
        readonly defaultsRentPayerToActor: true;
    };
    readonly activateProposal: {
        readonly feature: "proposals";
        readonly instruction: "activateProposal";
        readonly exportName: "activate";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "signer"];
    };
    readonly approveProposal: {
        readonly feature: "proposals";
        readonly instruction: "approveProposal";
        readonly exportName: "approve";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "signer"];
    };
    readonly rejectProposal: {
        readonly feature: "proposals";
        readonly instruction: "rejectProposal";
        readonly exportName: "reject";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "signer"];
    };
    readonly cancelProposal: {
        readonly feature: "proposals";
        readonly instruction: "cancelProposal";
        readonly exportName: "cancel";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "signer"];
    };
    readonly createTransaction: {
        readonly feature: "transactions";
        readonly instruction: "createTransaction";
        readonly exportName: "create";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly createTransactionBuffer: {
        readonly feature: "transactions";
        readonly instruction: "createTransactionBuffer";
        readonly exportName: "createBuffer";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "creator", "rentPayer"];
        readonly defaultsRentPayerToActor: true;
    };
    readonly closeTransactionBuffer: {
        readonly feature: "transactions";
        readonly instruction: "closeTransactionBuffer";
        readonly exportName: "closeBuffer";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "creator"];
    };
    readonly extendTransactionBuffer: {
        readonly feature: "transactions";
        readonly instruction: "extendTransactionBuffer";
        readonly exportName: "extendBuffer";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "creator"];
    };
    readonly createTransactionFromBuffer: {
        readonly feature: "transactions";
        readonly instruction: "createTransactionFromBuffer";
        readonly exportName: "createFromBuffer";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "creator", "rentPayer"];
        readonly defaultsRentPayerToActor: true;
    };
    readonly closeTransaction: {
        readonly feature: "transactions";
        readonly instruction: "closeTransaction";
        readonly exportName: "close";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly logEvent: {
        readonly feature: "transactions";
        readonly instruction: "logEvent";
        readonly exportName: "logEvent";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "logAuthority"];
    };
    readonly createBatch: {
        readonly feature: "batches";
        readonly instruction: "createBatch";
        readonly exportName: "create";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "creator", "rentPayer"];
        readonly defaultsRentPayerToActor: true;
    };
    readonly addTransactionToBatch: {
        readonly feature: "batches";
        readonly instruction: "addTransactionToBatch";
        readonly exportName: "addTransaction";
        readonly phase: "online";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "signer", "rentPayer"];
        readonly defaultsRentPayerToActor: true;
        readonly requiresLookupTables: true;
    };
    readonly closeBatchTransaction: {
        readonly feature: "batches";
        readonly instruction: "closeBatchTransaction";
        readonly exportName: "closeTransaction";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly closeBatch: {
        readonly feature: "batches";
        readonly instruction: "closeBatch";
        readonly exportName: "close";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly createPolicyTransaction: {
        readonly feature: "policies";
        readonly instruction: "createPolicyTransaction";
        readonly exportName: "createTransaction";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly closeEmptyPolicyTransaction: {
        readonly feature: "policies";
        readonly instruction: "closeEmptyPolicyTransaction";
        readonly exportName: "closeEmptyTransaction";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly addSpendingLimitAsAuthority: {
        readonly feature: "spendingLimits";
        readonly instruction: "addSpendingLimitAsAuthority";
        readonly exportName: "add";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "settingsAuthority", "rentPayer"];
    };
    readonly removeSpendingLimitAsAuthority: {
        readonly feature: "spendingLimits";
        readonly instruction: "removeSpendingLimitAsAuthority";
        readonly exportName: "remove";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly useSpendingLimit: {
        readonly feature: "spendingLimits";
        readonly instruction: "useSpendingLimit";
        readonly exportName: "use";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "signer"];
    };
    readonly executeSettingsTransaction: {
        readonly feature: "execution";
        readonly instruction: "executeSettingsTransaction";
        readonly exportName: "executeSettingsTransaction";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "signer", "rentPayer"];
        readonly requiresConfirmation: true;
    };
    readonly executeTransaction: {
        readonly feature: "execution";
        readonly instruction: "executeTransaction";
        readonly exportName: "executeTransaction";
        readonly phase: "online";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
        readonly requiresLookupTables: true;
        readonly requiresConfirmation: true;
    };
    readonly executeBatchTransaction: {
        readonly feature: "execution";
        readonly instruction: "executeBatchTransaction";
        readonly exportName: "executeBatchTransaction";
        readonly phase: "online";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "signer"];
        readonly requiresLookupTables: true;
        readonly requiresConfirmation: true;
    };
    readonly executeTransactionSync: {
        readonly feature: "execution";
        readonly instruction: "executeTransactionSync";
        readonly exportName: "executeTransactionSync";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "signers"];
    };
    readonly executeTransactionSyncV2: {
        readonly feature: "execution";
        readonly instruction: "executeTransactionSyncV2";
        readonly exportName: "executeTransactionSyncV2";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly executeSettingsTransactionSync: {
        readonly feature: "execution";
        readonly instruction: "executeSettingsTransactionSync";
        readonly exportName: "executeSettingsTransactionSync";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer", "signers"];
    };
    readonly executePolicyTransaction: {
        readonly feature: "execution";
        readonly instruction: "executePolicyTransaction";
        readonly exportName: "executePolicyTransaction";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
    readonly executePolicyPayloadSync: {
        readonly feature: "execution";
        readonly instruction: "executePolicyPayloadSync";
        readonly exportName: "executePolicyPayloadSync";
        readonly phase: "offline";
        readonly payerRole: "feePayer";
        readonly signerRoles: readonly ["feePayer"];
    };
};
export declare const OPERATION_NAMES: Array<keyof typeof OPERATION_REGISTRY>;
export declare const FEATURE_EXPORTS_FROM_REGISTRY: { [K in keyof typeof OPERATION_REGISTRY]: (typeof OPERATION_REGISTRY)[K]["exportName"]; };
export declare function getOperationsForFeature(feature: LoyalSmartAccountsFeature): ("initializeProgramConfig" | "setProgramConfigAuthority" | "setProgramConfigSmartAccountCreationFee" | "setProgramConfigTreasury" | "createSmartAccount" | "addSignerAsAuthority" | "removeSignerAsAuthority" | "setTimeLockAsAuthority" | "changeThresholdAsAuthority" | "setNewSettingsAuthorityAsAuthority" | "setArchivalAuthorityAsAuthority" | "createSettingsTransaction" | "closeSettingsTransaction" | "createProposal" | "activateProposal" | "approveProposal" | "rejectProposal" | "cancelProposal" | "createTransaction" | "createTransactionBuffer" | "closeTransactionBuffer" | "extendTransactionBuffer" | "createTransactionFromBuffer" | "closeTransaction" | "logEvent" | "createBatch" | "addTransactionToBatch" | "closeBatchTransaction" | "closeBatch" | "closeEmptyPolicyTransaction" | "addSpendingLimitAsAuthority" | "removeSpendingLimitAsAuthority" | "useSpendingLimit" | "executeSettingsTransaction" | "executeTransaction" | "executeBatchTransaction" | "executeTransactionSync" | "executeTransactionSyncV2" | "executeSettingsTransactionSync" | "createPolicyTransaction" | "executePolicyTransaction" | "executePolicyPayloadSync")[];
export declare function findOperationCoverageIssues(): {
    missingMappings: ("initializeProgramConfig" | "setProgramConfigAuthority" | "setProgramConfigSmartAccountCreationFee" | "setProgramConfigTreasury" | "createSmartAccount" | "addSignerAsAuthority" | "removeSignerAsAuthority" | "setTimeLockAsAuthority" | "changeThresholdAsAuthority" | "setNewSettingsAuthorityAsAuthority" | "setArchivalAuthorityAsAuthority" | "createSettingsTransaction" | "closeSettingsTransaction" | "createProposal" | "activateProposal" | "approveProposal" | "rejectProposal" | "cancelProposal" | "createTransaction" | "createTransactionBuffer" | "closeTransactionBuffer" | "extendTransactionBuffer" | "createTransactionFromBuffer" | "closeTransaction" | "logEvent" | "createBatch" | "addTransactionToBatch" | "closeBatchTransaction" | "closeBatch" | "closeEmptyPolicyTransaction" | "addSpendingLimitAsAuthority" | "removeSpendingLimitAsAuthority" | "useSpendingLimit" | "executeSettingsTransaction" | "executeTransaction" | "executeBatchTransaction" | "executeTransactionSync" | "executeTransactionSyncV2" | "executeSettingsTransactionSync" | "createPolicyTransaction" | "executePolicyTransaction" | "executePolicyPayloadSync")[];
    duplicateExports: string[];
};
