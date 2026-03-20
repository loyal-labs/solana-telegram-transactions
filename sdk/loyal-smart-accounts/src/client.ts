import type { Signer } from "@solana/web3.js";
import {
  createTransport,
  sendPreparedOperation,
  type LoyalSmartAccountsClientConfig,
  type LoyalSmartAccountsSendOptions,
  type PreparedLoyalSmartAccountsOperation,
} from "@loyal-labs/loyal-smart-accounts-core";
import {
  createProgramConfigClient,
  programConfig,
} from "./features/program-config/index.js";
import {
  createSmartAccountsClient,
  smartAccounts,
} from "./features/smart-accounts/index.js";
import {
  createProposalsClient,
  proposals,
} from "./features/proposals/index.js";
import {
  createTransactionsClient,
  transactions,
} from "./features/transactions/index.js";
import { batches, createBatchesClient } from "./features/batches/index.js";
import { policies, createPoliciesClient } from "./features/policies/index.js";
import {
  createSpendingLimitsClient,
  spendingLimits,
} from "./features/spending-limits/index.js";
import {
  createExecutionClient,
  execution,
} from "./features/execution/index.js";

export type {
  LoyalSmartAccountsClientConfig,
  LoyalSmartAccountsSendOptions,
  PreparedLoyalSmartAccountsOperation,
} from "@loyal-labs/loyal-smart-accounts-core";

export function createLoyalSmartAccountsClient(
  config: LoyalSmartAccountsClientConfig
) {
  const transport = createTransport(config);

  return {
    connection: transport.connection,
    programId: transport.programId,
    send(
      prepared: PreparedLoyalSmartAccountsOperation<string>,
      args: {
        signers: Signer[];
        sendOptions?: LoyalSmartAccountsSendOptions;
      }
    ) {
      return sendPreparedOperation({
        transport,
        prepared,
        signers: [...args.signers],
        sendOptions: args.sendOptions,
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
      execution,
    },
  };
}

export type LoyalSmartAccountsClient = ReturnType<
  typeof createLoyalSmartAccountsClient
>;
