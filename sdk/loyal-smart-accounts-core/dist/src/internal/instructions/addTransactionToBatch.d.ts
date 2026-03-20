import { AddressLookupTableAccount, PublicKey, TransactionMessage } from "@solana/web3.js";
export declare function addTransactionToBatch({ accountIndex, settingsPda, signer, rentPayer, batchIndex, transactionIndex, ephemeralSigners, transactionMessage, addressLookupTableAccounts, programId, }: {
    accountIndex: number;
    settingsPda: PublicKey;
    /** Member of the multisig that is adding the transaction. */
    signer: PublicKey;
    /** Payer for the transaction account rent. If not provided, `member` is used. */
    rentPayer?: PublicKey;
    batchIndex: bigint;
    transactionIndex: number;
    /** Number of additional signing PDAs required by the transaction. */
    ephemeralSigners: number;
    /** Transaction message to wrap into a batch transaction. */
    transactionMessage: TransactionMessage;
    /** `AddressLookupTableAccount`s referenced in `transaction_message`. */
    addressLookupTableAccounts?: AddressLookupTableAccount[];
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
