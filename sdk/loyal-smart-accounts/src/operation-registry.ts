import {
  OPERATION_REGISTRY as CORE_OPERATION_REGISTRY,
  PROGRAM_ID,
  freezePreparedOperation,
  getOperationsForFeature,
  type LoyalSmartAccountsFeature,
  type PreparedLoyalSmartAccountsOperation,
} from "@loyal-labs/loyal-smart-accounts-core";
import * as internal from "@loyal-labs/loyal-smart-accounts-core/internal";
import type {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  Signer,
  TransactionInstruction,
} from "@solana/web3.js";

export type LoyalSmartAccountsFeatureName = LoyalSmartAccountsFeature;

export type PrepareArgs = {
  programId?: PublicKey;
  connection?: Connection;
  [key: string]: unknown;
};

export type ClientArgs = PrepareArgs & {
  additionalSigners?: Signer[];
  sendOptions?: unknown;
};

type PreparedInstructionResult =
  | TransactionInstruction
  | {
      instruction: TransactionInstruction;
      lookupTableAccounts?: AddressLookupTableAccount[];
    };

type RuntimeOperationOptions = {
  operationName: keyof typeof CORE_OPERATION_REGISTRY;
  instructionBuilder: (args: any) => PreparedInstructionResult | Promise<PreparedInstructionResult>;
  signerFallbacks?: Record<string, string>;
  exposeInstruction?: boolean;
};

export type RuntimeOperationDefinition = {
  metadata: (typeof CORE_OPERATION_REGISTRY)[keyof typeof CORE_OPERATION_REGISTRY];
  instruction?: (args: PrepareArgs) => TransactionInstruction;
  prepare: (
    args: PrepareArgs
  ) => Promise<PreparedLoyalSmartAccountsOperation<string>>;
  toPrepareArgsFromClientArgs: (args: ClientArgs) => PrepareArgs;
  resolveClientSigners: (args: ClientArgs) => Signer[];
};

function isSigner(value: unknown): value is Signer {
  return Boolean(
    value &&
      typeof value === "object" &&
      "publicKey" in value &&
      value.publicKey &&
      typeof (value as { publicKey?: { toBase58?: () => string } }).publicKey?.toBase58 ===
        "function"
  );
}

function normalizePreparedInstruction(
  result: PreparedInstructionResult
): {
  instruction: TransactionInstruction;
  lookupTableAccounts: AddressLookupTableAccount[];
} {
  if ("instruction" in result) {
    return {
      instruction: result.instruction,
      lookupTableAccounts: [...(result.lookupTableAccounts ?? [])],
    };
  }

  return {
    instruction: result,
    lookupTableAccounts: [],
  };
}

function normalizeSignerValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeSignerValue(entry));
  }

  if (isSigner(value)) {
    return value.publicKey;
  }

  return value;
}

function toPublicKey(value: unknown): PublicKey {
  if (isSigner(value)) {
    return value.publicKey;
  }

  return value as PublicKey;
}

function replaceSignerArgs(
  args: ClientArgs,
  signerFallbacks: Record<string, string>
): PrepareArgs {
  const next: PrepareArgs = { ...args };

  for (const [field, fallbackField] of Object.entries(signerFallbacks)) {
    if (next[field] == null && args[fallbackField] != null) {
      next[field] = normalizeSignerValue(args[fallbackField]);
    }
  }

  for (const [field, value] of Object.entries(next)) {
    next[field] = normalizeSignerValue(value);
  }

  delete next.additionalSigners;
  delete next.sendOptions;

  return next;
}

function collectClientSigners(
  roles: readonly string[],
  args: ClientArgs,
  signerFallbacks: Record<string, string>
): Signer[] {
  const signers: Signer[] = [];

  for (const role of roles) {
    const candidate = args[role] ?? args[signerFallbacks[role] ?? ""];
    if (Array.isArray(candidate)) {
      for (const signer of candidate) {
        if (isSigner(signer)) {
          signers.push(signer);
        }
      }
      continue;
    }

    if (isSigner(candidate)) {
      signers.push(candidate);
    }
  }

  if (Array.isArray(args.additionalSigners)) {
    signers.push(...args.additionalSigners);
  }

  return signers;
}

function createPreparedOperation(
  operationName: string,
  payer: PublicKey,
  programId: PublicKey,
  result: PreparedInstructionResult
): PreparedLoyalSmartAccountsOperation<string> {
  const normalized = normalizePreparedInstruction(result);

  return freezePreparedOperation({
    operation: operationName,
    payer,
    programId,
    instructions: [normalized.instruction],
    lookupTableAccounts: normalized.lookupTableAccounts,
  });
}

function defineOperation({
  operationName,
  instructionBuilder,
  signerFallbacks = {},
  exposeInstruction = true,
}: RuntimeOperationOptions): RuntimeOperationDefinition {
  const metadata = CORE_OPERATION_REGISTRY[operationName];

  return {
    metadata,
    instruction:
      metadata.phase === "offline" && exposeInstruction
        ? (args: PrepareArgs) => {
            const result = instructionBuilder({
              ...args,
              programId: args.programId ?? PROGRAM_ID,
            }) as PreparedInstructionResult;
            return normalizePreparedInstruction(result).instruction;
          }
        : undefined,
    prepare: async (args: PrepareArgs) => {
      const programId = args.programId ?? PROGRAM_ID;
      const result = await instructionBuilder({
        ...args,
        programId,
      });

      return createPreparedOperation(
        metadata.exportName,
        toPublicKey(args[metadata.payerRole]),
        programId,
        result
      );
    },
    toPrepareArgsFromClientArgs: (args: ClientArgs) =>
      replaceSignerArgs(args, signerFallbacks),
    resolveClientSigners: (args: ClientArgs) =>
      collectClientSigners(metadata.signerRoles, args, signerFallbacks),
  };
}

export const RUNTIME_OPERATION_REGISTRY = {
  initializeProgramConfig: defineOperation({
    operationName: "initializeProgramConfig",
    instructionBuilder: internal.initializeProgramConfig,
  }),
  setProgramConfigAuthority: defineOperation({
    operationName: "setProgramConfigAuthority",
    instructionBuilder: internal.setProgramConfigAuthority,
  }),
  setProgramConfigSmartAccountCreationFee: defineOperation({
    operationName: "setProgramConfigSmartAccountCreationFee",
    instructionBuilder: internal.setProgramConfigSmartAccountCreationFee,
  }),
  setProgramConfigTreasury: defineOperation({
    operationName: "setProgramConfigTreasury",
    instructionBuilder: internal.setProgramConfigTreasury,
  }),
  createSmartAccount: defineOperation({
    operationName: "createSmartAccount",
    instructionBuilder: internal.createSmartAccount,
  }),
  addSignerAsAuthority: defineOperation({
    operationName: "addSignerAsAuthority",
    instructionBuilder: internal.addSignerAsAuthority,
  }),
  removeSignerAsAuthority: defineOperation({
    operationName: "removeSignerAsAuthority",
    instructionBuilder: internal.removeSignerAsAuthority,
  }),
  setTimeLockAsAuthority: defineOperation({
    operationName: "setTimeLockAsAuthority",
    instructionBuilder: internal.setTimeLockAsAuthority,
  }),
  changeThresholdAsAuthority: defineOperation({
    operationName: "changeThresholdAsAuthority",
    instructionBuilder: internal.changeThresholdAsAuthority,
  }),
  setNewSettingsAuthorityAsAuthority: defineOperation({
    operationName: "setNewSettingsAuthorityAsAuthority",
    instructionBuilder: internal.setNewSettingsAuthorityAsAuthority,
  }),
  setArchivalAuthorityAsAuthority: defineOperation({
    operationName: "setArchivalAuthorityAsAuthority",
    instructionBuilder: internal.setArchivalAuthorityAsAuthority,
  }),
  createSettingsTransaction: defineOperation({
    operationName: "createSettingsTransaction",
    instructionBuilder: internal.createSettingsTransaction,
  }),
  closeSettingsTransaction: defineOperation({
    operationName: "closeSettingsTransaction",
    instructionBuilder: internal.closeSettingsTransaction,
  }),
  createProposal: defineOperation({
    operationName: "createProposal",
    instructionBuilder: internal.createProposal,
    signerFallbacks: { rentPayer: "creator" },
  }),
  activateProposal: defineOperation({
    operationName: "activateProposal",
    instructionBuilder: internal.activateProposal,
  }),
  approveProposal: defineOperation({
    operationName: "approveProposal",
    instructionBuilder: internal.approveProposal,
  }),
  rejectProposal: defineOperation({
    operationName: "rejectProposal",
    instructionBuilder: internal.rejectProposal,
  }),
  cancelProposal: defineOperation({
    operationName: "cancelProposal",
    instructionBuilder: internal.cancelProposal,
  }),
  createTransaction: defineOperation({
    operationName: "createTransaction",
    instructionBuilder: internal.createTransaction,
  }),
  createTransactionBuffer: defineOperation({
    operationName: "createTransactionBuffer",
    instructionBuilder: internal.createTransactionBuffer,
    signerFallbacks: { rentPayer: "creator" },
  }),
  closeTransactionBuffer: defineOperation({
    operationName: "closeTransactionBuffer",
    instructionBuilder: internal.closeTransactionBuffer,
  }),
  extendTransactionBuffer: defineOperation({
    operationName: "extendTransactionBuffer",
    instructionBuilder: internal.extendTransactionBuffer,
  }),
  createTransactionFromBuffer: defineOperation({
    operationName: "createTransactionFromBuffer",
    instructionBuilder: internal.createTransactionFromBuffer,
    signerFallbacks: { rentPayer: "creator" },
  }),
  closeTransaction: defineOperation({
    operationName: "closeTransaction",
    instructionBuilder: internal.closeTransaction,
  }),
  logEvent: defineOperation({
    operationName: "logEvent",
    instructionBuilder: internal.logEvent,
  }),
  createBatch: defineOperation({
    operationName: "createBatch",
    instructionBuilder: internal.createBatch,
    signerFallbacks: { rentPayer: "creator" },
  }),
  addTransactionToBatch: defineOperation({
    operationName: "addTransactionToBatch",
    instructionBuilder: internal.addTransactionToBatch,
    signerFallbacks: { rentPayer: "signer" },
    exposeInstruction: false,
  }),
  closeBatchTransaction: defineOperation({
    operationName: "closeBatchTransaction",
    instructionBuilder: internal.closeBatchTransaction,
  }),
  closeBatch: defineOperation({
    operationName: "closeBatch",
    instructionBuilder: internal.closeBatch,
  }),
  createPolicyTransaction: defineOperation({
    operationName: "createPolicyTransaction",
    instructionBuilder: internal.createPolicyTransaction,
  }),
  closeEmptyPolicyTransaction: defineOperation({
    operationName: "closeEmptyPolicyTransaction",
    instructionBuilder: internal.closeEmptyPolicyTransaction,
  }),
  addSpendingLimitAsAuthority: defineOperation({
    operationName: "addSpendingLimitAsAuthority",
    instructionBuilder: internal.addSpendingLimitAsAuthority,
  }),
  removeSpendingLimitAsAuthority: defineOperation({
    operationName: "removeSpendingLimitAsAuthority",
    instructionBuilder: internal.removeSpendingLimitAsAuthority,
  }),
  useSpendingLimit: defineOperation({
    operationName: "useSpendingLimit",
    instructionBuilder: internal.useSpendingLimit,
  }),
  executeSettingsTransaction: defineOperation({
    operationName: "executeSettingsTransaction",
    instructionBuilder: internal.executeSettingsTransaction,
  }),
  executeTransaction: defineOperation({
    operationName: "executeTransaction",
    instructionBuilder: internal.executeTransaction,
    exposeInstruction: false,
  }),
  executeBatchTransaction: defineOperation({
    operationName: "executeBatchTransaction",
    instructionBuilder: internal.executeBatchTransaction,
    exposeInstruction: false,
  }),
  executeTransactionSync: defineOperation({
    operationName: "executeTransactionSync",
    instructionBuilder: internal.executeTransactionSync,
  }),
  executeTransactionSyncV2: defineOperation({
    operationName: "executeTransactionSyncV2",
    instructionBuilder: internal.executeTransactionSyncV2,
  }),
  executeSettingsTransactionSync: defineOperation({
    operationName: "executeSettingsTransactionSync",
    instructionBuilder: internal.executeSettingsTransactionSync,
  }),
  executePolicyTransaction: defineOperation({
    operationName: "executePolicyTransaction",
    instructionBuilder: internal.executePolicyTransaction,
  }),
  executePolicyPayloadSync: defineOperation({
    operationName: "executePolicyPayloadSync",
    instructionBuilder: internal.executePolicyPayloadSync,
  }),
} as const satisfies Record<string, RuntimeOperationDefinition>;

export function getRuntimeOperationsForFeature(
  feature: LoyalSmartAccountsFeatureName
) {
  const operationNames = getOperationsForFeature(feature) as Array<
    keyof typeof RUNTIME_OPERATION_REGISTRY
  >;

  return Object.fromEntries(
    operationNames.map((operationName) => {
      const operation = RUNTIME_OPERATION_REGISTRY[operationName];
      return [operation.metadata.exportName, operation];
    })
  ) as Record<string, RuntimeOperationDefinition>;
}
