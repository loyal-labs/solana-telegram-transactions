import { PublicKey } from "@solana/web3.js";
export declare function createProposal({ settingsPda, creator, rentPayer, transactionIndex, isDraft, programId, }: {
    settingsPda: PublicKey;
    /** Member of the multisig that is creating the proposal. */
    creator: PublicKey;
    /** Payer for the proposal account rent. If not provided, `creator` is used. */
    rentPayer?: PublicKey;
    transactionIndex: bigint;
    isDraft?: boolean;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
