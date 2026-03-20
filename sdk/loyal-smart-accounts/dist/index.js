// src/index.ts
import {
  generated,
  PROGRAM_ID as PROGRAM_ID2,
  PROGRAM_ADDRESS,
  spec,
  pda,
  codecs,
  errors,
  accounts
} from "@loyal-labs/loyal-smart-accounts-core";

// src/client.ts
import {
  createTransport,
  sendPreparedOperation as sendPreparedOperation2
} from "@loyal-labs/loyal-smart-accounts-core";

// src/features/program-config/index.ts
import { ProgramConfig } from "@loyal-labs/loyal-smart-accounts-core";

// src/feature-factory.ts
import { sendPreparedOperation } from "@loyal-labs/loyal-smart-accounts-core";
function createAccountFetcher(accountClass) {
  return (connection, address, commitmentOrConfig) => accountClass.fromAccountAddress(connection, address, commitmentOrConfig);
}
function bindQueries(queries, connection) {
  return Object.fromEntries(Object.entries(queries).map(([name, query]) => [
    name,
    (...args) => query(connection, ...args)
  ]));
}
function createPrepareApi(operations, connection, defaultProgramId) {
  return Object.fromEntries(Object.entries(operations).map(([name, operation]) => [
    name,
    (args) => operation.prepare({
      ...args,
      connection: args.connection ?? connection,
      programId: args.programId ?? defaultProgramId
    })
  ]));
}
function createInstructionsApi(operations) {
  return Object.fromEntries(Object.entries(operations).filter(([, operation]) => typeof operation.instruction === "function").map(([name, operation]) => [name, operation.instruction]));
}
function createClientApi(operations, queries, transport) {
  const prepare = createPrepareApi(operations, transport.connection, transport.programId);
  const methods = Object.fromEntries(Object.entries(operations).map(([name, operation]) => [
    name,
    async (args) => {
      const prepared = await prepare[name](operation.toPrepareArgsFromClientArgs(args));
      return sendPreparedOperation({
        transport,
        prepared,
        signers: operation.resolveClientSigners(args),
        sendOptions: args.sendOptions
      });
    }
  ]));
  return {
    ...methods,
    prepare,
    queries: bindQueries(queries, transport.connection)
  };
}
function createFeatureModule(args) {
  return {
    accounts: args.accounts,
    instructions: createInstructionsApi(args.operations),
    prepare: createPrepareApi(args.operations),
    queries: args.queries,
    client: (transport) => createClientApi(args.operations, args.queries, transport)
  };
}

// src/operation-registry.ts
import {
  OPERATION_REGISTRY as CORE_OPERATION_REGISTRY,
  PROGRAM_ID,
  freezePreparedOperation,
  getOperationsForFeature
} from "@loyal-labs/loyal-smart-accounts-core";
import * as internal from "@loyal-labs/loyal-smart-accounts-core/internal";
function isSigner(value) {
  return Boolean(value && typeof value === "object" && "publicKey" in value && value.publicKey && typeof value.publicKey?.toBase58 === "function");
}
function normalizePreparedInstruction(result) {
  if ("instruction" in result) {
    return {
      instruction: result.instruction,
      lookupTableAccounts: [...result.lookupTableAccounts ?? []]
    };
  }
  return {
    instruction: result,
    lookupTableAccounts: []
  };
}
function normalizeSignerValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeSignerValue(entry));
  }
  if (isSigner(value)) {
    return value.publicKey;
  }
  return value;
}
function toPublicKey(value) {
  if (isSigner(value)) {
    return value.publicKey;
  }
  return value;
}
function replaceSignerArgs(args, signerFallbacks) {
  const next = { ...args };
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
function collectClientSigners(roles, args, signerFallbacks) {
  const signers = [];
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
function createPreparedOperation(operationName, payer, programId, result) {
  const normalized = normalizePreparedInstruction(result);
  return freezePreparedOperation({
    operation: operationName,
    payer,
    programId,
    instructions: [normalized.instruction],
    lookupTableAccounts: normalized.lookupTableAccounts
  });
}
function defineOperation({
  operationName,
  instructionBuilder,
  signerFallbacks = {},
  exposeInstruction = true
}) {
  const metadata = CORE_OPERATION_REGISTRY[operationName];
  return {
    metadata,
    instruction: metadata.phase === "offline" && exposeInstruction ? (args) => {
      const result = instructionBuilder({
        ...args,
        programId: args.programId ?? PROGRAM_ID
      });
      return normalizePreparedInstruction(result).instruction;
    } : undefined,
    prepare: async (args) => {
      const programId = args.programId ?? PROGRAM_ID;
      const result = await instructionBuilder({
        ...args,
        programId
      });
      return createPreparedOperation(metadata.exportName, toPublicKey(args[metadata.payerRole]), programId, result);
    },
    toPrepareArgsFromClientArgs: (args) => replaceSignerArgs(args, signerFallbacks),
    resolveClientSigners: (args) => collectClientSigners(metadata.signerRoles, args, signerFallbacks)
  };
}
var RUNTIME_OPERATION_REGISTRY = {
  initializeProgramConfig: defineOperation({
    operationName: "initializeProgramConfig",
    instructionBuilder: internal.initializeProgramConfig
  }),
  setProgramConfigAuthority: defineOperation({
    operationName: "setProgramConfigAuthority",
    instructionBuilder: internal.setProgramConfigAuthority
  }),
  setProgramConfigSmartAccountCreationFee: defineOperation({
    operationName: "setProgramConfigSmartAccountCreationFee",
    instructionBuilder: internal.setProgramConfigSmartAccountCreationFee
  }),
  setProgramConfigTreasury: defineOperation({
    operationName: "setProgramConfigTreasury",
    instructionBuilder: internal.setProgramConfigTreasury
  }),
  createSmartAccount: defineOperation({
    operationName: "createSmartAccount",
    instructionBuilder: internal.createSmartAccount
  }),
  addSignerAsAuthority: defineOperation({
    operationName: "addSignerAsAuthority",
    instructionBuilder: internal.addSignerAsAuthority
  }),
  removeSignerAsAuthority: defineOperation({
    operationName: "removeSignerAsAuthority",
    instructionBuilder: internal.removeSignerAsAuthority
  }),
  setTimeLockAsAuthority: defineOperation({
    operationName: "setTimeLockAsAuthority",
    instructionBuilder: internal.setTimeLockAsAuthority
  }),
  changeThresholdAsAuthority: defineOperation({
    operationName: "changeThresholdAsAuthority",
    instructionBuilder: internal.changeThresholdAsAuthority
  }),
  setNewSettingsAuthorityAsAuthority: defineOperation({
    operationName: "setNewSettingsAuthorityAsAuthority",
    instructionBuilder: internal.setNewSettingsAuthorityAsAuthority
  }),
  setArchivalAuthorityAsAuthority: defineOperation({
    operationName: "setArchivalAuthorityAsAuthority",
    instructionBuilder: internal.setArchivalAuthorityAsAuthority
  }),
  createSettingsTransaction: defineOperation({
    operationName: "createSettingsTransaction",
    instructionBuilder: internal.createSettingsTransaction
  }),
  closeSettingsTransaction: defineOperation({
    operationName: "closeSettingsTransaction",
    instructionBuilder: internal.closeSettingsTransaction
  }),
  createProposal: defineOperation({
    operationName: "createProposal",
    instructionBuilder: internal.createProposal,
    signerFallbacks: { rentPayer: "creator" }
  }),
  activateProposal: defineOperation({
    operationName: "activateProposal",
    instructionBuilder: internal.activateProposal
  }),
  approveProposal: defineOperation({
    operationName: "approveProposal",
    instructionBuilder: internal.approveProposal
  }),
  rejectProposal: defineOperation({
    operationName: "rejectProposal",
    instructionBuilder: internal.rejectProposal
  }),
  cancelProposal: defineOperation({
    operationName: "cancelProposal",
    instructionBuilder: internal.cancelProposal
  }),
  createTransaction: defineOperation({
    operationName: "createTransaction",
    instructionBuilder: internal.createTransaction
  }),
  createTransactionBuffer: defineOperation({
    operationName: "createTransactionBuffer",
    instructionBuilder: internal.createTransactionBuffer,
    signerFallbacks: { rentPayer: "creator" }
  }),
  closeTransactionBuffer: defineOperation({
    operationName: "closeTransactionBuffer",
    instructionBuilder: internal.closeTransactionBuffer
  }),
  extendTransactionBuffer: defineOperation({
    operationName: "extendTransactionBuffer",
    instructionBuilder: internal.extendTransactionBuffer
  }),
  createTransactionFromBuffer: defineOperation({
    operationName: "createTransactionFromBuffer",
    instructionBuilder: internal.createTransactionFromBuffer,
    signerFallbacks: { rentPayer: "creator" }
  }),
  closeTransaction: defineOperation({
    operationName: "closeTransaction",
    instructionBuilder: internal.closeTransaction
  }),
  logEvent: defineOperation({
    operationName: "logEvent",
    instructionBuilder: internal.logEvent
  }),
  createBatch: defineOperation({
    operationName: "createBatch",
    instructionBuilder: internal.createBatch,
    signerFallbacks: { rentPayer: "creator" }
  }),
  addTransactionToBatch: defineOperation({
    operationName: "addTransactionToBatch",
    instructionBuilder: internal.addTransactionToBatch,
    signerFallbacks: { rentPayer: "signer" },
    exposeInstruction: false
  }),
  closeBatchTransaction: defineOperation({
    operationName: "closeBatchTransaction",
    instructionBuilder: internal.closeBatchTransaction
  }),
  closeBatch: defineOperation({
    operationName: "closeBatch",
    instructionBuilder: internal.closeBatch
  }),
  createPolicyTransaction: defineOperation({
    operationName: "createPolicyTransaction",
    instructionBuilder: internal.createPolicyTransaction
  }),
  closeEmptyPolicyTransaction: defineOperation({
    operationName: "closeEmptyPolicyTransaction",
    instructionBuilder: internal.closeEmptyPolicyTransaction
  }),
  addSpendingLimitAsAuthority: defineOperation({
    operationName: "addSpendingLimitAsAuthority",
    instructionBuilder: internal.addSpendingLimitAsAuthority
  }),
  removeSpendingLimitAsAuthority: defineOperation({
    operationName: "removeSpendingLimitAsAuthority",
    instructionBuilder: internal.removeSpendingLimitAsAuthority
  }),
  useSpendingLimit: defineOperation({
    operationName: "useSpendingLimit",
    instructionBuilder: internal.useSpendingLimit
  }),
  executeSettingsTransaction: defineOperation({
    operationName: "executeSettingsTransaction",
    instructionBuilder: internal.executeSettingsTransaction
  }),
  executeTransaction: defineOperation({
    operationName: "executeTransaction",
    instructionBuilder: internal.executeTransaction,
    exposeInstruction: false
  }),
  executeBatchTransaction: defineOperation({
    operationName: "executeBatchTransaction",
    instructionBuilder: internal.executeBatchTransaction,
    exposeInstruction: false
  }),
  executeTransactionSync: defineOperation({
    operationName: "executeTransactionSync",
    instructionBuilder: internal.executeTransactionSync
  }),
  executeTransactionSyncV2: defineOperation({
    operationName: "executeTransactionSyncV2",
    instructionBuilder: internal.executeTransactionSyncV2
  }),
  executeSettingsTransactionSync: defineOperation({
    operationName: "executeSettingsTransactionSync",
    instructionBuilder: internal.executeSettingsTransactionSync
  }),
  executePolicyTransaction: defineOperation({
    operationName: "executePolicyTransaction",
    instructionBuilder: internal.executePolicyTransaction
  }),
  executePolicyPayloadSync: defineOperation({
    operationName: "executePolicyPayloadSync",
    instructionBuilder: internal.executePolicyPayloadSync
  })
};
function getRuntimeOperationsForFeature(feature) {
  const operationNames = getOperationsForFeature(feature);
  return Object.fromEntries(operationNames.map((operationName) => {
    const operation = RUNTIME_OPERATION_REGISTRY[operationName];
    return [operation.metadata.exportName, operation];
  }));
}

// src/features/program-config/index.ts
var programConfig = createFeatureModule({
  feature: "programConfig",
  accounts: {
    ProgramConfig
  },
  operations: getRuntimeOperationsForFeature("programConfig"),
  queries: {
    fetchProgramConfig: createAccountFetcher(ProgramConfig)
  }
});
var createProgramConfigClient = programConfig.client;

// src/features/smart-accounts/index.ts
import {
  Settings,
  SettingsTransaction
} from "@loyal-labs/loyal-smart-accounts-core";
var smartAccounts = createFeatureModule({
  feature: "smartAccounts",
  accounts: {
    Settings,
    SettingsTransaction
  },
  operations: getRuntimeOperationsForFeature("smartAccounts"),
  queries: {
    fetchSettings: createAccountFetcher(Settings),
    fetchSettingsTransaction: createAccountFetcher(SettingsTransaction)
  }
});
var createSmartAccountsClient = smartAccounts.client;

// src/features/proposals/index.ts
import { Proposal } from "@loyal-labs/loyal-smart-accounts-core";
var proposals = createFeatureModule({
  feature: "proposals",
  accounts: {
    Proposal
  },
  operations: getRuntimeOperationsForFeature("proposals"),
  queries: {
    fetchProposal: createAccountFetcher(Proposal)
  }
});
var createProposalsClient = proposals.client;

// src/features/transactions/index.ts
import {
  LegacyTransaction,
  Transaction,
  TransactionBuffer
} from "@loyal-labs/loyal-smart-accounts-core";
var transactions = createFeatureModule({
  feature: "transactions",
  accounts: {
    LegacyTransaction,
    Transaction,
    TransactionBuffer
  },
  operations: getRuntimeOperationsForFeature("transactions"),
  queries: {
    fetchLegacyTransaction: createAccountFetcher(LegacyTransaction),
    fetchTransaction: createAccountFetcher(Transaction),
    fetchTransactionBuffer: createAccountFetcher(TransactionBuffer)
  }
});
var createTransactionsClient = transactions.client;

// src/features/batches/index.ts
import { Batch, BatchTransaction } from "@loyal-labs/loyal-smart-accounts-core";
var batches = createFeatureModule({
  feature: "batches",
  accounts: {
    Batch,
    BatchTransaction
  },
  operations: getRuntimeOperationsForFeature("batches"),
  queries: {
    fetchBatch: createAccountFetcher(Batch),
    fetchBatchTransaction: createAccountFetcher(BatchTransaction)
  }
});
var createBatchesClient = batches.client;

// src/features/policies/index.ts
import { Policy } from "@loyal-labs/loyal-smart-accounts-core";
var policies = createFeatureModule({
  feature: "policies",
  accounts: {
    Policy
  },
  operations: getRuntimeOperationsForFeature("policies"),
  queries: {
    fetchPolicy: createAccountFetcher(Policy)
  }
});
var createPoliciesClient = policies.client;

// src/features/spending-limits/index.ts
import { SpendingLimit } from "@loyal-labs/loyal-smart-accounts-core";
var spendingLimits = createFeatureModule({
  feature: "spendingLimits",
  accounts: {
    SpendingLimit
  },
  operations: getRuntimeOperationsForFeature("spendingLimits"),
  queries: {
    fetchSpendingLimit: createAccountFetcher(SpendingLimit)
  }
});
var createSpendingLimitsClient = spendingLimits.client;

// src/features/execution/index.ts
import {
  Batch as Batch2,
  BatchTransaction as BatchTransaction2,
  Policy as Policy2,
  SettingsTransaction as SettingsTransaction2,
  Transaction as Transaction2
} from "@loyal-labs/loyal-smart-accounts-core";
var execution = createFeatureModule({
  feature: "execution",
  accounts: {
    Batch: Batch2,
    BatchTransaction: BatchTransaction2,
    Policy: Policy2,
    SettingsTransaction: SettingsTransaction2,
    Transaction: Transaction2
  },
  operations: getRuntimeOperationsForFeature("execution"),
  queries: {
    fetchBatch: createAccountFetcher(Batch2),
    fetchBatchTransaction: createAccountFetcher(BatchTransaction2),
    fetchPolicy: createAccountFetcher(Policy2),
    fetchSettingsTransaction: createAccountFetcher(SettingsTransaction2),
    fetchTransaction: createAccountFetcher(Transaction2)
  }
});
var createExecutionClient = execution.client;

// src/client.ts
function createLoyalSmartAccountsClient(config) {
  const transport = createTransport(config);
  return {
    connection: transport.connection,
    programId: transport.programId,
    send(prepared, args) {
      return sendPreparedOperation2({
        transport,
        prepared,
        signers: [...args.signers],
        sendOptions: args.sendOptions
      });
    },
    programConfig: createProgramConfigClient(transport),
    smartAccounts: createSmartAccountsClient(transport),
    proposals: createProposalsClient(transport),
    transactions: createTransactionsClient(transport),
    batches: createBatchesClient(transport),
    policies: createPoliciesClient(transport),
    spendingLimits: createSpendingLimitsClient(transport),
    execution: createExecutionClient(transport),
    features: {
      programConfig,
      smartAccounts,
      proposals,
      transactions,
      batches,
      policies,
      spendingLimits,
      execution
    }
  };
}
export {
  transactions,
  spendingLimits,
  spec,
  smartAccounts,
  proposals,
  programConfig,
  policies,
  pda,
  generated,
  execution,
  errors,
  createLoyalSmartAccountsClient,
  codecs,
  batches,
  accounts,
  PROGRAM_ID2 as PROGRAM_ID,
  PROGRAM_ADDRESS
};
