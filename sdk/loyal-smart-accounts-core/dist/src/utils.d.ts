import { bignum } from "@metaplex-foundation/beet";
import { AccountMeta, AddressLookupTableAccount, Connection, MessageV0, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { SmartAccountTransactionMessage } from "./generated";
export declare function toUtfBytes(str: string): Uint8Array;
export declare function toU8Bytes(num: number): Uint8Array;
export declare function toU32Bytes(num: number): Uint8Array;
export declare function toU64Bytes(num: bigint): Uint8Array;
export declare function toU128Bytes(num: bigint): Uint8Array;
export declare function toBigInt(number: bignum): bigint;
export declare function getAvailableMemoSize(txWithoutMemo: VersionedTransaction): number;
export declare function isStaticWritableIndex(message: SmartAccountTransactionMessage, index: number): boolean;
export declare function isSignerIndex(message: SmartAccountTransactionMessage, index: number): boolean;
/** We use custom serialization for `transaction_message` that ensures as small byte size as possible. */
export declare function transactionMessageToMultisigTransactionMessageBytes({ message, addressLookupTableAccounts, smartAccountPda, }: {
    message: TransactionMessage;
    addressLookupTableAccounts?: AddressLookupTableAccount[];
    smartAccountPda: PublicKey;
}): {
    transactionMessageBytes: Uint8Array;
    compiledMessage: MessageV0;
};
export declare function instructionsToSynchronousTransactionDetails({ vaultPda, members, transaction_instructions, }: {
    vaultPda: PublicKey;
    members: PublicKey[];
    transaction_instructions: TransactionInstruction[];
}): {
    instructions: Uint8Array;
    accounts: AccountMeta[];
};
export declare function instructionsToSynchronousTransactionDetailsV2({ vaultPda, members, transaction_instructions, }: {
    vaultPda: PublicKey;
    members: PublicKey[];
    transaction_instructions: TransactionInstruction[];
}): {
    instructions: Uint8Array;
    accounts: AccountMeta[];
};
export declare function instructionsToSynchronousTransactionDetailsV2WithHooks({ vaultPda, members, preHookAccounts, postHookAccounts, transaction_instructions, }: {
    vaultPda: PublicKey;
    members: PublicKey[];
    preHookAccounts: AccountMeta[];
    postHookAccounts: AccountMeta[];
    transaction_instructions: TransactionInstruction[];
}): {
    instructions: Uint8Array;
    accounts: AccountMeta[];
};
/** Populate remaining accounts required for execution of the transaction. */
export declare function accountsForTransactionExecute({ connection, transactionPda, smartAccountPda, message, ephemeralSignerBumps, programId, }: {
    connection: Connection;
    message: SmartAccountTransactionMessage;
    ephemeralSignerBumps: number[];
    smartAccountPda: PublicKey;
    transactionPda: PublicKey;
    programId?: PublicKey;
}): Promise<{
    /** Account metas used in the `message`. */
    accountMetas: AccountMeta[];
    /** Address lookup table accounts used in the `message`. */
    lookupTableAccounts: AddressLookupTableAccount[];
}>;
