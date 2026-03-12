import { Connection, type Commitment, PublicKey } from "@solana/web3.js";

import { normalizeParsedTransaction } from "../parsers/activity-parser";
import type {
  ActivityPage,
  ActivityProvider,
  CreateSolanaWalletDataClientConfig,
  GetActivityOptions,
  SubscribeActivityOptions,
  WalletActivity,
  WalletDataLogger,
} from "../types";

export function createRpcActivityProvider(args: {
  rpcEndpoint: string;
  websocketEndpoint: string;
  commitment: Commitment;
  logger?: WalletDataLogger;
  config: Pick<
    CreateSolanaWalletDataClientConfig,
    "createRpcConnection" | "createWebsocketConnection"
  >;
}): ActivityProvider {
  let rpcConnection: Connection | null = null;
  let websocketConnection: Connection | null = null;
  const logger = args.logger ?? {};

  const getConnection = () => {
    if (rpcConnection) {
      return rpcConnection;
    }

    rpcConnection = args.config.createRpcConnection
      ? args.config.createRpcConnection(args.rpcEndpoint, args.commitment)
      : new Connection(args.rpcEndpoint, { commitment: args.commitment });

    return rpcConnection;
  };

  const getWebsocketConnection = () => {
    if (websocketConnection) {
      return websocketConnection;
    }

    websocketConnection = args.config.createWebsocketConnection
      ? args.config.createWebsocketConnection(
          args.rpcEndpoint,
          args.websocketEndpoint,
          args.commitment
        )
      : new Connection(args.rpcEndpoint, {
          commitment: args.commitment,
          wsEndpoint: args.websocketEndpoint,
        });

    return websocketConnection;
  };

  const getActivity = async (
    owner: PublicKey,
    options: GetActivityOptions = {}
  ): Promise<ActivityPage> => {
    const connection = getConnection();
    const signatures = await connection.getSignaturesForAddress(owner, {
      limit: options.limit ?? 10,
      before: options.before,
    });

    if (signatures.length === 0) {
      return { activities: [], nextCursor: undefined };
    }

    const signatureList = signatures.map((item) => item.signature);
    const parsedTransactions = await connection.getParsedTransactions(signatureList, {
      maxSupportedTransactionVersion: 0,
    });

    const activities: WalletActivity[] = [];
    for (let index = 0; index < parsedTransactions.length; index += 1) {
      const parsedTransaction = parsedTransactions[index];
      const signature = signatureList[index];
      if (!parsedTransaction) {
        continue;
      }

      const activity = normalizeParsedTransaction({
        tx: parsedTransaction,
        signature,
        walletAddress: owner.toBase58(),
        onlySystemTransfers: options.onlySystemTransfers ?? false,
      });

      if (activity) {
        activities.push(activity);
      }
    }

    return {
      activities,
      nextCursor: signatures[signatures.length - 1]?.signature,
    };
  };

  return {
    getActivity,
    subscribeActivity: async (
      owner,
      onActivity,
      options: SubscribeActivityOptions = {}
    ) => {
      const connection = getWebsocketConnection();
      const processedSignatures = new Set<string>();

      const rememberSignature = (signature: string) => {
        processedSignatures.add(signature);
        if (processedSignatures.size > 200) {
          const [first] = processedSignatures;
          processedSignatures.delete(first);
        }
      };

      const subscriptionId = await connection.onLogs(
        owner,
        async (logInfo) => {
          try {
            const signature = logInfo.signature;
            if (!signature || processedSignatures.has(signature)) {
              return;
            }

            rememberSignature(signature);

            const parsedTransaction = await connection.getParsedTransaction(signature, {
              maxSupportedTransactionVersion: 0,
            });
            if (!parsedTransaction) {
              return;
            }

            const activity = normalizeParsedTransaction({
              tx: parsedTransaction,
              signature,
              walletAddress: owner.toBase58(),
              onlySystemTransfers: options.onlySystemTransfers ?? false,
            });

            if (activity) {
              onActivity(activity);
            }
          } catch (error) {
            logger.error?.("Error handling wallet activity logs", error);
            options.onError?.(error);
          }
        },
        args.commitment
      );

      return async () => {
        await connection.removeOnLogsListener(subscriptionId);
      };
    },
  };
}
