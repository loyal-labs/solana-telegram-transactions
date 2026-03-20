import {
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import type {
  AddressLookupTableAccount,
  Commitment,
  Connection,
  PublicKey,
  SendOptions,
  Signer,
  TransactionInstruction,
} from "@solana/web3.js";
import { PROGRAM_ID } from "../generated/index.js";
import { translateAndThrowAnchorError } from "../errors/index.js";

export type PreparedLoyalSmartAccountsOperation<
  Name extends string = string,
> = Readonly<{
  operation: Name;
  payer: PublicKey;
  programId: PublicKey;
  instructions: readonly TransactionInstruction[];
  lookupTableAccounts: readonly AddressLookupTableAccount[];
}>;

export type LoyalSmartAccountsConfirmationContext = {
  prepared: PreparedLoyalSmartAccountsOperation<string>;
  blockhash: string;
  lastValidBlockHeight: number;
  commitment?: Commitment;
};

export type LoyalSmartAccountsSendPreparedContext = {
  blockhash: string;
  lastValidBlockHeight: number;
  commitment?: Commitment;
  sendOptions?: SendOptions;
  compileUnsignedTransaction: () => VersionedTransaction;
};

export type LoyalSmartAccountsSendPreparedFn = (
  prepared: PreparedLoyalSmartAccountsOperation<string>,
  signers: readonly Signer[],
  context: LoyalSmartAccountsSendPreparedContext
) => Promise<string>;

export type LoyalSmartAccountsConfirmFn = (
  signature: string,
  context: LoyalSmartAccountsConfirmationContext
) => Promise<void>;

export type LoyalSmartAccountsClientConfig = {
  connection: Connection;
  programId?: PublicKey;
  defaultCommitment?: Commitment;
  sendPrepared?: LoyalSmartAccountsSendPreparedFn;
  confirm?: LoyalSmartAccountsConfirmFn;
};

export type LoyalSmartAccountsTransport = {
  connection: Connection;
  programId: PublicKey;
  defaultCommitment?: Commitment;
  sendPrepared?: LoyalSmartAccountsSendPreparedFn;
  confirm?: LoyalSmartAccountsConfirmFn;
};

export type LoyalSmartAccountsSendOptions = SendOptions;

export function createTransport(
  config: LoyalSmartAccountsClientConfig
): LoyalSmartAccountsTransport {
  return {
    connection: config.connection,
    programId: config.programId ?? PROGRAM_ID,
    defaultCommitment: config.defaultCommitment,
    sendPrepared: config.sendPrepared,
    confirm: config.confirm,
  };
}

export function freezePreparedOperation<Name extends string>(
  operation: PreparedLoyalSmartAccountsOperation<Name>
): PreparedLoyalSmartAccountsOperation<Name> {
  return Object.freeze({
    ...operation,
    instructions: Object.freeze([...operation.instructions]),
    lookupTableAccounts: Object.freeze([...operation.lookupTableAccounts]),
  });
}

export function compilePreparedOperation(args: {
  prepared: PreparedLoyalSmartAccountsOperation<string>;
  blockhash: string;
}): VersionedTransaction {
  const message = new TransactionMessage({
    payerKey: args.prepared.payer,
    recentBlockhash: args.blockhash,
    instructions: [...args.prepared.instructions],
  }).compileToV0Message([...args.prepared.lookupTableAccounts]);

  return new VersionedTransaction(message);
}

export async function sendPreparedOperation(args: {
  transport: LoyalSmartAccountsTransport;
  prepared: PreparedLoyalSmartAccountsOperation<string>;
  signers: Signer[];
  sendOptions?: LoyalSmartAccountsSendOptions;
}): Promise<string> {
  const { transport, prepared, signers, sendOptions } = args;
  const latestBlockhash = await transport.connection.getLatestBlockhash(
    transport.defaultCommitment
  );

  try {
    const compileUnsignedTransaction = () =>
      compilePreparedOperation({
        prepared,
        blockhash: latestBlockhash.blockhash,
      });

    const signature = transport.sendPrepared
      ? await transport.sendPrepared(prepared, signers, {
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          commitment: transport.defaultCommitment,
          sendOptions,
          compileUnsignedTransaction,
        })
      : await (async () => {
          const transaction = compileUnsignedTransaction();
          transaction.sign(signers);
          return transport.connection.sendTransaction(transaction, sendOptions);
        })();

    if (transport.confirm) {
      await transport.confirm(signature, {
        prepared,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        commitment: transport.defaultCommitment,
      });
    }

    return signature;
  } catch (error) {
    translateAndThrowAnchorError(error);
    throw error;
  }
}
