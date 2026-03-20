import type {
  Commitment,
  Connection,
  GetAccountInfoConfig,
  PublicKey,
} from "@solana/web3.js";
import type {
  LoyalSmartAccountsSendOptions,
  PreparedLoyalSmartAccountsOperation,
  LoyalSmartAccountsTransport,
} from "@loyal-labs/loyal-smart-accounts-core";
import { sendPreparedOperation } from "@loyal-labs/loyal-smart-accounts-core";
import type {
  ClientArgs,
  LoyalSmartAccountsFeatureName,
  PrepareArgs,
  RuntimeOperationDefinition,
} from "./operation-registry.js";

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

export function createAccountFetcher<T>(accountClass: {
  fromAccountAddress(
    connection: Connection,
    address: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig
  ): Promise<T>;
}): QueryFunction {
  return (
    connection: Connection,
    address: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig
  ) => accountClass.fromAccountAddress(connection, address, commitmentOrConfig);
}

function bindQueries(
  queries: QueryFactories,
  connection: Connection
): Record<string, QueryFunction> {
  return Object.fromEntries(
    Object.entries(queries).map(([name, query]) => [
      name,
      (...args: any[]) => query(connection, ...args),
    ])
  );
}

function createPrepareApi(
  operations: OperationMap,
  connection?: Connection,
  defaultProgramId?: PublicKey
) {
  return Object.fromEntries(
    Object.entries(operations).map(([name, operation]) => [
      name,
      (args: PrepareArgs) =>
        operation.prepare({
          ...args,
          connection: args.connection ?? connection,
          programId: args.programId ?? defaultProgramId,
        }),
    ])
  );
}

function createInstructionsApi(operations: OperationMap) {
  return Object.fromEntries(
    Object.entries(operations)
      .filter(([, operation]) => typeof operation.instruction === "function")
      .map(([name, operation]) => [name, operation.instruction!])
  );
}

function createClientApi(
  operations: OperationMap,
  queries: QueryFactories,
  transport: LoyalSmartAccountsTransport
) {
  const prepare = createPrepareApi(
    operations,
    transport.connection,
    transport.programId
  );

  const methods = Object.fromEntries(
    Object.entries(operations).map(([name, operation]) => [
      name,
      async (args: ClientArgs) => {
        const prepared = (await prepare[name](
          operation.toPrepareArgsFromClientArgs(args)
        )) as PreparedLoyalSmartAccountsOperation<string>;

        return sendPreparedOperation({
          transport,
          prepared,
          signers: operation.resolveClientSigners(args),
          sendOptions: args.sendOptions as LoyalSmartAccountsSendOptions | undefined,
        });
      },
    ])
  );

  return {
    ...methods,
    prepare,
    queries: bindQueries(queries, transport.connection),
  };
}

export function createFeatureModule(args: {
  feature: LoyalSmartAccountsFeatureName;
  accounts: AccountsRecord;
  operations: OperationMap;
  queries: QueryFactories;
}): FeatureModule {
  return {
    accounts: args.accounts,
    instructions: createInstructionsApi(args.operations),
    prepare: createPrepareApi(args.operations),
    queries: args.queries,
    client: (transport: LoyalSmartAccountsTransport) =>
      createClientApi(args.operations, args.queries, transport),
  };
}
