import { PublicKey } from "@solana/web3.js";
export declare function createBatch({ settingsPda, creator, rentPayer, batchIndex, accountIndex, memo, programId, }: {
    settingsPda: PublicKey;
    /** Member of the multisig that is creating the batch. */
    creator: PublicKey;
    /** Payer for the batch account rent. If not provided, `creator` is used. */
    rentPayer?: PublicKey;
    batchIndex: bigint;
    accountIndex: number;
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
